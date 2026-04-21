import { useState } from 'react'
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { happyHijabiArt } from '../lib/artwork'
import { AuthButtonSkeleton } from '../components/skeletons.jsx'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const signupSuccess = location.state?.signupSuccess || ''

  // Redirect if already logged in
  if (user?.role) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="relative pt-18 min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-pale via-ivory to-gold-light/20" />
      <div className="absolute top-20 -left-20 w-60 h-60 rounded-full bg-emerald/8 blur-3xl animate-float" />
      <div className="absolute bottom-20 -right-20 w-72 h-72 rounded-full bg-gold/8 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="pointer-events-none absolute right-6 bottom-8 hidden w-24 lg:block animate-breathe art-breathing opacity-90" style={{ animationDelay: '1.1s' }}>
        <img src={happyHijabiArt} alt="Learner illustration" className="h-full w-full object-contain" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 border-2 border-parchment shadow-xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald/10 border-2 border-emerald/20 border-b-4 flex items-center justify-center">
                <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="w-11 h-11 rounded-lg" />
              </div>
            </Link>
            <h1 className="font-display text-2xl font-black text-ink">Welcome Back! 👋</h1>
            <p className="text-bark text-sm mt-1 font-semibold">Sign in to your IlmConnect account</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-rose/5 border border-rose/20 rounded-xl text-rose text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {signupSuccess && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-emerald/5 border border-emerald/20 rounded-xl text-emerald text-sm">
              <CheckCircle size={16} /> {signupSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 bg-ivory rounded-xl text-sm text-ink placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border border-parchment/50"
                  placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 bg-ivory rounded-xl text-sm text-ink placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border border-parchment/50"
                  placeholder="Enter your password" />
              </div>
              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-xs font-semibold text-emerald hover:underline">Forgot password?</Link>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald text-white font-extrabold rounded-xl border-b-4 border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-1 transition-all shadow-lg shadow-emerald/20 disabled:opacity-60">
              {loading ? <AuthButtonSkeleton /> : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-bark text-sm mt-6 font-semibold">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald font-extrabold hover:underline">Sign Up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
