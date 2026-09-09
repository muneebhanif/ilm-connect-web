import { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { motion as Motion } from 'framer-motion'
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Users,
  Info,
  BookOpen,
  Eye,
  EyeOff,
  Hash,
  Sparkles,
} from 'lucide-react'
import { happyManArt, happyMomArt, happyHijabiArt } from '../lib/artwork'
import { AuthButtonSkeleton } from '../components/skeletons.jsx'

const roles = [
  {
    key: 'parent',
    label: 'Parent',
    icon: Users,
    desc: 'Book classes for children',
    badge: 'Family Account',
    color: 'emerald',
    activeClass: 'border-emerald bg-emerald/8 border-b-4 border-b-emerald-deep shadow-md',
    iconActive: 'text-emerald',
  },
  {
    key: 'student',
    label: 'Student',
    icon: BookOpen,
    desc: 'Join classes & learn',
    badge: 'Direct Student Account',
    color: 'teal',
    activeClass: 'border-teal bg-teal/8 border-b-4 border-b-teal-deep shadow-md',
    iconActive: 'text-teal',
  },
  {
    key: 'teacher',
    label: 'Teacher',
    icon: GraduationCap,
    desc: 'Teach & manage courses',
    badge: 'Educator Profile',
    color: 'gold',
    activeClass: 'border-gold bg-gold/10 border-b-4 border-b-gold-muted shadow-md',
    iconActive: 'text-gold-muted',
  },
]

export default function Signup() {
  const { signup, login, applySession, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const requestedRole = searchParams.get('role')
  const initialRole = ['parent', 'teacher', 'student'].includes(requestedRole) ? requestedRole : 'parent'

  const [role, setRole] = useState(initialRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [showStudentIdField, setShowStudentIdField] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Sync role if URL param changes
  useEffect(() => {
    if (requestedRole && ['parent', 'teacher', 'student'].includes(requestedRole) && requestedRole !== role) {
      setRole(requestedRole)
    }
  }, [requestedRole])

  if (user?.role) return <Navigate to="/dashboard" replace />

  const handleSelectRole = (newRole) => {
    setRole(newRole)
    setSearchParams({ role: newRole }, { replace: true })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please complete all required fields.')
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
      const normalizedEmail = email.trim().toLowerCase()
      const body = {
        email: normalizedEmail,
        password,
        fullName: fullName.trim(),
        ...(role === 'student' && studentId.trim() ? { studentId: studentId.trim(), parentId: studentId.trim() } : {}),
      }
      const result = await signup(role, body)
      navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`, {
        replace: true,
        state: {
          verificationMessage:
            result?.message ||
            `Your ${role} account was created. Enter the verification code sent to your email or click the link in your email.`,
          verificationCode: result?.verificationCode || null,
        },
      })
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative pt-18 min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-pale via-ivory to-teal/10" />
      <div className="absolute top-20 -right-20 w-60 h-60 rounded-full bg-teal/10 blur-3xl animate-float" />
      <div className="absolute bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Role illustrations */}
      <div className="pointer-events-none absolute right-6 top-28 hidden w-28 lg:block animate-breathe art-breathing opacity-90" style={{ animationDelay: '1.3s' }}>
        <img src={role === 'student' ? happyHijabiArt : happyMomArt} alt="Illustration" className="h-full w-full object-contain" />
      </div>
      <div className="pointer-events-none absolute left-6 bottom-12 hidden w-28 lg:block animate-breathe art-breathing opacity-90" style={{ animationDelay: '0.8s' }}>
        <img src={happyManArt} alt="Teacher illustration" className="h-full w-full object-contain" />
      </div>

      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg"
      >
        <div className="bg-white rounded-3xl p-8 border-2 border-parchment shadow-xl">
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald/10 border-2 border-emerald/20 border-b-4 flex items-center justify-center shadow-sm">
                <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="w-10 h-10 rounded-lg" />
              </div>
            </Link>

            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900">
              {role === 'student'
                ? 'Create Student Account'
                : role === 'teacher'
                ? 'Join as an Educator'
                : 'Join IlmConnect'}
            </h1>
            <p className="text-bark text-sm mt-1 font-semibold">
              {role === 'student'
                ? 'Create your account to join live classes & track progress'
                : role === 'teacher'
                ? 'Teach live, manage students, and build your profile'
                : 'Create your parent account to book trusted teachers'}
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            {roles.map((r) => {
              const isActive = role === r.key
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleSelectRole(r.key)}
                  className={`p-3 sm:p-3.5 rounded-2xl border-2 text-center transition-all ${
                    isActive
                      ? r.activeClass
                      : 'border-parchment hover:border-emerald/30 border-b-4 border-b-parchment bg-ivory/50'
                  }`}
                >
                  <r.icon
                    size={22}
                    className={`mx-auto mb-1.5 ${isActive ? r.iconActive : 'text-bark'}`}
                  />
                  <div
                    className={`text-xs font-black ${
                      isActive ? 'text-slate-900' : 'text-bark'
                    }`}
                  >
                    {r.label}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Student-specific informational note */}
          {role === 'student' && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-teal/25 bg-teal/10 p-3.5 text-xs font-medium text-slate-800 leading-relaxed">
              <Sparkles size={18} className="mt-0.5 text-teal shrink-0" />
              <div>
                <span className="font-extrabold text-slate-900">Direct Student Account:</span> You can sign up directly with your email to attend live classes. If your parent gave you a student ID, you can link it below.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-rose/10 border border-rose/25 rounded-2xl text-rose font-bold text-xs sm:text-sm">
              <AlertCircle size={16} className="shrink-0" /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bark" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-ivory rounded-xl text-sm text-slate-900 font-semibold placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border-2 border-parchment focus:border-emerald"
                  placeholder={role === 'student' ? "Student's full name" : 'Your full name'}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bark" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-ivory rounded-xl text-sm text-slate-900 font-semibold placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border-2 border-parchment focus:border-emerald"
                  placeholder={role === 'student' ? 'student@example.com' : 'you@example.com'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bark" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-11 py-3 bg-ivory rounded-xl text-sm text-slate-900 font-semibold placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border-2 border-parchment focus:border-emerald"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bark hover:text-slate-900 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bark" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-11 py-3 bg-ivory rounded-xl text-sm text-slate-900 font-semibold placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border-2 border-parchment focus:border-emerald"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-bark hover:text-slate-900 p-1"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Student ID / Parent ID (Optional for students) */}
            {role === 'student' && (
              <div className="pt-1">
                {!showStudentIdField ? (
                  <button
                    type="button"
                    onClick={() => setShowStudentIdField(true)}
                    className="text-xs font-extrabold text-teal hover:underline inline-flex items-center gap-1"
                  >
                    + Have a Parent ID or Student ID? Enter it here
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                        Parent ID or Student ID <span className="text-bark font-medium lowercase">(optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentId('')
                          setShowStudentIdField(false)
                        }}
                        className="text-[11px] font-bold text-rose hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="relative">
                      <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bark" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-ivory rounded-xl text-sm text-slate-900 font-semibold placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-teal/20 border-2 border-parchment focus:border-teal"
                        placeholder="e.g. Parent ID or Child ID"
                      />
                    </div>
                    <p className="text-[11px] text-bark mt-1">
                      Links your new student account with your parent's family record immediately. Leave blank for a direct account.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald text-white font-extrabold rounded-2xl border-b-4 border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-1 transition-all shadow-lg shadow-emerald/20 disabled:opacity-60 text-sm sm:text-base cursor-pointer"
            >
              {loading ? (
                <AuthButtonSkeleton />
              ) : (
                <>
                  <span>
                    {role === 'student'
                      ? 'Create Student Account'
                      : role === 'teacher'
                      ? 'Create Teacher Account'
                      : 'Create Parent Account'}
                  </span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-bark text-sm mt-6 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald font-extrabold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </Motion.div>
    </div>
  )
}
