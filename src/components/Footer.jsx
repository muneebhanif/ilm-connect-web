import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, Heart, Users } from 'lucide-react'

export default function Footer() {
  const exploreLinks = [
    { to: '/teachers', label: 'Find Teachers', icon: Users },
    { to: '/courses', label: 'Browse Courses', icon: BookOpen },
    { to: '/about', label: 'About Us', icon: GraduationCap },
  ]

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,200,0,0.14),transparent_24rem),radial-gradient(circle_at_88%_10%,rgba(46,158,46,0.16),transparent_28rem)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.7fr_0.7fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/8 ring-1 ring-white/10">
                <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="h-9 w-9 rounded-xl" />
              </span>
              <span className="font-display text-2xl font-black tracking-[-0.04em]">
                Ilm<span className="text-emerald-light">Connect</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm font-semibold leading-7 text-white/58">
              A focused Islamic learning platform for teacher discovery, live classes, recordings, and family dashboards.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.22em] text-gold">Explore</h4>
            <ul className="mt-5 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="flex items-center gap-2 text-sm font-bold text-white/62 transition hover:text-emerald-light">
                    <link.icon size={15} /> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.22em] text-gold">Start</h4>
            <ul className="mt-5 space-y-3">
              {[
                { label: 'For Parents', role: 'parent' },
                { label: 'For Students', role: 'student' },
                { label: 'For Teachers', role: 'teacher' },
              ].map((item) => (
                <li key={item.role}>
                  <Link to={`/signup?role=${item.role}`} className="text-sm font-bold text-white/62 transition hover:text-emerald-light">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
            <p dir="rtl" lang="ar" className="arabic-quote-soft text-3xl">اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</p>
            <p className="mt-3 text-xs font-bold leading-6 text-white/58">"Read in the name of your Lord who created" — Al-'Alaq 96:1</p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-bold text-white/42">&copy; {new Date().getFullYear()} IlmConnect. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white/42">
            Built with <Heart size={12} className="text-rose" /> for the Ummah
          </div>
        </div>
      </div>
    </footer>
  )
}
