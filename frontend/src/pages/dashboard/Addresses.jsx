import { useEffect, useState } from 'react'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import { addressApi } from '../../lib/endpoints'
import { ApiError } from '../../lib/api'

const EMPTY_FORM = { label: '', line1: '', city: '', phone: '', is_default: false }

export default function Addresses() {
  const [addresses, setAddresses] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => addressApi.list().then(setAddresses).catch(() => setAddresses([]))

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.label || !form.line1) return
    setSaving(true)
    setError('')
    try {
      await addressApi.create(form)
      setForm(EMPTY_FORM)
      setAdding(false)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this address.')
    } finally {
      setSaving(false)
    }
  }

  const setDefault = async (address) => {
    await addressApi.update(address.id, { ...address, is_default: true })
    load()
  }

  const remove = async (id) => {
    await addressApi.remove(id)
    load()
  }

  if (addresses === null) {
    return (
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 bg-border rounded-xl2 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="space-y-4">
        {addresses.map((a) => (
          <div key={a.id} className="border border-border rounded-xl2 p-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{a.label}</p>
                {a.is_default && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary">Default</span>
                )}
              </div>
              <p className="text-sm text-muted mt-1">{a.line1}{a.city ? `, ${a.city}` : ''}</p>
              {a.phone && <p className="text-sm text-muted">{a.phone}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0 text-xs font-medium">
              {!a.is_default && (
                <button onClick={() => setDefault(a)} className="text-primary">
                  Set default
                </button>
              )}
              <button onClick={() => remove(a.id)} className="text-danger">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <form onSubmit={handleAdd} className="border border-border rounded-xl2 p-5 mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Office..." />
            <FormField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 800 000 0000" />
          </div>
          <FormField label="Address" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="Street, area" />
          <FormField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Lagos" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" loading={saving}>Save address</Button>
            <Button type="button" variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" className="mt-4" onClick={() => setAdding(true)}>
          + Add new address
        </Button>
      )}
    </div>
  )
}
