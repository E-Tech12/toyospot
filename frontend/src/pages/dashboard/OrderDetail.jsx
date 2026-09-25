import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import StatusTimeline from '../../components/StatusTimeline'
import Button from '../../components/Button'
import { formatDateTime, formatNaira, formatRelativeTime } from '../../lib/format'
import { PAYMENT_STATUS_LABEL } from '../../mock/data'
import { orderApi, paymentApi } from '../../lib/endpoints'
import { ApiError } from '../../lib/api'
import { openPaystackPopup } from '../../lib/paystack'
import { useAuth } from '../../context/AuthContext'
import { useOrderChat } from '../../hooks/useOrderChat'

export default function OrderDetail() {
  const { orderId } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [draft, setDraft] = useState('')
  const [payingAgain, setPayingAgain] = useState(false)
  const [payError, setPayError] = useState('')
  const chatEndRef = useRef(null)

  const { messages, connected, sendMessage } = useOrderChat(order?.id)

  useEffect(() => {
    orderApi
      .get(orderId)
      .then(setOrder)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
      })
  }, [orderId])

  // The chat socket also carries live order-status pushes indirectly (a
  // status change doesn't arrive over this socket), so keep a light poll
  // just for the order object itself -- messages are instant, status
  // updates refresh within a few seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      orderApi.get(orderId).then(setOrder).catch(() => {})
    }, 8000)
    return () => clearInterval(interval)
  }, [orderId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (notFound) return <Navigate to="/dashboard/orders" replace />
  if (!order) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-border rounded w-1/3" />
        <div className="h-40 bg-border rounded-xl2" />
      </div>
    )
  }

  const sendChat = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    if (sendMessage(text)) setDraft('')
  }

  const retryPayment = async () => {
    setPayingAgain(true)
    setPayError('')
    try {
      const init = await paymentApi.initialize(order.id)
      openPaystackPopup({
        publicKey: init.public_key,
        email: user.email,
        amountNaira: init.amount,
        reference: init.reference,
        onSuccess: async (reference) => {
          try {
            const updated = await paymentApi.verify(order.id, reference)
            setOrder(updated)
          } catch {
            setPayError('Payment succeeded but confirming it failed -- refresh in a moment.')
          }
          setPayingAgain(false)
        },
        onCancel: () => setPayingAgain(false)
      })
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Could not start payment. Please try again.')
      setPayingAgain(false)
    }
  }

  const needsPayment = order.payment_method === 'online' && order.payment_status === 'unpaid' && order.status !== 'cancelled'

  return (
    <div>
      <Link to="/dashboard/orders" className="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-6">
        ← All orders
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium">Order {order.order_number}</h1>
          <p className="text-sm text-muted mt-1">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-light text-primary">
          {PAYMENT_STATUS_LABEL[order.payment_status]}
        </span>
      </div>

      {needsPayment && (
        <div className="bg-warn/10 border border-warn/30 rounded-xl2 p-4 mb-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold">This order hasn&apos;t been paid for yet</p>
            {(location.state?.paymentCancelled || location.state?.paymentFailedToStart) && (
              <p className="text-xs text-muted mt-0.5">Your payment attempt didn&apos;t go through.</p>
            )}
            {payError && <p className="text-xs text-danger mt-0.5">{payError}</p>}
          </div>
          <Button onClick={retryPayment} loading={payingAgain} className="!px-4 !py-2 text-xs shrink-0">
            Complete payment
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr,1fr] gap-10">
        <div className="space-y-8">
          <div className="bg-surface border border-border rounded-xl2 p-6">
            <h2 className="font-semibold mb-5">Order status</h2>
            <StatusTimeline status={order.status} />
          </div>

          <div className="bg-surface border border-border rounded-xl2 p-6">
            <h2 className="font-semibold mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((i) => (
                <div key={i.food_id} className="flex items-center gap-3">
                  <img src={i.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-border" />
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

          <div className="bg-surface border border-border rounded-xl2 p-6">
            <h2 className="font-semibold mb-3">Delivery details</h2>
            <p className="text-sm"><span className="text-muted">Address:</span> {order.address_line}</p>
            <p className="text-sm mt-1"><span className="text-muted">Phone:</span> {order.phone}</p>
            {order.notes && <p className="text-sm mt-1"><span className="text-muted">Notes:</span> {order.notes}</p>}
          </div>
        </div>

        {/* Order-specific chat */}
        <div className="bg-surface border border-border rounded-xl2 flex flex-col h-[520px]">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">Chat about order {order.order_number}</h2>
              <p className="text-xs text-muted mt-0.5">Talk directly with Toyo&apos;s Pot about this order.</p>
            </div>
            <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-success' : 'bg-border'}`} title={connected ? 'Live' : 'Connecting...'} />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted text-center mt-10">No messages yet. Say hello!</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.sender === 'customer' ? 'bg-primary text-white rounded-br-sm' : 'bg-cream border border-border rounded-bl-sm'
                  }`}
                >
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.sender === 'customer' ? 'text-white/70' : 'text-muted'}`}>
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
              placeholder={connected ? 'Type a message...' : 'Connecting...'}
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
    </div>
  )
}
