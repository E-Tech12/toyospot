import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import FormField from '../components/FormField'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.firstName || !form.email || !form.password) {
      setError('Fill in your name, email and a password to continue.')
      return
    }
    if (form.password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await signup(form)
      navigate('/verify-otp', { state: { email: form.email } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Join Toyo's Pot"
      title="Create your account"
      subtitle="We'll send a one-time code to verify your email."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Chiamaka"
            autoComplete="given-name"
          />
          <FormField
            label="Last name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Nwosu"
            autoComplete="family-name"
          />
        </div>
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <FormField
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+234 800 000 0000"
          autoComplete="tel"
        />
        <FormField
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
        <p className="text-xs text-muted leading-relaxed">
          By continuing, you agree to Toyo&apos;s Pot&apos;s terms and privacy practices.
        </p>
      </form>
    </AuthShell>
  )
}
