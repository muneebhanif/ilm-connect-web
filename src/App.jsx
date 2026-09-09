import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './lib/auth.jsx'
import Layout from './components/Layout'
import DashboardLayout from './components/DashboardLayout'
import Home from './pages/Home'
import Teachers from './pages/Teachers'
import TeacherDetail from './pages/TeacherDetail'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import About from './pages/About'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import BookTeacher from './pages/BookTeacher'
import ParentDashboard from './pages/dashboard/ParentDashboard'
import TeacherDashboard from './pages/dashboard/TeacherDashboard'
import StudentDashboard from './pages/dashboard/StudentDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import { AppShellSkeleton } from './components/skeletons.jsx'

const ClassRoom = lazy(() => import('./pages/ClassRoom'))

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <AppShellSkeleton />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function DashboardRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <AppShellSkeleton />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'parent') return <Navigate to="/dashboard/parent" replace />
  if (user.role === 'teacher') return <Navigate to="/dashboard/teacher" replace />
  if (user.role === 'student') return <Navigate to="/dashboard/student" replace />
  if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-6">
      <div className="max-w-md rounded-2xl border border-parchment bg-white p-6 text-center shadow-sm">
        <h1 className="font-display text-2xl font-black text-ink">Account role not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-bark">
          Your session is valid, but this account does not have a dashboard role loaded. Make sure the matching Supabase profile row has role set to admin, teacher, parent, or student.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
    <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '14px', background: '#FFFFFF', color: '#3C3C3C', border: '2px solid #E5E5E5', fontSize: '14px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', boxShadow: '0 8px 24px -8px rgba(0,0,0,0.08)' } }} />
    <Routes>
      {/* Public site */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/teachers/:id" element={<TeacherDetail />} />
        <Route path="/teachers/:id/book" element={<ProtectedRoute roles={['parent']}><BookTeacher /></ProtectedRoute>} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup-student" element={<Navigate to="/signup?role=student" replace />} />
        <Route path="/signup/student" element={<Navigate to="/signup?role=student" replace />} />
        <Route path="/signup-parent" element={<Navigate to="/signup?role=parent" replace />} />
        <Route path="/signup-teacher" element={<Navigate to="/signup?role=teacher" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Dashboard (separate layout with sidebar) */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/dashboard/parent" element={<ProtectedRoute roles={['parent']}><ParentDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      </Route>

      {/* Classroom (fullscreen) */}
      <Route path="/classroom/:id" element={<ProtectedRoute roles={['teacher', 'student', 'parent']}><Suspense fallback={<AppShellSkeleton />}><ClassRoom /></Suspense></ProtectedRoute>} />
    </Routes>
    </>
  )
}
