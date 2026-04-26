import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, AlertCircle, GraduationCap, Users, Info } from 'lucide-react'
import { happyManArt, happyMomArt } from '../lib/artwork'
import { AuthButtonSkeleton } from '../components/skeletons.jsx'

const roles = [
  { key: 'parent', label: 'Parent', icon: Users, desc: 'Book classes for your children' },
  { key: 'teacher', label: 'Teacher', icon: GraduationCap, desc: 'Teach and manage courses' },
]

export default function Signup() {
  const { signup, user } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('parent')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user?.role) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const body = { email, password, fullName }
      await signup(role, body)
      navigate('/login', {
        replace: true,
        state: {
          signupSuccess: `Your ${role} account is ready. Please sign in to continue.`,
        },
      })
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="relative pt-18 min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-pale via-ivory to-purple-light/20" />
      <div className="absolute top-20 -right-20 w-60 h-60 rounded-full bg-purple/8 blur-3xl animate-float" />
      <div className="absolute bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald/8 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="pointer-events-none absolute right-6 top-28 hidden w-24 lg:block animate-breathe art-breathing opacity-90" style={{ animationDelay: '1.3s' }}>
        <img src={happyMomArt} alt="Parent illustration" className="h-full w-full object-contain" />
      </div>
      <div className="pointer-events-none absolute left-6 bottom-12 hidden w-24 lg:block animate-breathe art-breathing opacity-90" style={{ animationDelay: '0.8s' }}>
        <img src={happyManArt} alt="Teacher illustration" className="h-full w-full object-contain" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg">
        <div className="bg-white rounded-2xl p-8 border-2 border-parchment shadow-xl">
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald/10 border-2 border-emerald/20 border-b-4 flex items-center justify-center">
                <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="w-11 h-11 rounded-lg" />
              </div>
            </Link>
            <h1 className="font-display text-2xl font-black text-ink">Join IlmConnect! 🎉</h1>
            <p className="text-bark text-sm mt-1 font-semibold">Create your account to get started</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {roles.map(r => (
              <button key={r.key} onClick={() => setRole(r.key)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${role === r.key ? 'border-emerald bg-emerald/5 border-b-4 border-b-emerald-deep shadow-md' : 'border-parchment hover:border-emerald/30 border-b-4 border-b-parchment'}`}>
                <r.icon size={22} className={`mx-auto mb-1.5 ${role === r.key ? 'text-emerald' : 'text-bark'}`} />
                <div className={`text-xs font-extrabold ${role === r.key ? 'text-emerald' : 'text-ink-soft'}`}>{r.label}</div>
              </button>
            ))}
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p>
              Student self-registration has been removed. Parents now create student credentials from the parent dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-rose/5 border border-rose/20 rounded-xl text-rose text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="w-full pl-10 pr-4 py-3 bg-ivory rounded-xl text-sm text-ink placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border border-parchment/50"
                  placeholder="Your full name" />
              </div>
            </div>
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
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-ivory rounded-xl text-sm text-ink placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border border-parchment/50"
                  placeholder="Min 6 characters" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald text-white font-extrabold rounded-xl border-b-4 border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-1 transition-all shadow-lg shadow-emerald/20 disabled:opacity-60">
              {loading ? <AuthButtonSkeleton /> : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-bark text-sm mt-6 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald font-extrabold hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
