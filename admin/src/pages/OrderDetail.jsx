import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { SelectField } from '../components/FormField'
import { orderApi } from '../lib/endpoints'
import { formatDateTime, formatNaira, formatRelativeTime, NEXT_STATUSES, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '../lib/format'
import { StatusPill } from './Orders'
import { ApiError } from '../lib/api'
import { useOrderChat } from '../hooks/useOrderChat'

const ORDER_POLL_INTERVAL_MS = 8000

export default function OrderDetail() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [draft, setDraft] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState('')
  const chatEndRef = useRef(null)

  const { messages, connected, sendMessage } = useOrderChat(orderId)

  const loadOrder = useCallback(() => {
    orderApi.get(orderId).then(setOrder).catch(() => {})
  }, [orderId])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  // Status/payment changes don't travel over the chat socket, so keep a
  // light poll for the order object itself -- messages are instant via the
  // socket, status updates refresh within a few seconds.
  useEffect(() => {
    const interval = setInterval(loadOrder, ORDER_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadOrder])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!order) {
    return (
      <Layout title="Order">
        <div className="h-64 bg-border rounded-xl2 animate-pulse" />
      </Layout>
    )
  }

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true)
    setError('')
    try {
      const updated = await orderApi.updateStatus(order.id, newStatus)
      setOrder(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the order status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePaymentStatusChange = async (paymentStatus) => {
    try {
      const updated = await orderApi.updatePaymentStatus(order.id, paymentStatus)
      setOrder(updated)
    } catch {
      // surfaced via the select reverting; good enough for an admin tool
    }
  }

  const sendChat = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    if (sendMessage(text)) setDraft('')
  }

  const nextStatuses = NEXT_STATUSES[order.status] || []

  return (
    <Layout>
      <div className="mb-6">
        <Link to="/orders" className="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-4">
          ← All orders
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-medium">Order {order.order_number}</h1>
            <p className="text-sm text-muted mt-1">Placed {formatDateTime(order.created_at)}</p>
          </div>
          <StatusPill status={order.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,1fr] gap-8">
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl2 p-6">
            <h2 className="font-semibold mb-4">Update status</h2>
            {order.status === 'cancelled' || order.status === 'delivered' ? (
              <p className="text-sm text-muted">This order is in a final state and can't be changed further.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    variant={s === 'cancelled' ? 'danger' : 'primary'}
                    loading={updatingStatus}
                    onClick={() => handleStatusChange(s)}
                    className="!px-4 !py-2 text-xs"
                  >
                    Mark {ORDER_STATUS_LABEL[s]}
                  </Button>
                ))}
              </div>
            )}
            {error && <p className="text-sm text-danger mt-3">{error}</p>}

            <div className="mt-5 pt-5 border-t border-border">
              <SelectField label="Payment status" value={order.payment_status} onChange={(e) => handlePaymentStatusChange(e.target.value)}>
                {Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </SelectField>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl2 p-6">
            <h2 className="font-semibold mb-4">Customer &amp; delivery</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Name" value={order.full_name} />
              <Row label="Phone" value={order.phone} />
              <Row label="Address" value={order.address_line} />
              {order.notes && <Row label="Notes" value={order.notes} />}
            </dl>
          </div>

          <div className="bg-surface border border-border rounded-xl2 p-6">
            <h2 className="font-semibold mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((i) => (
                <div key={i.food_id} className="flex items-center gap-3">
                  <img src={i.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-cream" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{i.name}</p>
                    <p className="text-muted text-xs">Qty {i.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatNaira(i.price * i.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Item total</span>
                <span className="text-ink font-medium">{formatNaira(order.item_total)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery fee</span>
                <span className="text-ink font-medium">{formatNaira(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1.5 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatNaira(order.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl2 flex flex-col h-[600px]">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Chat with {order.full_name}</h2>
            <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-success' : 'bg-border'}`} title={connected ? 'Live' : 'Connecting...'} />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 && <p className="text-sm text-muted text-center mt-10">No messages yet.</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.sender === 'admin' ? 'bg-primary text-white rounded-br-sm' : 'bg-cream border border-border rounded-bl-sm'
                  }`}
                >
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.sender === 'admin' ? 'text-white/70' : 'text-muted'}`}>
                    {formatRelativeTime(m.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChat} className="p-3 border-t border-border flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={connected ? 'Reply to the customer...' : 'Connecting...'}
              disabled={!connected}
              className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!connected}
              className="w-10 h-10 rounded-full bg-primary text-white grid place-items-center shrink-0 disabled:opacity-60"
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted w-20 shrink-0">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
