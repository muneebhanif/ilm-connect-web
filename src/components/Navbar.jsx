import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/auth.jsx'
import { api, authFetch } from '../lib/api.js'
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, MessageCircle, Video } from 'lucide-react'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/teachers', label: 'Teachers' },
  { to: '/courses', label: 'Courses' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { user, token, logout } = useAuth()

  const unreadQuery = useQuery({
    queryKey: ['unreadCount', user?.id],
    queryFn: () => authFetch(api.unreadCount(), token),
    enabled: !!user?.id && !!token,
    refetchInterval: 30000,
  })
  const unread = unreadQuery.data?.count || 0

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [location])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white border-b-2 border-parchment shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="w-10 h-10 rounded-xl shadow-lg shadow-emerald/20 group-hover:shadow-emerald/40 transition-shadow" />
              <span className="font-display font-extrabold text-xl text-ink tracking-tight">
                Ilm<span className="text-emerald">Connect</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.to
                return (
                  <Link key={link.to} to={link.to}
                    className={`relative px-4 py-2 text-sm font-bold transition-colors rounded-lg ${active ? 'text-emerald' : 'text-ink-soft hover:text-emerald hover:bg-emerald/5'}`}>
                    {link.label}
                    {active && (
                      <motion.div layoutId="nav-indicator"
                        className="absolute bottom-0 left-3 right-3 h-1 bg-emerald rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/test-class"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold rounded-xl border-2 border-parchment bg-white text-ink-soft hover:border-emerald/30 hover:text-emerald transition-all">
                    <Video size={16} /> Test Class
                  </Link>
                  <Link to="/dashboard"
                    className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-emerald text-white text-sm font-extrabold rounded-xl border-b-4 border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-1 transition-all shadow-md shadow-emerald/20">
                    <LayoutDashboard size={16} />
                    Dashboard
                    {unread > 0 && <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose border-2 border-white px-1 text-[10px] font-extrabold text-white animate-lingo-pop">{unread > 99 ? '99+' : unread}</span>}
                  </Link>
                  <button onClick={logout}
                    className="inline-flex items-center gap-2 px-3 py-2.5 text-bark text-sm font-bold rounded-xl hover:bg-rose/8 hover:text-rose transition-colors">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/test-class"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold rounded-xl border-2 border-parchment bg-white text-ink-soft hover:border-emerald/30 hover:text-emerald transition-all">
                    <Video size={16} /> Test Class
                  </Link>
                  <Link to="/login"
                    className="px-5 py-2.5 text-ink-soft text-sm font-extrabold rounded-xl border-2 border-transparent hover:text-emerald hover:bg-emerald/5 hover:border-emerald/20 transition-all">
                    Sign In
                  </Link>
                  <Link to="/signup"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald text-white text-sm font-extrabold rounded-xl border-b-4 border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-1 transition-all shadow-md shadow-emerald/20">
                    Get Started <ArrowRight size={16} />
                  </Link>
                </div>
              )}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-ivory transition-colors">
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-18 z-40 bg-white/98 backdrop-blur-xl border-b-2 border-parchment shadow-xl md:hidden">
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to}
                  className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${location.pathname === link.to ? 'text-emerald bg-emerald/5' : 'text-ink-soft hover:text-emerald hover:bg-emerald/5'}`}>
                  {link.label}
                </Link>
              ))}
              <Link to="/test-class" className="block px-4 py-3 rounded-xl text-base font-bold text-ink-soft hover:text-emerald hover:bg-emerald/5">Test Class</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="block px-4 py-3 rounded-xl text-base font-bold text-emerald bg-emerald/5">Dashboard</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-bark hover:bg-ivory">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block mt-2 px-4 py-3 text-center font-bold rounded-xl border-2 border-parchment text-ink-soft">Sign In</Link>
                  <Link to="/signup" className="block mt-1 px-4 py-3 bg-emerald text-white text-center font-bold rounded-xl border-b-4 border-emerald-deep">Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
