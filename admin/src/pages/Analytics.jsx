import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import BarChart from '../components/BarChart'
import RankedBarList from '../components/RankedBarList'
import { analyticsApi } from '../lib/endpoints'
import { formatNaira } from '../lib/format'

export default function Analytics() {
  const [ordersPerDay, setOrdersPerDay] = useState(null)
  const [bestSellers, setBestSellers] = useState(null)
  const [customerGrowth, setCustomerGrowth] = useState(null)
  const [inventoryUsage, setInventoryUsage] = useState(null)

  useEffect(() => {
    analyticsApi.ordersPerDay(14).then(setOrdersPerDay).catch(() => setOrdersPerDay([]))
    analyticsApi.bestSellers(8).then(setBestSellers).catch(() => setBestSellers([]))
    analyticsApi.customerGrowth(30).then(setCustomerGrowth).catch(() => setCustomerGrowth([]))
    analyticsApi.inventoryUsage().then(setInventoryUsage).catch(() => setInventoryUsage([]))
  }, [])

  return (
    <Layout title="Analytics">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl2 p-6">
          <h2 className="font-semibold mb-1">Revenue, last 14 days</h2>
          <p className="text-sm text-muted mb-5">Daily revenue from non-cancelled orders.</p>
          {ordersPerDay === null ? (
            <div className="h-[220px] bg-border rounded animate-pulse" />
          ) : (
            <BarChart data={ordersPerDay} xKey="date" yKey="revenue" formatY={formatNaira} />
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl2 p-6">
          <h2 className="font-semibold mb-1">Orders, last 14 days</h2>
          <p className="text-sm text-muted mb-5">Number of orders placed per day.</p>
          {ordersPerDay === null ? (
            <div className="h-[220px] bg-border rounded animate-pulse" />
          ) : (
            <BarChart data={ordersPerDay} xKey="date" yKey="orders" color="#C98A2C" />
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl2 p-6">
          <h2 className="font-semibold mb-1">Best selling meals</h2>
          <p className="text-sm text-muted mb-5">By units sold, all time.</p>
          {bestSellers === null ? (
            <p className="text-sm text-muted text-center py-6">Loading...</p>
          ) : (
            <RankedBarList items={bestSellers} labelKey="name" valueKey="quantity_sold" formatValue={(v) => `${v} sold`} />
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl2 p-6">
          <h2 className="font-semibold mb-1">Customer growth, last 30 days</h2>
          <p className="text-sm text-muted mb-5">New accounts created per day.</p>
          {customerGrowth === null ? (
            <div className="h-[220px] bg-border rounded animate-pulse" />
          ) : (
            <BarChart data={customerGrowth} xKey="date" yKey="new_customers" color="#3F7D4E" />
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl2 p-6 lg:col-span-2">
          <h2 className="font-semibold mb-1">Inventory usage today</h2>
          <p className="text-sm text-muted mb-5">Share of each food&apos;s daily quantity sold so far today.</p>
          {inventoryUsage === null ? (
            <p className="text-sm text-muted text-center py-6">Loading...</p>
          ) : (
            <RankedBarList
              items={inventoryUsage.filter((u) => u.daily_quantity > 0).sort((a, b) => b.usage_pct - a.usage_pct).slice(0, 10)}
              labelKey="name"
              valueKey="usage_pct"
              formatValue={(v) => `${v}%`}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}
