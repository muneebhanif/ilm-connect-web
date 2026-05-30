import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/auth.jsx'
import { api, authFetch } from '../lib/api.js'
import { ArrowRight, LayoutDashboard, LogOut, Menu, MessageCircle, X } from 'lucide-react'

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
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <nav className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${scrolled || mobileOpen ? 'bg-[#fbfaf4]/88 shadow-[0_18px_55px_rgba(60,60,60,0.08)] ring-1 ring-ink/8 backdrop-blur-xl' : 'bg-transparent'}`}>
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link to="/" className="group flex items-center gap-3" onClick={closeMobile}>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/76 shadow-[0_14px_36px_rgba(46,158,46,0.18)] ring-1 ring-emerald/15 transition group-hover:-rotate-3">
                <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="h-8 w-8 rounded-xl" />
              </span>
              <span className="font-display text-xl font-black tracking-[-0.04em] text-ink">
                Ilm<span className="text-emerald">Connect</span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 rounded-full border border-ink/8 bg-white/58 p-1 shadow-sm backdrop-blur md:flex">
              {navLinks.map((link) => {
                const active = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative rounded-full px-4 py-2 text-sm font-black transition ${active ? 'text-white' : 'text-ink-soft hover:text-emerald'}`}
                  >
                    {active && <Motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden items-center gap-2 md:flex">
                  <Link to="/dashboard" className="relative inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(60,60,60,0.18)] transition hover:bg-emerald">
                    <LayoutDashboard size={16} /> Dashboard
                    {unread > 0 && <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-black text-white ring-2 ring-white">{unread > 99 ? '99+' : unread}</span>}
                  </Link>
                  <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-full px-3 py-3 text-sm font-black text-bark transition hover:bg-rose/8 hover:text-rose">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div className="hidden items-center gap-2 md:flex">
                  <Link to="/login" className="rounded-full px-5 py-3 text-sm font-black text-ink-soft transition hover:bg-white/70 hover:text-emerald">
                    Sign in
                  </Link>
                  <Link to="/signup" className="group inline-flex items-center gap-2 rounded-full bg-emerald px-5 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(46,158,46,0.2)] transition hover:bg-emerald-deep">
                    Get started <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              )}
              <button type="button" onClick={() => setMobileOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/8 bg-white/70 text-ink shadow-sm backdrop-blur transition hover:text-emerald md:hidden">
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed inset-x-4 top-22 z-40 rounded-[2rem] border border-ink/8 bg-[#fbfaf4]/96 p-3 shadow-[0_28px_80px_rgba(60,60,60,0.16)] backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={closeMobile} className={`block rounded-2xl px-4 py-3 text-base font-black transition ${location.pathname === link.to ? 'bg-ink text-white' : 'text-ink-soft hover:bg-white hover:text-emerald'}`}>
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-ink/8 pt-2">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={closeMobile} className="flex items-center justify-between rounded-2xl bg-emerald px-4 py-3 text-base font-black text-white">
                      Dashboard {unread > 0 && <span className="rounded-full bg-white/18 px-2 py-0.5 text-xs">{unread > 99 ? '99+' : unread}</span>}
                    </Link>
                    <button type="button" onClick={() => { logout(); closeMobile() }} className="mt-1 block w-full rounded-2xl px-4 py-3 text-left text-base font-black text-rose hover:bg-rose/8">Sign out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMobile} className="block rounded-2xl px-4 py-3 text-center font-black text-ink-soft hover:bg-white">Sign in</Link>
                    <Link to="/signup" onClick={closeMobile} className="mt-1 block rounded-2xl bg-emerald px-4 py-3 text-center font-black text-white">Get started</Link>
                  </>
                )}
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
