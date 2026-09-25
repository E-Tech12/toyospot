import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Button from '../components/Button'
import RankedBarList from '../components/RankedBarList'
import { foodApi, analyticsApi } from '../lib/endpoints'

function RestockRow({ food, onRestocked }) {
  const [value, setValue] = useState(food.quantity_available)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const updated = await foodApi.restock(food.id, Number(value))
      onRestocked(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <img src={food.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-cream" />
          <p className="font-medium">{food.name}</p>
        </div>
      </td>
      <td className="px-5 py-3 text-muted">{food.daily_quantity}</td>
      <td className="px-5 py-3">
        {food.is_sold_out ? (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-danger/10 text-danger">Sold out</span>
        ) : (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-warn/10 text-warn">Low stock</span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-20 rounded-lg border border-border px-2.5 py-1.5 text-sm"
          />
          <Button onClick={save} loading={saving} className="!px-3 !py-1.5 text-xs">
            Restock
          </Button>
        </div>
      </td>
    </tr>
  )
}

export default function Inventory() {
  const [lowStock, setLowStock] = useState(null)
  const [usage, setUsage] = useState(null)

  const load = () => {
    foodApi.lowStock().then(setLowStock).catch(() => setLowStock([]))
    analyticsApi.inventoryUsage().then(setUsage).catch(() => setUsage([]))
  }

  useEffect(load, [])

  const handleRestocked = () => {
    load()
  }

  return (
    <Layout title="Inventory">
      <div className="space-y-8">
        <div>
          <h2 className="font-semibold mb-3">Needs attention</h2>
          <div className="bg-surface border border-border rounded-xl2 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Food</th>
                  <th className="px-5 py-3 font-medium">Daily qty</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Restock to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lowStock === null ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-muted">Loading...</td></tr>
                ) : lowStock.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-muted">Nothing low or sold out. 🎉</td></tr>
                ) : (
                  lowStock.map((f) => <RestockRow key={f.id} food={f} onRestocked={handleRestocked} />)
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Today&apos;s stock usage</h2>
          <p className="text-sm text-muted mb-4">Share of each food&apos;s daily quantity sold so far today.</p>
          <div className="bg-surface border border-border rounded-xl2 p-5">
            {usage === null ? (
              <p className="text-sm text-muted text-center py-6">Loading...</p>
            ) : (
              <RankedBarList
                items={usage.filter((u) => u.daily_quantity > 0).sort((a, b) => b.usage_pct - a.usage_pct)}
                labelKey="name"
                valueKey="usage_pct"
                formatValue={(v) => `${v}%`}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
