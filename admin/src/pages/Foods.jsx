import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Button from '../components/Button'
import FoodFormModal from '../components/FoodFormModal'
import { foodApi, categoryApi } from '../lib/endpoints'
import { formatNaira } from '../lib/format'

export default function Foods() {
  const [foods, setFoods] = useState(null)
  const [categories, setCategories] = useState([])
  const [includeArchived, setIncludeArchived] = useState(false)
  const [editingFood, setEditingFood] = useState(undefined) // undefined = closed, null = create, object = edit
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    foodApi.list(includeArchived).then(setFoods).catch(() => setFoods([]))
  }

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setFoods(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived])

  const withBusy = async (id, fn) => {
    setBusyId(id)
    try {
      await fn()
      load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Layout
      title="Foods"
      action={
        <Button onClick={() => setEditingFood(null)} disabled={categories.length === 0}>
          + Add food
        </Button>
      }
    >
      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} className="rounded border-border" />
        Show archived
      </label>

      <div className="bg-surface border border-border rounded-xl2 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Food</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {foods === null ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">Loading...</td>
              </tr>
            ) : foods.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">No foods yet. Add your first one.</td>
              </tr>
            ) : (
              foods.map((f) => (
                <tr key={f.id} className={f.is_archived ? 'opacity-50' : ''}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={f.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-cream" />
                      <div>
                        <p className="font-medium">{f.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {f.is_featured && <Tag color="gold">Featured</Tag>}
                          {f.is_popular && <Tag color="primary">Popular</Tag>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{f.category_slug}</td>
                  <td className="px-5 py-3">{formatNaira(f.price)}</td>
                  <td className="px-5 py-3">
                    {f.quantity_available} / {f.daily_quantity}
                  </td>
                  <td className="px-5 py-3">
                    {f.is_sold_out ? (
                      <Tag color="danger">Sold out</Tag>
                    ) : f.is_low_stock ? (
                      <Tag color="warn">Low stock</Tag>
                    ) : (
                      <Tag color="success">In stock</Tag>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2 text-xs font-medium">
                      <button onClick={() => setEditingFood(f)} className="text-primary">Edit</button>
                      {!f.is_sold_out && (
                        <button
                          onClick={() => withBusy(f.id, () => foodApi.markSoldOut(f.id))}
                          disabled={busyId === f.id}
                          className="text-warn"
                        >
                          Mark sold out
                        </button>
                      )}
                      <button
                        onClick={() => withBusy(f.id, () => (f.is_archived ? foodApi.unarchive(f.id) : foodApi.archive(f.id)))}
                        disabled={busyId === f.id}
                        className="text-muted"
                      >
                        {f.is_archived ? 'Unarchive' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {editingFood !== undefined && (
        <FoodFormModal
          food={editingFood}
          categories={categories}
          onClose={() => setEditingFood(undefined)}
          onSaved={() => {
            setEditingFood(undefined)
            load()
          }}
        />
      )}
    </Layout>
  )
}

function Tag({ children, color }) {
  const styles = {
    gold: 'bg-gold-light text-gold',
    primary: 'bg-primary-light text-primary',
    danger: 'bg-danger/10 text-danger',
    warn: 'bg-warn/10 text-warn',
    success: 'bg-success/10 text-success'
  }
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${styles[color]}`}>{children}</span>
}
