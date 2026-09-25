import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

const OTP_LENGTH = 4

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(30)
  const [resending, setResending] = useState(false)
  const inputsRef = useRef([])

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true })
    }
  }, [email, navigate])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleChange = (i, val) => {
    if (val && !/^\d$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const code = digits.join('')
    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code we sent to your email.`)
      return
    }
    setLoading(true)
    try {
      await verifyOtp({ email, code })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That code is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      await resendOtp(email)
      setResendCooldown(30)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend the code. Try again shortly.')
    } finally {
      setResending(false)
    }
  }

  if (!email) return null

  return (
    <AuthShell
      eyebrow="One last step"
      title="Verify your email"
      subtitle={`We sent a ${OTP_LENGTH}-digit code to ${email}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="w-14 h-14 text-center text-xl font-semibold rounded-lg border border-border focus:border-primary transition-colors"
            />
          ))}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Verify &amp; continue
        </Button>
        <p className="text-sm text-muted">
          Didn&apos;t get a code?{' '}
          {resendCooldown > 0 ? (
            <span>Resend in {resendCooldown}s</span>
          ) : (
            <button type="button" disabled={resending} onClick={handleResend} className="text-primary font-semibold disabled:opacity-60">
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </p>
        <Link to="/signup" className="block text-sm text-muted">
          ← Use a different email
        </Link>
      </form>
    </AuthShell>
  )
}
