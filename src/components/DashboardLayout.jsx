import { useState } from 'react'
import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'framer-motion'
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
  Sparkles,
  Calendar,
  BookOpen,
  ListVideo,
  LayoutGrid,
  ImagePlus,
  Wallet,
  Settings,
  Users,
  GraduationCap,
  FileVideo,
  UserCircle2,
  Shield,
  BarChart3,
  UserCheck,
  Flag,
  CreditCard,
  Video,
} from 'lucide-react'

const TEACHER_TABS = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'students', label: 'Students', icon: Users },
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
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'recordings', label: 'Recordings', icon: Video },
  { id: 'reviews', label: 'Reviews', icon: Flag },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const ROLE_THEME = {
  teacher: {
    accent: 'text-emerald',
    activeNav: 'bg-emerald text-white border-emerald-deep shadow-[0_14px_30px_rgba(46,158,46,0.24)]',
    inactiveNav: 'text-ink-soft hover:bg-emerald/8 hover:text-emerald',
    badge: 'border-emerald/15 bg-emerald/8 text-emerald',
    avatar: 'bg-emerald/10 text-emerald',
    header: 'border-parchment/70 bg-white/88 text-ink',
    sidebar: 'border-parchment/70 bg-white/92 text-ink',
    divider: 'border-parchment/70',
    muted: 'text-bark',
    userCard: 'bg-ivory/80 text-ink',
    utilityButton: 'text-bark hover:bg-emerald/8 hover:text-emerald',
    logoText: 'text-ink',
    logoAccent: 'text-emerald',
  },
  parent: {
    accent: 'text-teal',
    activeNav: 'bg-teal text-white border-teal-deep shadow-[0_14px_30px_rgba(28,176,246,0.22)]',
    inactiveNav: 'text-ink-soft hover:bg-teal/8 hover:text-teal',
    badge: 'border-teal/15 bg-teal/8 text-teal',
    avatar: 'bg-teal/10 text-teal',
    header: 'border-parchment/70 bg-white/88 text-ink',
    sidebar: 'border-parchment/70 bg-white/92 text-ink',
    divider: 'border-parchment/70',
    muted: 'text-bark',
    userCard: 'bg-ivory/80 text-ink',
    utilityButton: 'text-bark hover:bg-teal/8 hover:text-teal',
    logoText: 'text-ink',
    logoAccent: 'text-teal',
  },
  student: {
    accent: 'text-gold-muted',
    activeNav: 'bg-gold text-ink border-gold-muted shadow-[0_14px_30px_rgba(255,200,0,0.22)]',
    inactiveNav: 'text-ink-soft hover:bg-gold/12 hover:text-gold-muted',
    badge: 'border-gold/25 bg-gold/12 text-gold-muted',
    avatar: 'bg-gold/15 text-gold-muted',
    header: 'border-parchment/70 bg-white/88 text-ink',
    sidebar: 'border-parchment/70 bg-white/92 text-ink',
    divider: 'border-parchment/70',
    muted: 'text-bark',
    userCard: 'bg-ivory/80 text-ink',
    utilityButton: 'text-bark hover:bg-gold/12 hover:text-gold-muted',
    logoText: 'text-ink',
    logoAccent: 'text-gold-muted',
  },
  admin: {
    accent: 'text-rose',
    activeNav: 'bg-rose/14 text-rose border border-rose/25 shadow-[0_16px_36px_rgba(255,75,75,0.12)]',
    inactiveNav: 'text-zinc-400 hover:bg-white/5 hover:text-white',
    badge: 'border border-rose/20 bg-rose/10 text-rose',
    avatar: 'bg-rose/10 text-rose',
    header: 'border-white/10 bg-[#0b111b]/90 text-white',
    sidebar: 'border-white/10 bg-[#0d1117]/95 text-white',
    divider: 'border-white/10',
    muted: 'text-zinc-500',
    userCard: 'bg-white/5 text-white',
    utilityButton: 'text-zinc-500 hover:bg-white/5 hover:text-white',
    logoText: 'text-white',
    logoAccent: 'text-rose',
  },
}

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

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function DashboardLayout() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = user?.role || ''
  const tabs = getTabsForRole(role)
  const roleLabel = getRoleLabel(role)
  const roleTheme = ROLE_THEME[role] || ROLE_THEME.teacher
  const activeTab = searchParams.get('tab') || 'overview'

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true })
    setMobileOpen(false)
  }

  const unreadQuery = useQuery({
    queryKey: ['unreadCount', user?.id],
    queryFn: () => authFetch(api.unreadCount(), token),
    enabled: !!user?.id && !!token,
    refetchInterval: 30000,
  })
  const unreadCount = unreadQuery.data?.count || 0

  const teacherNotificationsQuery = useQuery({
    queryKey: ['teacherNotificationsBell', user?.id],
    queryFn: () => authFetch(api.teacherNotifications(user.id), token),
    enabled: role === 'teacher' && !!user?.id && !!token,
    refetchInterval: 30000,
  })
  const teacherNotificationCount = role === 'teacher' ? (teacherNotificationsQuery.data?.unreadCount || 0) : 0

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const avatarChar = (user?.full_name || user?.email || 'U').charAt(0).toUpperCase()
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || activeTab

  const renderBadge = (count, colorClass, compactBadge = false) => count > 0 ? (
    <span className={cx('absolute flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white', colorClass, compactBadge ? '-right-1 -top-1' : 'right-3')}>
      {count > 99 ? '99+' : count}
    </span>
  ) : null

  const renderNavItems = (mobile = false) => (
    <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
      {tabs.map((tab) => {
        const active = activeTab === tab.id
        const Icon = tab.icon
        const showMessageBadge = tab.id === 'messages' && unreadCount > 0
        const showTeacherBellBadge = role === 'teacher' && tab.id === 'notifications' && teacherNotificationCount > 0
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            title={!mobile && collapsed ? tab.label : undefined}
            className={cx(
              'group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black transition-all focus:outline-none focus:ring-4 focus:ring-emerald/10',
              active ? roleTheme.activeNav : roleTheme.inactiveNav,
              !mobile && collapsed ? 'justify-center px-0' : '',
              mobile ? 'py-3' : ''
            )}
          >
            <Icon size={18} className="shrink-0" />
            {(mobile || !collapsed) && <span>{tab.label}</span>}
            {showMessageBadge ? renderBadge(unreadCount, 'bg-rose', !mobile && collapsed) : null}
            {showTeacherBellBadge ? renderBadge(teacherNotificationCount, 'bg-gold', !mobile && collapsed) : null}
          </button>
        )
      })}
    </nav>
  )

  return (
    <div data-dashboard-role={role || 'default'} className="dashboard-root flex h-screen overflow-hidden">
      <aside className={cx('hidden flex-col border-r backdrop-blur-xl transition-all duration-300 lg:flex', roleTheme.sidebar, collapsed ? 'w-[76px]' : 'w-[276px]')}>
        <div className={cx('flex h-16 items-center border-b px-4', roleTheme.divider, collapsed ? 'justify-center' : 'gap-3')}>
          <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="h-9 w-9 shrink-0 rounded-xl shadow-md shadow-emerald/20" />
          {!collapsed && (
            <span className={cx('font-display text-lg font-black tracking-tight', roleTheme.logoText)}>
              Ilm<span className={roleTheme.logoAccent}>Connect</span>
            </span>
          )}
        </div>

        <div className={cx('px-4 pb-2 pt-5', collapsed ? 'px-2 text-center' : '')}>
          {!collapsed && (
            <div className={cx('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em]', roleTheme.badge)}>
              <Shield size={12} />
              {roleLabel}
            </div>
          )}
        </div>

        {renderNavItems()}

        <div className={cx('space-y-2 border-t p-3', roleTheme.divider)}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cx('flex w-full items-center justify-center gap-2 rounded-2xl py-2 text-xs font-bold transition', roleTheme.utilityButton)}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
          <div className={cx('flex items-center gap-3 rounded-2xl p-2.5', roleTheme.userCard, collapsed ? 'justify-center' : '')}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black', roleTheme.avatar)}>{avatarChar}</div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black">{user?.full_name || 'User'}</div>
                <div className={cx('truncate text-[11px]', roleTheme.muted)}>{user?.email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cx('flex h-16 shrink-0 items-center justify-between border-b px-4 backdrop-blur-xl lg:px-8', roleTheme.header)}>
          <button type="button" onClick={() => setMobileOpen(true)} className={cx('flex h-10 w-10 items-center justify-center rounded-2xl transition lg:hidden', roleTheme.utilityButton)}>
            <Menu size={20} />
          </button>

          <div className="hidden items-center gap-2 text-sm lg:flex">
            <Link to="/" className={cx('rounded-lg px-1 transition', roleTheme.utilityButton)}>Home</Link>
            <span className={roleTheme.muted}>/</span>
            <span className="font-black capitalize">{activeTabLabel}</span>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <img src="/logo/bgremovedlogo.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className={cx('font-display font-black', roleTheme.logoText)}>Ilm<span className={roleTheme.logoAccent}>Connect</span></span>
          </div>

          <div className="flex items-center gap-2">
            {role === 'teacher' && (
              <button type="button" onClick={() => handleTabChange('notifications')} className={cx('relative flex h-10 w-10 items-center justify-center rounded-2xl transition', roleTheme.utilityButton)}>
                <Bell size={18} />
                {teacherNotificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-black text-white">{teacherNotificationCount > 9 ? '9+' : teacherNotificationCount}</span>
                )}
              </button>
            )}
            <button type="button" onClick={() => handleTabChange('messages')} className={cx('relative flex h-10 w-10 items-center justify-center rounded-2xl transition', roleTheme.utilityButton)}>
              <MessageCircle size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[9px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-rose transition hover:bg-rose/8">
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="dashboard-main flex-1 overflow-y-auto">
          <Outlet context={{ activeTab, setActiveTab: handleTabChange }} />
        </main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <Motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cx('fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col border-r shadow-2xl lg:hidden', roleTheme.sidebar)}
            >
              <div className={cx('flex h-16 items-center justify-between border-b px-4', roleTheme.divider)}>
                <div className="flex items-center gap-3">
                  <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="h-9 w-9 rounded-xl" />
                  <span className={cx('font-display text-lg font-black', roleTheme.logoText)}>Ilm<span className={roleTheme.logoAccent}>Connect</span></span>
                </div>
                <button type="button" onClick={() => setMobileOpen(false)} className={cx('flex h-9 w-9 items-center justify-center rounded-xl transition', roleTheme.utilityButton)}><X size={18} /></button>
              </div>

              <div className="px-4 pb-2 pt-4">
                <div className={cx('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em]', roleTheme.badge)}>
                  <Shield size={12} />
                  {roleLabel}
                </div>
              </div>

              {renderNavItems(true)}

              <div className={cx('border-t p-3', roleTheme.divider)}>
                <div className={cx('flex items-center gap-3 rounded-2xl p-3', roleTheme.userCard)}>
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <div className={cx('flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black', roleTheme.avatar)}>{avatarChar}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black">{user?.full_name || 'User'}</div>
                    <div className={cx('truncate text-[11px]', roleTheme.muted)}>{user?.email}</div>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold text-rose transition hover:bg-rose/8">
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </Motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
