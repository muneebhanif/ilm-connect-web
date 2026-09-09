import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react'
import { api, apiFetch } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'

export default function ResetPassword() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // 1. Extract access_token from URL hash if user just arrived from the recovery email
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const accessToken = params.get('access_token')
      if (accessToken) {
        setToken(accessToken)
        return
      }
    }

    // 2. Fall back to current auth session token if present
    if (session?.access_token) {
      setToken(session.access_token)
    }
  }, [session])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Password reset link is invalid or expired. Please request a new link from the forgot password page.')
      return
    }

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const result = await apiFetch(api.resetPassword(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      })

      setSuccess(result?.message || 'Password updated successfully! Redirecting to sign in...')
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { signupSuccess: 'Your password has been reset successfully. Please sign in.' },
        })
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ivory px-6 py-24 pt-28">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-pale via-ivory to-gold-light/20" />
      <div className="absolute top-20 -left-20 w-60 h-60 rounded-full bg-emerald/8 blur-3xl animate-float" />

      <Motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="rounded-2xl border-2 border-parchment bg-white p-7 shadow-xl sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald/20 bg-emerald/10 text-emerald">
            <KeyRound size={26} />
          </div>

          <div className="mt-5 text-center">
            <h1 className="font-display text-2xl font-black text-ink">Set New Password</h1>
            <p className="mt-1 text-sm font-semibold text-bark">
              Create a new secure password for your account.
            </p>
          </div>

          {error ? (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-rose">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {success ? (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3 text-sm text-emerald">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-bark">
                New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-bark/60">
                  <Lock size={17} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-parchment/70 bg-ivory/50 py-3 pl-10 pr-10 text-sm font-semibold text-ink placeholder:text-bark/40 focus:border-emerald focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-bark/60 hover:text-bark"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-bark">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-bark/60">
                  <Lock size={17} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-parchment/70 bg-ivory/50 py-3 pl-10 pr-10 text-sm font-semibold text-ink placeholder:text-bark/40 focus:border-emerald focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-bark/60 hover:text-bark"
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="mt-2 w-full rounded-xl bg-emerald py-3.5 text-sm font-extrabold text-white border-b-4 border-emerald-deep shadow-lg shadow-emerald/20 hover:brightness-105 active:border-b-0 active:mt-1 disabled:opacity-50 transition-all"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-bark hover:text-emerald"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </Motion.div>
    </div>
  )
}
