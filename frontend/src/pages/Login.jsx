import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import FormField from '../components/FormField'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Enter your email and password to continue.')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate(location.state?.from || '/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your account"
      subtitle="Order your usual, or pick up where you left off."
      footer={
        <>
          New to Toyo&apos;s Pot?{' '}
          <Link to="/signup" className="text-primary font-semibold">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
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
        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm text-primary font-medium">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
    </AuthShell>
  )
}
