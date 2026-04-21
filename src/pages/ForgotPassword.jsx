import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { api, apiFetch } from '../lib/api'
import { happyHijabiArt } from '../lib/artwork'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) { setError('Please enter your email address'); return }

    setLoading(true)
    try {
      await apiFetch(api.forgotPassword(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, redirectTo: `${window.location.origin}/login` }),
      })
      setSuccess('Reset email sent! Please check your inbox and spam folder.')
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-pale via-ivory to-gold-light/20 px-4 pt-20">
      <div className="absolute top-20 -left-20 w-60 h-60 rounded-full bg-emerald/8 blur-3xl animate-float" />
      <div className="pointer-events-none absolute right-8 bottom-10 hidden w-24 lg:block animate-breathe art-breathing opacity-90" style={{ animationDelay: '1.1s' }}>
        <img src={happyHijabiArt} alt="Support illustration" className="h-full w-full object-contain" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="rounded-2xl border-2 border-parchment bg-white p-8 shadow-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/10 border-2 border-emerald/20 border-b-4">
              <Mail size={28} className="text-emerald" />
            </div>
            <h1 className="font-display text-3xl font-black text-ink">Forgot password? 🔐</h1>
            <p className="mt-2 text-sm text-bark font-semibold">Enter your email and we'll send a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink-soft">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-parchment/60 bg-ivory px-4 py-3.5 text-sm text-ink placeholder:text-sand focus:border-emerald/30 focus:outline-none focus:ring-4 focus:ring-emerald/8"
                required
              />
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-rose/8 px-4 py-3 text-sm text-rose">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald/8 px-4 py-3 text-sm text-emerald">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald py-3.5 text-sm font-extrabold text-white border-b-4 border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-1 transition-all shadow-lg shadow-emerald/20 disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-ink-soft hover:text-emerald">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
