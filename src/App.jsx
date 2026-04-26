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
import About from './pages/About'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import BookTeacher from './pages/BookTeacher'
import ParentDashboard from './pages/dashboard/ParentDashboard'
import TeacherDashboard from './pages/dashboard/TeacherDashboard'
import StudentDashboard from './pages/dashboard/StudentDashboard'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import PublicTestClass from './pages/PublicTestClass'
import { AppShellSkeleton } from './components/skeletons.jsx'

const ClassRoom = lazy(() => import('./pages/ClassRoom'))

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <AppShellSkeleton />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
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
  return <Navigate to="/" replace />
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
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/test-class" element={<PublicTestClass />} />
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
