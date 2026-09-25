import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import FormField from '../components/FormField'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell eyebrow="Check your inbox" title="Reset code sent" subtitle={`If an account exists for ${email}, we've emailed a reset code.`}>
        <div className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            Enter the code from that email on the next screen to set a new password.
          </p>
          <Button className="w-full" onClick={() => navigate('/reset-password', { state: { email } })}>
            Enter reset code
          </Button>
          <Link to="/login" className="block text-sm text-center text-muted">
            Back to log in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send a reset code."
      footer={
        <Link to="/login" className="text-primary font-semibold">
          ← Back to log in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Send reset code
        </Button>
      </form>
    </AuthShell>
  )
}
