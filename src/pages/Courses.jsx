import { useQuery } from '@tanstack/react-query'
import { api, apiFetch, getCourseThumbnail } from '../lib/api'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Play, BookOpen, AlertCircle, Star, Users } from 'lucide-react'
import { useAuth } from '../lib/auth.jsx'
import { PublicCardsSkeleton } from '../components/skeletons.jsx'

const COURSES_HERO_PHOTO = 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1600&q=80&auto=format&fit=crop'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
}
const categories = ['All', 'Quran', 'Tajweed', 'Arabic', 'Islamic Studies', 'Hifz']

function CourseCard({ course, index }) {
  const title = course.title || course.name || 'Course'
  const desc = course.description || ''
  const subject = course.subject || 'General'
  const teacherName = course.teacher_name || course.profiles?.full_name || 'Teacher'
  const price = course.price
  const lessonCount = course.lesson_count || course.lessons_count || course.total_lessons || 0
  const thumbnail = getCourseThumbnail(course)
  const teacherAvatar = course.profiles?.avatar_url
  const instructorLink = course.teacher_id ? `/teachers/${course.teacher_id}` : '/teachers'
  const { user } = useAuth()

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={fadeUp} custom={index}
      className="group bg-white rounded-2xl border-2 border-parchment overflow-hidden hover:border-emerald/30 hover:shadow-[0_12px_40px_-12px_rgba(88,204,2,0.15)] transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 bg-gradient-to-br from-emerald/10 to-teal/5 overflow-hidden">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-emerald/90 backdrop-blur text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">{subject}</span>
        </div>
        {price !== undefined && price !== null && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 bg-white/90 backdrop-blur text-emerald font-bold text-sm rounded-lg shadow">{price > 0 ? `$${price}` : 'Free'}</span>
          </div>
        )}
        <div className="absolute left-4 right-4 bottom-4 flex items-center gap-3">
          {teacherAvatar ? (
            <img src={teacherAvatar} alt={teacherName} className="h-10 w-10 rounded-xl border border-white/40 object-cover shadow-md" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white backdrop-blur-sm">
              {teacherName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{teacherName}</div>
            <div className="text-xs text-white/70">Instructor</div>
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-bold text-ink text-lg mb-1 line-clamp-1 group-hover:text-emerald transition-colors">{title}</h3>
        <p className="text-bark text-xs mb-3">Designed for flexible, instructor-led Islamic learning</p>
        {desc && <p className="text-bark text-sm leading-relaxed line-clamp-2 mb-4">{desc}</p>}
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-ivory px-2 py-3">
            <Play size={14} className="mx-auto mb-1 text-emerald" />
            <div className="text-xs font-semibold text-ink">{lessonCount || 0}</div>
            <div className="text-[10px] text-bark">Lessons</div>
          </div>
          <div className="rounded-2xl bg-ivory px-2 py-3">
            <Users size={14} className="mx-auto mb-1 text-teal" />
            <div className="text-xs font-semibold text-ink">Live</div>
            <div className="text-[10px] text-bark">Support</div>
          </div>
          <div className="rounded-2xl bg-ivory px-2 py-3">
            <Star size={14} className="mx-auto mb-1 text-gold" />
            <div className="text-xs font-semibold text-ink">{course.level || 'beginner'}</div>
            <div className="text-[10px] text-bark">Level</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-parchment/50">
          <Link to={instructorLink} className="text-sm font-semibold text-ink-soft hover:text-emerald transition-colors">View Teacher</Link>
          <Link to={user ? '/dashboard' : '/login'} className="px-4 py-2 text-sm font-semibold text-emerald bg-emerald/8 rounded-xl hover:bg-emerald hover:text-white transition-all">
            {user ? 'Go to Dashboard' : 'Sign in to Enroll'}
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default function Courses() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const { data, isLoading, error } = useQuery({ queryKey: ['courses'], queryFn: () => apiFetch(api.courses()) })
  const courses = data?.courses || data || []
  const filtered = courses.filter(c => {
    const matchesSearch = !search || (c.title || c.name || '').toLowerCase().includes(search.toLowerCase())
    const matchesCat = filter === 'All' || (c.subject || '').toLowerCase().includes(filter.toLowerCase())
    return matchesSearch && matchesCat
  })

  return (
    <div className="relative overflow-hidden pt-18">
      <div className="absolute inset-0 bg-gradient-to-b from-ivory-dark/30 via-ivory to-ivory" />
      <div className="relative">
      <section className="relative py-20 overflow-hidden">
        <img src={COURSES_HERO_PHOTO} alt="Islamic courses background" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/86 to-ink-soft/78" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold/15 border-2 border-gold/20 rounded-full mb-6">
            <span className="text-gold text-xs font-extrabold tracking-wide uppercase">Structured Learning</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Explore Courses
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sand text-lg max-w-xl mx-auto font-semibold">
            Structured learning paths in Quran, Tajweed, Arabic, and Islamic sciences.
          </motion.p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-parchment flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark" />
            <input type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-ivory rounded-xl text-sm text-ink font-semibold placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border-2 border-parchment focus:border-emerald" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap transition-all ${filter === c ? 'bg-ink text-white border-b-[3px] border-ink-soft shadow-md' : 'bg-ivory text-bark border-2 border-parchment hover:text-ink hover:border-ink/20'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {isLoading ? (
          <PublicCardsSkeleton count={6} imageHeight="h-48" />
        ) : error ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-rose/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={28} className="text-rose" /></div>
            <p className="text-bark">Failed to load courses.</p>
            <p className="text-bark/60 text-xs mt-2">{error.message}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-parchment rounded-2xl flex items-center justify-center mx-auto mb-4"><BookOpen size={28} className="text-bark" /></div>
            <p className="font-display font-bold text-ink text-lg mb-1">No courses found</p>
            <p className="text-bark text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <p className="text-bark text-sm mb-6">{filtered.length} course{filtered.length !== 1 && 's'} found</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{filtered.map((c, i) => <CourseCard key={c.id || i} course={c} index={i} />)}</div>
          </>
        )}
      </section>
      </div>
    </div>
  )
}
