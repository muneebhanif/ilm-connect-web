import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { AlertCircle, ArrowRight, CheckCircle2, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { api, apiFetch } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'

const RESEND_DELAY_SECONDS = 60

export default function VerifyEmail() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState((searchParams.get('email') || '').trim().toLowerCase())
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.verificationMessage || '')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  if (user?.role) return <Navigate to="/dashboard" replace />

  const verify = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    const normalizedCode = code.replace(/\D/g, '').slice(0, 6)
    if (!email || normalizedCode.length !== 6) {
      setError('Enter your email and the 6-digit verification code.')
      return
    }

    setVerifying(true)
    try {
      const result = await apiFetch(api.verifyEmail(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: normalizedCode }),
      })
      navigate('/login', {
        replace: true,
        state: { signupSuccess: result?.message || 'Email verified successfully. Sign in to continue.' },
      })
    } catch (verificationError) {
      setError(verificationError.message || 'The verification code is invalid or expired.')
    } finally {
      setVerifying(false)
    }
  }

  const resend = async () => {
    if (!email || secondsLeft > 0 || resending) return
    setError('')
    setMessage('')
    setResending(true)
    try {
      const result = await apiFetch(api.resendVerification(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      setMessage(result?.message || 'A new verification code has been sent.')
      setSecondsLeft(RESEND_DELAY_SECONDS)
    } catch (resendError) {
      setError(resendError.message || 'Unable to resend the code right now.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ivory px-6 py-24 pt-28">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-pale via-ivory to-gold-light/20" />
      <Motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="rounded-2xl border-2 border-parchment bg-white p-7 shadow-xl sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald/20 bg-emerald/10 text-emerald">
            <ShieldCheck size={25} />
          </div>
          <div className="mt-5 text-center">
            <h1 className="font-display text-2xl font-black text-ink">Verify your email</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-bark">
              We've sent a verification email to <span className="text-emerald font-bold">{email || 'your email'}</span>.
            </p>
          </div>

          <div className="mt-4 rounded-2xl bg-emerald/5 border border-emerald/25 p-3.5 text-xs text-bark leading-relaxed">
            <span className="font-black text-ink block mb-0.5">Two ways to confirm:</span>
            1. <strong>Click the link</strong> in the email to activate your account instantly.<br />
            2. Or enter the <strong>6-digit code</strong> below if your email includes one.
          </div>

          {error ? (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-rose">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
          {message ? (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3 text-sm text-emerald">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}

          <form onSubmit={verify} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-soft">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-parchment/60 bg-ivory py-3 pl-10 pr-4 text-sm text-ink outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/15"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-soft">Verification code</label>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                className="w-full rounded-xl border-2 border-parchment bg-white px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.35em] text-ink outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/15"
                placeholder="000000"
                aria-label="6-digit verification code"
              />
            </div>
            <button type="submit" disabled={verifying || code.length !== 6 || !email} className="flex w-full items-center justify-center gap-2 rounded-xl border-b-4 border-emerald-deep bg-emerald px-6 py-3.5 font-extrabold text-white transition hover:brightness-105 disabled:opacity-60">
              {verifying ? 'Verifying...' : 'Verify Email'}
              {!verifying ? <ArrowRight size={17} /> : null}
            </button>
          </form>

          <button type="button" onClick={resend} disabled={secondsLeft > 0 || resending || !email} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-parchment bg-ivory px-5 py-3 text-sm font-bold text-ink-soft transition hover:border-emerald/30 hover:text-emerald disabled:cursor-not-allowed disabled:opacity-55">
            <RefreshCw size={15} />
            {resending ? 'Sending...' : secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend verification code'}
          </button>

          <p className="mt-6 text-center text-sm font-semibold text-bark">
            Already verified? <Link to="/login" className="font-extrabold text-emerald hover:underline">Sign in</Link>
          </p>
        </div>
      </Motion.div>
    </div>
  )
}
