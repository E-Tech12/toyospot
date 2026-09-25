import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatNaira, formatRelativeTime } from '../../lib/format'
import { ORDER_STATUS_LABEL } from '../../mock/data'
import { orderApi } from '../../lib/endpoints'
import { useFavorites } from '../../context/FavoritesContext'
import FoodCard from '../../components/FoodCard'

export default function DashboardOverview() {
  const { favorites } = useFavorites()
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    orderApi.listMine().then(setOrders).catch(() => setOrders([]))
  }, [])

  const activeOrder = orders?.find((o) => !['delivered', 'cancelled'].includes(o.status))
  const recentOrders = orders?.slice(0, 3) || []

  return (
    <div className="space-y-10">
      {activeOrder && (
        <div className="bg-primary-light/50 border border-primary-light rounded-xl2 p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Active order</p>
            <p className="font-display text-lg font-medium mt-1">
              {activeOrder.order_number} · {ORDER_STATUS_LABEL[activeOrder.status]}
            </p>
            <p className="text-sm text-muted mt-0.5">{activeOrder.item_count} items · {formatRelativeTime(activeOrder.created_at)}</p>
          </div>
          <Link
            to={`/dashboard/orders/${activeOrder.id}`}
            className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            Track order
          </Link>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent orders</h2>
          <Link to="/dashboard/orders" className="text-sm text-primary font-medium">
            View all
          </Link>
        </div>
        {orders === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-border rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-muted">No orders yet. Your first order will show up here.</p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                to={`/dashboard/orders/${o.id}`}
                className="flex items-center justify-between py-4 hover:bg-surface/60 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{o.order_number} · {o.first_item_name}{o.item_count > 1 ? ` + ${o.item_count - 1} more` : ''}</p>
                  <p className="text-xs text-muted mt-0.5">{formatRelativeTime(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatNaira(o.grand_total)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {favorites.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Your favorites</h2>
            <Link to="/dashboard/favorites" className="text-sm text-primary font-medium">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {favorites.slice(0, 4).map((f) => (
              <FoodCard key={f.id} food={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-gold-light text-warn',
    accepted: 'bg-primary-light text-primary',
    preparing: 'bg-primary-light text-primary',
    ready: 'bg-primary-light text-primary',
    out_for_delivery: 'bg-primary-light text-primary',
    delivered: 'bg-success/10 text-success',
    cancelled: 'bg-danger/10 text-danger'
  }
  return (
    <span className={`inline-block text-[11px] font-semibold px-2 py-1 rounded-full mt-1 ${styles[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  )
}
