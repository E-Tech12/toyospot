import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { orderApi } from '../lib/endpoints'
import { formatNaira, formatRelativeTime, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '../lib/format'

const STATUS_FILTERS = ['', 'pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') || ''
  const customerId = searchParams.get('customer') || ''
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    setOrders(null)
    orderApi
      .list({ status: statusFilter || undefined, customerId: customerId || undefined })
      .then(setOrders)
      .catch(() => setOrders([]))
  }, [statusFilter, customerId])

  return (
    <Layout title="Orders">
      {customerId && (
        <div className="bg-primary-light/50 border border-primary-light rounded-xl2 px-4 py-3 mb-4 flex items-center justify-between text-sm">
          <span>Showing orders for one customer</span>
          <button
            onClick={() => setSearchParams(statusFilter ? { status: statusFilter } : {})}
            className="font-semibold text-primary"
          >
            Clear filter
          </button>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams({ ...(s ? { status: s } : {}), ...(customerId ? { customer: customerId } : {}) })}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === s ? 'bg-ink text-white border-ink' : 'bg-surface border-border text-muted hover:border-ink/30'
            }`}
          >
            {s ? ORDER_STATUS_LABEL[s] : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl2 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders === null ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">No orders here yet.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream/60">
                  <td className="px-5 py-3">
                    <Link to={`/orders/${o.id}`} className="font-medium text-primary">{o.order_number}</Link>
                  </td>
                  <td className="px-5 py-3">{o.full_name}</td>
                  <td className="px-5 py-3 font-medium">{formatNaira(o.grand_total)}</td>
                  <td className="px-5 py-3 text-muted">{PAYMENT_STATUS_LABEL[o.payment_status]}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-muted">{formatRelativeTime(o.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

function StatusPill({ status }) {
  const styles = {
    pending: 'bg-gold-light text-gold',
    accepted: 'bg-primary-light text-primary',
    preparing: 'bg-primary-light text-primary',
    ready: 'bg-primary-light text-primary',
    out_for_delivery: 'bg-primary-light text-primary',
    delivered: 'bg-success/10 text-success',
    cancelled: 'bg-danger/10 text-danger'
  }
  return <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${styles[status]}`}>{ORDER_STATUS_LABEL[status]}</span>
}

export { StatusPill }
