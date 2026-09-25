import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import FormField from '../components/FormField'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  const [form, setForm] = useState({ email, code: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.code) {
      setError('Enter your email and the reset code we sent you.')
      return
    }
    if (form.password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(form.email, form.code, form.password)
      navigate('/login')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That code is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Almost done" title="Set a new password" subtitle="Enter the reset code from your email and choose a new password.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
        />
        <FormField
          label="Reset code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="4-digit code"
          inputMode="numeric"
        />
        <FormField
          label="New password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="At least 6 characters"
        />
        <FormField
          label="Confirm password"
          type="password"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          placeholder="Re-enter password"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Reset password
        </Button>
      </form>
    </AuthShell>
  )
}
