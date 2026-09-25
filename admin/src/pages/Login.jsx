import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { FormField } from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface rounded-xl2 p-8">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-full bg-primary text-white grid place-items-center font-display font-semibold">T</span>
          <div>
            <p className="font-display text-lg font-semibold leading-tight">Toyo&apos;s Pot</p>
            <p className="text-xs text-muted leading-tight">Admin dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="admin@toyospot.ng"
            autoComplete="email"
          />
          <FormField
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Log in
          </Button>
        </form>
      </div>
    </div>
  )
}
