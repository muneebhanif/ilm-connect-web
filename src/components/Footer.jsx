import { Link } from 'react-router-dom'
import { BookOpen, Users, GraduationCap, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative bg-ink text-parchment overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-emerald via-teal via-50% via-gold to-purple" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/logo/bgremovedlogo.png" alt="IlmConnect" className="w-10 h-10 rounded-xl" />
              <span className="font-display font-extrabold text-xl text-white">
                Ilm<span className="text-emerald">Connect</span>
              </span>
            </Link>
            <p className="text-sand text-sm leading-relaxed">
              Connecting students with qualified Islamic educators worldwide. Learn Quran, Tajweed, and Arabic from the comfort of your home.
            </p>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-white mb-4 text-sm tracking-wide uppercase">Explore</h4>
            <ul className="space-y-2.5">
              {[{ to: '/teachers', label: 'Find Teachers', icon: Users }, { to: '/courses', label: 'Browse Courses', icon: BookOpen }, { to: '/about', label: 'About Us', icon: GraduationCap }].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="flex items-center gap-2 text-sand text-sm hover:text-emerald transition-colors">
                    <l.icon size={14} /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-white mb-4 text-sm tracking-wide uppercase">For Users</h4>
            <ul className="space-y-2.5">
              {[{ to: '/signup', label: 'Parents' }, { to: '/signup', label: 'Students' }, { to: '/signup', label: 'Teachers' }].map(r => (
                <li key={r.label}><Link to={r.to} className="text-sand text-sm hover:text-emerald transition-colors">For {r.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-start md:items-end justify-between">
            <div className="text-right rounded-2xl border border-white/8 bg-white/4 px-5 py-4">
              <p dir="rtl" lang="ar" className="arabic-quote-soft text-2xl mb-2">اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</p>
              <p className="text-sand/85 text-xs italic font-semibold">"Read in the name of your Lord who created" — Al-'Alaq 96:1</p>
            </div>
          </div>
        </div>
        <div className="mt-14 pt-6 border-t-2 border-bark/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sand/60 text-xs font-semibold">&copy; {new Date().getFullYear()} IlmConnect. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-sand/50 text-xs font-bold">
            Built with <Heart size={12} className="text-rose animate-pulse" /> for the Ummah 🌙
          </div>
        </div>
      </div>
    </footer>
  )
}
