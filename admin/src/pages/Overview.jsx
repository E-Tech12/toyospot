import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { analyticsApi } from '../lib/endpoints'
import { formatNaira } from '../lib/format'

export default function Overview() {
  const [data, setData] = useState(null)

  useEffect(() => {
    analyticsApi.overview().then(setData).catch(() => setData(null))
  }, [])

  return (
    <Layout title="Overview">
      {!data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-border rounded-xl2 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Today's Revenue" value={formatNaira(data.revenue_today)} />
          <StatCard label="Weekly Revenue" value={formatNaira(data.revenue_week)} />
          <StatCard label="Monthly Revenue" value={formatNaira(data.revenue_month)} />
          <StatCard label="Orders Today" value={data.orders_today} />
          <StatCard label="Pending Orders" value={data.pending_orders} tone={data.pending_orders > 0 ? 'warn' : 'default'} />
          <StatCard label="Delivered Orders" value={data.delivered_orders} tone="success" />
          <StatCard
            label="Low Stock Foods"
            value={data.low_stock_foods}
            tone={data.low_stock_foods > 0 ? 'danger' : 'default'}
            sublabel={data.low_stock_foods > 0 ? 'Check Inventory' : 'All good'}
          />
        </div>
      )}
    </Layout>
  )
}
