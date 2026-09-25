import { useState } from 'react'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import { useAuth } from '../../context/AuthContext'
import { ApiError } from '../../lib/api'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone || ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateProfile(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <FormField label="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      </div>
      <FormField label="Email" type="email" value={user.email} disabled />
      <FormField label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-4">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
        {saved && <span className="text-sm text-success font-medium">Saved ✓</span>}
      </div>
    </form>
  )
}
