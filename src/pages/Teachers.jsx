import { useQuery } from '@tanstack/react-query'
import { api, apiFetch, normalizeTeacher } from '../lib/api'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, MapPin, BookOpen, Languages, Clock3, ArrowRight } from 'lucide-react'
import { PublicCardsSkeleton } from '../components/skeletons.jsx'
import TeacherCoverBanner from '../components/TeacherCoverBanner.jsx'

const TEACHERS_HERO_PHOTO = 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1600&q=80&auto=format&fit=crop'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
}
const subjects = ['All', 'Arabic', 'Quran']

function StarRating({ rating = 0, reviewCount = 0 }) {
  const numericRating = Number(rating) || 0
  const count = Number(reviewCount) || 0
  const rounded = Math.round(numericRating)

  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => {
          const isFilled = i <= rounded && numericRating > 0
          return (
            <Star
              key={i}
              size={14}
              className={
                isFilled
                  ? 'text-amber-500 fill-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.25)]'
                  : 'text-amber-300/80 fill-amber-50'
              }
            />
          )
        })}
      </div>
      <span className="text-slate-800 font-extrabold text-xs ml-1">
        {numericRating > 0 ? numericRating.toFixed(1) : '0.0'}
      </span>
      <span className="text-slate-500 font-semibold text-xs">
        {count > 0 ? `(${count})` : '(New)'}
      </span>
    </div>
  )
}

function TeacherCard({ teacher, index }) {
  const name = teacher.full_name || teacher.name || 'Teacher'
  const tSubjects = teacher.subjects || []
  const rating = teacher.average_rating || teacher.rating || 0
  const bio = teacher.bio || teacher.about || ''
  const hourlyRate = teacher.hourly_rate || teacher.rate
  const avatar = teacher.avatar_url

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={fadeUp} custom={index}
      className="group bg-white rounded-2xl border-2 border-parchment overflow-hidden hover:border-emerald/30 hover:shadow-[0_12px_40px_-12px_rgba(88,204,2,0.2)] transition-all duration-300 hover:-translate-y-1.5">
      
      {/* High-Contrast Dynamic Islamic Geometric Banner */}
      <TeacherCoverBanner teacher={teacher} className="h-36" />

      <div className="px-6 pb-6 pt-0">
        <div className="flex items-start gap-4 mb-4">
          <div className="-mt-10 relative flex-shrink-0 rounded-[20px] border-4 border-white bg-white shadow-lg z-10">
            {avatar ? (
              <img src={avatar} alt={name} className="w-18 h-18 rounded-[16px] object-cover bg-white" />
            ) : (
              <div className="w-18 h-18 rounded-[16px] bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <span className="font-display font-black text-2xl text-emerald-700">{name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-2">
            <h3 className="font-display font-extrabold text-slate-900 text-lg leading-snug truncate group-hover:text-emerald transition-colors" title={name}>
              {name}
            </h3>
            <StarRating rating={rating} reviewCount={teacher.review_count} />
            {tSubjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tSubjects.slice(0, 3).map(s => (
                  <span key={s} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md uppercase tracking-wide">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {bio && <p className="text-bark text-sm leading-relaxed line-clamp-2 mb-4 min-h-10">{bio}</p>}
        <div className="grid grid-cols-3 gap-2 mb-5 text-center">
          <div className="rounded-2xl bg-ivory px-3 py-3">
            <BookOpen size={15} className="mx-auto mb-1 text-emerald" />
            <div className="text-xs font-semibold text-ink">{tSubjects.length || 1}</div>
            <div className="text-[10px] text-bark">Subjects</div>
          </div>
          <div className="rounded-2xl bg-ivory px-3 py-3">
            <Languages size={15} className="mx-auto mb-1 text-teal" />
            <div className="text-xs font-semibold text-ink truncate">{teacher.languages?.[0] || 'English'}</div>
            <div className="text-[10px] text-bark">Language</div>
          </div>
          <div className="rounded-2xl bg-ivory px-3 py-3">
            <Clock3 size={15} className="mx-auto mb-1 text-gold" />
            <div className="text-xs font-semibold text-ink">1:1</div>
            <div className="text-[10px] text-bark">Live</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-parchment/50">
          {hourlyRate ? (
            <div><span className="font-display font-bold text-emerald text-lg">${hourlyRate}</span><span className="text-bark text-xs">/hour</span></div>
          ) : <span className="text-bark text-xs">Contact for rates</span>}
          <Link to={`/teachers/${teacher.id}`} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-extrabold text-white bg-emerald rounded-xl border-b-[3px] border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-[3px] transition-all">
            View Profile <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default function Teachers() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const { data, isLoading, error } = useQuery({ queryKey: ['teachers'], queryFn: () => apiFetch(api.teachers()) })
  const raw = data?.teachers || data || []
  const teachers = raw.map(normalizeTeacher)
  const filtered = teachers.filter(t => {
    const matchesSearch = !search || (t.full_name || t.name || '').toLowerCase().includes(search.toLowerCase())
    const matchesSubject = filter === 'All' || (t.subjects || []).some(s => s.toLowerCase().includes(filter.toLowerCase()))
    return matchesSearch && matchesSubject
  })

  return (
    <div className="relative overflow-hidden pt-18">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-pale/30 via-ivory to-ivory" />
      <div className="relative">
      <section className="relative py-20 overflow-hidden">
        <img src={TEACHERS_HERO_PHOTO} alt="Islamic learning background" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-deep/92 via-emerald-deep/84 to-emerald/78" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border-2 border-white/20 rounded-full mb-6">
            <span className="text-white text-xs font-extrabold tracking-wide uppercase">Verified Educators</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
            Find Your Teacher
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-emerald-light text-lg max-w-xl mx-auto font-semibold">
            Browse our community of verified Islamic educators from around the world.
          </motion.p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-parchment flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark" />
            <input type="text" placeholder="Search by teacher name..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-ivory rounded-xl text-sm text-ink font-semibold placeholder:text-sand focus:outline-none focus:ring-2 focus:ring-emerald/20 border-2 border-parchment focus:border-emerald" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto">
            {subjects.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap transition-all ${filter === s ? 'bg-emerald text-white border-b-[3px] border-emerald-deep shadow-md' : 'bg-ivory text-bark border-2 border-parchment hover:text-emerald hover:border-emerald/20'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {isLoading ? (
          <PublicCardsSkeleton count={6} imageHeight="h-36" />
        ) : error ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-rose/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><MapPin size={28} className="text-rose" /></div>
            <p className="text-bark">Failed to load teachers. Please try again.</p>
            <p className="text-bark/60 text-xs mt-2">{error.message}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-parchment rounded-2xl flex items-center justify-center mx-auto mb-4"><Search size={28} className="text-bark" /></div>
            <p className="font-display font-bold text-ink text-lg mb-1">No teachers found</p>
            <p className="text-bark text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <p className="text-bark text-sm mb-6">{filtered.length} teacher{filtered.length !== 1 && 's'} found</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((t, i) => <TeacherCard key={t.id || i} teacher={t} index={i} />)}
            </div>
          </>
        )}
      </section>
      </div>
    </div>
  )
}
