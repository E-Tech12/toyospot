import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatNaira, formatRelativeTime } from '../../lib/format'
import { orderApi } from '../../lib/endpoints'
import { StatusBadge } from './Overview'

export default function Orders() {
  const location = useLocation()
  const [showToast, setShowToast] = useState(!!location.state?.justPlaced)
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    orderApi.listMine().then(setOrders).catch(() => setOrders([]))
  }, [])

  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(t)
    }
  }, [showToast])

  return (
    <div>
      {showToast && (
        <div className="bg-success/10 text-success text-sm font-medium rounded-xl p-4 mb-6">
          Order placed! We'll notify you as soon as it's accepted.
        </div>
      )}

      {orders === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display text-xl">No orders yet</p>
          <p className="text-sm text-muted mt-2">Your order history will show up here once you place one.</p>
          <Link to="/menu" className="inline-block mt-6 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-full">
            Browse the menu
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/dashboard/orders/${o.id}`}
              className="flex items-center gap-4 py-5 hover:bg-surface/60 -mx-2 px-2 rounded-lg transition-colors"
            >
              <img src={o.first_item_image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-border" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{o.order_number}</p>
                <p className="text-xs text-muted mt-0.5 truncate">
                  {o.first_item_name}
                  {o.item_count > 1 ? ` + ${o.item_count - 1} more item${o.item_count - 1 > 1 ? 's' : ''}` : ''}
                </p>
                <p className="text-xs text-muted mt-0.5">{formatRelativeTime(o.created_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatNaira(o.grand_total)}</p>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
