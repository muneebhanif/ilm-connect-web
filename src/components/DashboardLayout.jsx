import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/auth.jsx'
import { api, authFetch } from '../lib/api.js'
import {
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageCircle,
  Search,
  Menu,
  X,
  // Teacher icons
  Sparkles,
  Calendar,
  BookOpen,
  ListVideo,
  LayoutGrid,
  ImagePlus,
  Wallet,
  Settings,
  // Parent icons
  Users,
  GraduationCap,
  // Student icons
  FileVideo,
  UserCircle2,
  // Admin icons
  Shield,
  BarChart3,
  UserCheck,
  Flag,
} from 'lucide-react'

/* ─── role tab configs ─── */
const TEACHER_TABS = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'lessons', label: 'Lessons', icon: ListVideo },
  { id: 'availability', label: 'Availability', icon: LayoutGrid },
  { id: 'assets', label: 'Verification & Media', icon: ImagePlus },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'profile', label: 'Profile', icon: Settings },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
]

const PARENT_TABS = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'children', label: 'Children', icon: Users },
  { id: 'classes', label: 'Classes', icon: Calendar },
  { id: 'browse', label: 'Find Teachers', icon: Search },
  { id: 'profile', label: 'Profile', icon: Settings },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
]

const STUDENT_TABS = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'classes', label: 'Classes', icon: Calendar },
  { id: 'recordings', label: 'Recordings', icon: FileVideo },
  { id: 'courses', label: 'Browse Courses', icon: BookOpen },
  { id: 'profile', label: 'Profile', icon: UserCircle2 },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
]

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'teachers', label: 'Teachers', icon: UserCheck },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'reviews', label: 'Reviews', icon: Flag },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function getTabsForRole(role) {
  if (role === 'teacher') return TEACHER_TABS
  if (role === 'parent') return PARENT_TABS
  if (role === 'student') return STUDENT_TABS
  if (role === 'admin') return ADMIN_TABS
  return []
}

function getRoleLabel(role) {
  if (role === 'teacher') return 'Teacher Studio'
  if (role === 'parent') return 'Parent Hub'
  if (role === 'student') return 'Learning Hub'
  if (role === 'admin') return 'Admin Console'
  return 'Dashboard'
}

function getRoleColor(role) {
  if (role === 'teacher') return 'emerald'
  if (role === 'parent') return 'teal'
  if (role === 'student') return 'purple'
  if (role === 'admin') return 'rose'
  return 'emerald'
}

export default function DashboardLayout() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = user?.role || ''
  const tabs = getTabsForRole(role)
  const activeTab = searchParams.get('tab') || 'overview'
  const roleLabel = getRoleLabel(role)

  const unreadQuery = useQuery({
    queryKey: ['unreadCount', user?.id],
    queryFn: () => authFetch(api.unreadCount(), token),
    enabled: !!user?.id && !!token,
    refetchInterval: 30000,
  })
  const unreadCount = unreadQuery.data?.count || 0

  useEffect(() => { setMobileOpen(false) }, [activeTab])

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true })
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const avatarChar = (user?.full_name || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-ivory">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col border-r-2 border-parchment bg-white transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
      >
        {/* Logo */}
        <div className={`flex items-center border-b-2 border-parchment h-16 px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="w-9 h-9 rounded-xl shadow-md shadow-emerald/20 flex-shrink-0" />
          {!collapsed && (
            <span className="font-display font-extrabold text-lg text-ink tracking-tight">
              Ilm<span className="text-emerald">Connect</span>
            </span>
          )}
        </div>

        {/* Role badge */}
        <div className={`px-4 pt-5 pb-2 ${collapsed ? 'px-2 text-center' : ''}`}>
          {!collapsed && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald">
              <Shield size={12} />
              {roleLabel}
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {tabs.map((tab) => {
            const active = activeTab === tab.id
            const Icon = tab.icon
            const showBadge = tab.id === 'messages' && unreadCount > 0
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                title={collapsed ? tab.label : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                  active
                    ? 'bg-emerald text-white border-b-[3px] border-emerald-deep shadow-md'
                    : 'text-ink-soft hover:bg-emerald/5 hover:text-emerald'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{tab.label}</span>}
                {showBadge && (
                  <span className={`absolute ${collapsed ? '-top-1 -right-1' : 'right-3'} flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-white`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Collapse toggle + user */}
        <div className="border-t-2 border-parchment p-3 space-y-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-bark hover:bg-ivory hover:text-emerald transition"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
          <div className={`flex items-center gap-3 rounded-xl bg-ivory/80 p-2.5 ${collapsed ? 'justify-center' : ''}`}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald/10 text-xs font-bold text-emerald flex-shrink-0">{avatarChar}</div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{user?.full_name || 'User'}</div>
                <div className="truncate text-[11px] text-bark">{user?.email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header */}
        <header className="flex items-center justify-between border-b-2 border-parchment bg-white h-16 px-4 lg:px-8 flex-shrink-0">
          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(true)} className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-ivory transition">
            <Menu size={20} className="text-ink" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <Link to="/" className="text-bark hover:text-emerald transition">Home</Link>
            <span className="text-sand">/</span>
            <span className="font-semibold text-ink capitalize">{activeTab}</span>
          </div>

          {/* Mobile title */}
          <div className="lg:hidden flex items-center gap-2">
            <img src="/logo/bgremovedlogo.png" alt="" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-ink">Ilm<span className="text-emerald">Connect</span></span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('messages')}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-ivory transition text-bark hover:text-emerald"
            >
              <MessageCircle size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-bark hover:bg-rose/8 hover:text-rose transition"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ activeTab, setActiveTab: handleTabChange }} />
        </main>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl lg:hidden flex flex-col"
            >
              {/* Mobile sidebar header */}
              <div className="flex items-center justify-between h-16 px-4 border-b-2 border-parchment">
                <div className="flex items-center gap-3">
                  <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="w-9 h-9 rounded-xl" />
                  <span className="font-display font-bold text-lg text-ink">Ilm<span className="text-emerald">Connect</span></span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-ivory"><X size={18} /></button>
              </div>

              <div className="px-4 pt-4 pb-2">
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald">
                  <Shield size={12} />
                  {roleLabel}
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id
                  const Icon = tab.icon
                  const showBadge = tab.id === 'messages' && unreadCount > 0
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { handleTabChange(tab.id); setMobileOpen(false) }}
                      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all ${
                        active
                          ? 'bg-emerald text-white border-b-4 border-emerald-deep shadow-md'
                          : 'text-ink-soft hover:bg-ivory hover:text-emerald'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                      {showBadge && (
                        <span className="absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>

              {/* Mobile user info */}
              <div className="border-t-2 border-parchment p-3">
                <div className="flex items-center gap-3 rounded-xl bg-ivory/80 p-3">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10 text-sm font-bold text-emerald">{avatarChar}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{user?.full_name || 'User'}</div>
                    <div className="truncate text-[11px] text-bark">{user?.email}</div>
                  </div>
                </div>
                <button onClick={handleLogout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-rose hover:bg-rose/8 transition">
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
