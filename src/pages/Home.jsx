import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, apiFetch, getCourseThumbnail, getTeacherCoverImage, normalizeTeacher } from '../lib/api'
import { girlArt, girlsArt, happyHijabiArt, happyManArt, happyMomArt, knowledgeJourneyArt, learningLiveClassArt, teacherSpotlightArt } from '../lib/artwork'
import { PublicCardsSkeleton } from '../components/skeletons.jsx'
import {
  BookOpen,
  Video,
  Users,
  Library,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  Clock,
  ChevronRight,
  Star,
  Globe,
  CheckCircle2,
  PlayCircle,
  GraduationCap,
  Calendar,
  Zap,
  Trophy,
  Flame,
  Sparkles,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }),
}

const pop = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } }),
}

const features = [
  { icon: BookOpen, title: 'Quran & Tajweed', desc: 'Learn proper recitation with certified teachers who guide you through every verse.', color: 'emerald' },
  { icon: Video, title: 'Live Classes', desc: 'Interactive video sessions with real-time audio, video, and in-class messaging.', color: 'teal' },
  { icon: Users, title: 'Parent Dashboard', desc: 'Book classes for your children, monitor progress, and manage everything in one place.', color: 'purple' },
  { icon: Library, title: 'Course Library', desc: 'Browse structured courses with lessons, recordings, and downloadable content.', color: 'gold' },
  { icon: ShieldCheck, title: 'Verified Teachers', desc: 'Every teacher is reviewed, rated, and vetted before joining our platform.', color: 'emerald' },
  { icon: MessageCircle, title: 'In-App Chat', desc: 'Communicate directly with teachers for scheduling, questions, and updates.', color: 'teal' },
]

const featureColors = {
  emerald: { bg: 'bg-emerald/10', text: 'text-emerald', border: 'border-emerald/20', hover: 'hover:border-emerald/40' },
  teal: { bg: 'bg-teal/10', text: 'text-teal', border: 'border-teal/20', hover: 'hover:border-teal/40' },
  purple: { bg: 'bg-purple/10', text: 'text-purple', border: 'border-purple/20', hover: 'hover:border-purple/40' },
  gold: { bg: 'bg-gold/10', text: 'text-gold-muted', border: 'border-gold/20', hover: 'hover:border-gold/40' },
}

const steps = [
  { num: '1', title: 'Create Your Account', desc: 'Sign up as a parent, student, or teacher. It takes less than a minute.', icon: Sparkles, color: 'bg-emerald' },
  { num: '2', title: 'Find Your Teacher', desc: 'Browse profiles, read reviews, and choose a teacher that fits your needs.', icon: Users, color: 'bg-teal' },
  { num: '3', title: 'Book & Learn', desc: 'Schedule a live class, join from your phone, and start your learning journey.', icon: Trophy, color: 'bg-gold' },
]

const roleCards = [
  {
    title: 'For Parents',
    icon: Users,
    desc: 'Book trusted teachers, manage children profiles, and track class activity from one dashboard.',
    points: ['Book live sessions', 'Manage children accounts', 'Monitor upcoming classes'],
    accent: 'teal',
    art: happyMomArt,
  },
  {
    title: 'For Students',
    icon: GraduationCap,
    desc: 'Join scheduled classes, revisit recordings, and build consistency with guided learning.',
    points: ['Attend live lessons', 'Access recordings', 'Follow structured courses'],
    accent: 'purple',
    art: happyHijabiArt,
  },
  {
    title: 'For Teachers',
    icon: Library,
    desc: 'Teach live, publish courses, manage schedules, and build a trusted teaching profile.',
    points: ['Run live classes', 'Publish course content', 'Manage students and schedule'],
    accent: 'emerald',
    art: happyManArt,
  },
]

function FeaturedTeacherCard({ teacher, index }) {
  const name = teacher.full_name || 'Teacher'
  const subjects = Array.isArray(teacher.subjects) ? teacher.subjects.filter(Boolean) : []
  const rating = Number(teacher.rating || teacher.average_rating || 0)
  const cover = getTeacherCoverImage(teacher)

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={pop}
      custom={index}
      className="group overflow-hidden rounded-2xl border-2 border-parchment bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald/30 hover:shadow-[0_12px_40px_-12px_rgba(88,204,2,0.2)]"
    >
      <div className="relative h-36 overflow-hidden">
        <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-emerald border-2 border-emerald/20">
          <CheckCircle2 size={12} /> Verified
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="-mt-8 mb-4 flex items-start gap-4">
          <div className="relative flex-shrink-0 rounded-2xl border-4 border-white bg-white shadow-lg">
            {teacher.avatar_url ? (
              <img src={teacher.avatar_url} alt={name} className="h-18 w-18 rounded-xl object-cover" />
            ) : (
              <div className="flex h-18 w-18 items-center justify-center rounded-xl bg-emerald/10 text-xl font-extrabold text-emerald">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-8">
            <h3 className="truncate font-display text-lg font-extrabold text-ink">{name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm font-bold text-gold">
              <Star size={14} className="fill-current" /> {rating.toFixed(1)}
            </div>
          </div>
        </div>
        <div className="mb-4 flex min-h-[2.5rem] flex-wrap gap-1.5">
          {(subjects.length ? subjects : ['Islamic Studies']).slice(0, 3).map((subject) => (
            <span key={subject} className="rounded-full bg-emerald/10 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald border-2 border-emerald/15">{subject}</span>
          ))}
        </div>
        <p className="min-h-10 line-clamp-2 text-sm leading-relaxed text-bark">{teacher.bio || 'Experienced Islamic educator available for live learning.'}</p>
        <div className="mt-5 flex items-center justify-between border-t-2 border-parchment/60 pt-5">
          <div>
            <div className="font-display text-2xl font-extrabold text-emerald">${Number(teacher.hourly_rate || 0).toFixed(0)}</div>
            <div className="text-xs text-bark font-semibold">per hour</div>
          </div>
          <Link to={`/teachers/${teacher.id}`} className="inline-flex items-center gap-2 rounded-xl bg-emerald text-white px-5 py-2.5 text-sm font-bold border-b-4 border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-1 transition-all">
            View <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['home-teachers'],
    queryFn: () => apiFetch(api.teachers()),
  })

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['home-courses'],
    queryFn: () => apiFetch(api.courses()),
  })

  const featuredTeachers = (teachersData?.teachers || teachersData || []).map(normalizeTeacher).slice(0, 3)
  const featuredCourses = (coursesData?.courses || coursesData || []).slice(0, 3)

  return (
    <div className="relative overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative flex min-h-[90vh] items-center pt-18 overflow-hidden">
        {/* Playful background shapes */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-pale via-ivory to-gold-light/30" />
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-emerald/8 blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full bg-gold/8 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-purple/5 blur-2xl animate-float" style={{ animationDelay: '4s' }} />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 xl:gap-24">
            <div className="relative z-10">
              <motion.div initial="hidden" animate="visible" variants={pop} custom={0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald/20 rounded-full mb-8 shadow-sm">
                <Flame size={16} className="text-emerald" />
                <span className="text-emerald text-xs font-extrabold tracking-wide uppercase">Islamic Education Platform</span>
              </motion.div>
              <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="font-display text-5xl sm:text-6xl lg:text-[4.5rem] font-black text-ink leading-[1.05] tracking-tight mb-6">
                Learn Quran<br />
                <span className="text-emerald">with the Best</span><br />
                <span className="text-gold">Teachers</span> 🌟
              </motion.h1>
              <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="text-ink-soft text-lg sm:text-xl leading-relaxed max-w-lg mb-10">
                Connect with qualified Islamic educators for live Quran, Tajweed, and Arabic classes — all from the comfort of your home.
              </motion.p>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-wrap items-center gap-4">
                <Link to="/teachers" className="inline-flex items-center gap-2.5 px-8 py-4 bg-emerald text-white text-base font-extrabold rounded-2xl border-b-[5px] border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-[5px] transition-all shadow-lg shadow-emerald/25">
                  Browse Teachers <ArrowRight size={18} />
                </Link>
                <Link to="/test-class" className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-parchment border-b-[5px] text-ink font-extrabold rounded-2xl hover:border-emerald/30 hover:text-emerald active:border-b-2 active:mt-[3px] transition-all">
                  Join Test Class <PlayCircle size={18} />
                </Link>
                <Link to="/courses" className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-parchment border-b-[5px] text-ink font-extrabold rounded-2xl hover:border-emerald/30 hover:text-emerald active:border-b-2 active:mt-[3px] transition-all">
                  Explore Courses
                </Link>
              </motion.div>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3.5} className="mt-4 inline-flex max-w-xl items-start gap-3 rounded-2xl border-2 border-emerald/15 bg-white/90 px-4 py-3 text-sm text-bark shadow-sm">
                <Zap size={18} className="mt-0.5 shrink-0 text-emerald" />
                <span>Need a quick live-class check? Use the web test class to join instantly as a teacher or student without a booking.</span>
              </motion.div>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
                className="mt-10 grid max-w-lg grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4">
                {[
                  { val: '100+', label: 'Teachers', icon: '👨‍🏫' },
                  { val: '1,000+', label: 'Students', icon: '📚' },
                  { val: '4.9★', label: 'Rating', icon: '⭐' },
                ].map((s) => (
                  <div key={s.label} className="flex min-w-0 items-center gap-3 rounded-2xl border-2 border-parchment/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:bg-transparent sm:px-0 sm:py-0 sm:border-0 sm:shadow-none">
                    <div className="text-2xl flex-shrink-0">{s.icon}</div>
                    <div>
                      <div className="font-display font-black text-lg leading-none text-ink sm:text-xl">{s.val}</div>
                      <div className="mt-1 text-bark text-[11px] font-bold leading-none sm:text-xs">{s.label}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Hero right - Playful card stack */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} className="hidden lg:block relative">
              <div className="relative mx-auto w-full max-w-[28rem]">
                {/* Floating decorative elements */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-2xl bg-gold/20 border-2 border-gold/30 flex items-center justify-center text-3xl animate-lingo-bounce rotate-12">📖</div>
                <div className="absolute -bottom-4 -left-6 w-16 h-16 rounded-2xl bg-purple/20 border-2 border-purple/30 flex items-center justify-center text-2xl animate-lingo-bounce" style={{ animationDelay: '1s' }}>🎓</div>
                <div className="absolute -left-18 top-18 hidden w-24 xl:block animate-breathe art-breathing" style={{ animationDelay: '0.7s' }}>
                  <img src={happyMomArt} alt="Parent illustration" className="h-full w-full object-contain" />
                </div>
                <div className="absolute -right-14 bottom-12 hidden w-24 xl:block animate-breathe art-breathing" style={{ animationDelay: '1.4s' }}>
                  <img src={happyHijabiArt} alt="Student illustration" className="h-full w-full object-contain" />
                </div>

                {/* Main hero card */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-parchment bg-white shadow-2xl">
                  <div className="flex h-64 items-center justify-center bg-gradient-to-br from-emerald-pale via-white to-gold-light/40 p-6">
                    <img src={learningLiveClassArt} alt="IlmConnect live class illustration" className="h-full w-full object-contain" />
                  </div>
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-emerald px-4 py-1.5 border-b-[3px] border-emerald-deep">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-xs font-extrabold">LIVE CLASS</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald/10 border-2 border-emerald/20 border-b-4 flex items-center justify-center"><Video size={22} className="text-emerald" /></div>
                      <div>
                        <div className="font-display font-extrabold text-ink text-base">Quran Tajweed Class</div>
                        <div className="text-bark text-xs flex items-center gap-1 font-bold"><Clock size={12} /> Starting in 5 min</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-emerald font-extrabold bg-emerald/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 border-2 border-emerald/20">
                        <span className="w-2 h-2 bg-emerald rounded-full animate-pulse" /> Live
                      </span>
                      <Link to="/signup" className="px-5 py-2.5 bg-emerald text-white text-sm font-extrabold rounded-xl border-b-4 border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-1 transition-all">Join Now</Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="relative border-y-2 border-parchment/60 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Verified teachers', text: 'Public profiles, ratings, and approval workflow.', emoji: '✅' },
              { icon: Globe, title: 'Global access', text: 'Learn from home with flexible scheduling.', emoji: '🌍' },
              { icon: Calendar, title: 'Live booking', text: 'Book sessions and manage classes in one place.', emoji: '📅' },
              { icon: Video, title: 'Integrated classes', text: 'Live video, messaging, and recordings built-in.', emoji: '🎥' },
            ].map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={pop} custom={i}
                className="flex items-start gap-4 rounded-2xl bg-ivory px-5 py-5 border-2 border-parchment/50 hover:border-emerald/20 transition-colors">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald/10 border-b-[3px] border-emerald/20 text-xl">
                  {item.emoji}
                </div>
                <div>
                  <div className="font-extrabold text-ink">{item.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-bark">{item.text}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative py-28">
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="pointer-events-none absolute -left-6 top-10 hidden w-24 lg:block animate-breathe art-breathing opacity-90" style={{ animationDelay: '1.2s' }}>
            <img src={girlsArt} alt="Learners illustration" className="h-full w-full object-contain" />
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border-2 border-gold/20 rounded-full mb-4">
              <Zap size={14} className="text-gold-muted" />
              <span className="text-gold-muted text-xs font-extrabold tracking-wide uppercase">Why IlmConnect</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-ink tracking-tight">Everything You Need to Learn</h2>
            <p className="text-bark text-lg mt-4 max-w-2xl mx-auto">A complete Islamic education platform designed for modern families.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const c = featureColors[f.color]
              return (
                <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={pop} custom={i}
                  className={`group relative bg-white rounded-2xl p-7 border-2 ${c.border} ${c.hover} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                  <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center mb-5 border-b-4 ${c.border}`}>
                    <f.icon size={26} className={c.text} />
                  </div>
                  <h3 className="font-display font-extrabold text-ink text-lg mb-2">{f.title}</h3>
                  <p className="text-bark text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="relative py-28 bg-white border-y-2 border-parchment/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/10 border-2 border-emerald/20 rounded-full mb-4">
              <Users size={14} className="text-emerald" />
              <span className="text-emerald text-xs font-extrabold tracking-wide uppercase">Built for every role</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-ink">One Platform, Three Experiences</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-bark">Discovery, booking, live classes, and dashboards for parents, teachers, and students.</p>
          </motion.div>
          <div className="grid gap-5 lg:grid-cols-3">
            {roleCards.map((role, i) => {
              const accentMap = { teal: 'border-teal/20 bg-teal/10 text-teal', purple: 'border-purple/20 bg-purple/10 text-purple', emerald: 'border-emerald/20 bg-emerald/10 text-emerald' }
              const accent = accentMap[role.accent]
              return (
                <motion.div key={role.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={pop} custom={i}
                  className="rounded-2xl border-2 border-parchment bg-ivory/50 p-8 hover:border-emerald/20 transition-colors">
                  <div className="mb-5 flex justify-end">
                    <div className="h-20 w-20 rounded-2xl bg-white/80 p-2 shadow-sm">
                      <img src={role.art} alt="" className="h-full w-full object-contain animate-breathe art-breathing" />
                    </div>
                  </div>
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-b-4 ${accent}`}>
                    <role.icon size={26} />
                  </div>
                  <h3 className="font-display text-2xl font-extrabold text-ink">{role.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-bark">{role.desc}</p>
                  <div className="mt-6 space-y-3">
                    {role.points.map((point) => (
                      <div key={point} className="flex items-center gap-3 text-sm text-ink-soft font-semibold">
                        <CheckCircle2 size={16} className="text-emerald flex-shrink-0" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED TEACHERS ── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory via-emerald-pale/20 to-ivory" />
        <div className="absolute right-0 top-0 hidden h-full w-[26rem] xl:block">
          <img src={teacherSpotlightArt} alt="Teacher illustration" className="h-full w-full object-contain opacity-20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border-2 border-gold/20 rounded-full mb-4">
                <Star size={14} className="text-gold-muted" />
                <span className="text-gold-muted text-xs font-extrabold tracking-wide uppercase">Featured Teachers</span>
              </div>
              <h2 className="font-display text-4xl font-black tracking-tight text-ink">Meet Trusted Educators</h2>
              <p className="mt-3 max-w-2xl text-bark">Browse verified teacher profiles before booking.</p>
            </div>
            <Link to="/teachers" className="inline-flex items-center gap-2 font-extrabold text-emerald hover:text-emerald-deep transition-colors">
              View all teachers <ArrowRight size={16} />
            </Link>
          </div>
          {teachersLoading ? <PublicCardsSkeleton count={3} imageHeight="h-44" /> : (
            <div className="grid gap-6 lg:grid-cols-3">
            {featuredTeachers.map((teacher, i) => <FeaturedTeacherCard key={teacher.id || i} teacher={teacher} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURED COURSES ── */}
      <section className="relative py-28 bg-white border-y-2 border-parchment/60">
        <div className="pointer-events-none absolute left-4 top-12 hidden w-24 lg:block animate-breathe art-breathing opacity-80" style={{ animationDelay: '1s' }}>
          <img src={happyHijabiArt} alt="Student illustration" className="h-full w-full object-contain" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple/10 border-2 border-purple/20 rounded-full mb-4">
                <BookOpen size={14} className="text-purple" />
                <span className="text-purple text-xs font-extrabold tracking-wide uppercase">Structured Learning</span>
              </div>
              <h2 className="font-display text-4xl font-black tracking-tight text-ink">Courses with Clear Direction</h2>
              <p className="mt-3 max-w-2xl text-bark">Explore structured learning paths focused on Islamic education.</p>
            </div>
            <Link to="/courses" className="inline-flex items-center gap-2 font-extrabold text-emerald hover:text-emerald-deep transition-colors">
              Browse all courses <ArrowRight size={16} />
            </Link>
          </div>
          {coursesLoading ? <PublicCardsSkeleton count={3} imageHeight="h-52" /> : (
            <div className="grid gap-6 lg:grid-cols-3">
            {featuredCourses.map((course, i) => (
              <motion.div key={course.id || i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={pop} custom={i}
                className="overflow-hidden rounded-2xl border-2 border-parchment bg-white hover:border-emerald/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <img src={getCourseThumbnail(course)} alt={course.title} className="h-48 w-full object-cover" />
                <div className="p-6">
                  <div className="mb-3 inline-flex rounded-full bg-teal/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-teal border-2 border-teal/20">{course.subject || 'General'}</div>
                  <h3 className="font-display text-xl font-extrabold text-ink">{course.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-bark">{course.description || 'A guided course designed to help learners build consistency and understanding.'}</p>
                  <div className="mt-5 flex items-center justify-between border-t-2 border-parchment/50 pt-5">
                    <div>
                      <div className="text-lg font-extrabold text-emerald">{course.is_free ? 'Free' : `$${course.price || 0}`}</div>
                      <div className="text-xs text-bark font-semibold">{course.total_lessons || 0} lessons</div>
                    </div>
                    <Link to="/courses" className="inline-flex items-center gap-2 rounded-xl bg-ivory border-2 border-parchment px-4 py-2.5 text-sm font-bold text-ink-soft hover:border-emerald/30 hover:text-emerald transition-all">
                      Explore <PlayCircle size={15} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory to-ivory-dark/30" />
        <div className="pointer-events-none absolute right-4 top-16 hidden w-24 lg:block animate-breathe art-breathing opacity-85" style={{ animationDelay: '1.8s' }}>
          <img src={happyManArt} alt="Teacher illustration" className="h-full w-full object-contain" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/10 border-2 border-emerald/20 rounded-full mb-4">
              <Sparkles size={14} className="text-emerald" />
              <span className="text-emerald text-xs font-extrabold tracking-wide uppercase">How It Works</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-ink tracking-tight">Three Simple Steps</h2>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={pop} custom={i}
                className="relative overflow-hidden rounded-2xl border-2 border-parchment bg-white p-8 hover:border-emerald/20 transition-colors">
                <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl ${s.color} text-white text-xl font-black border-b-4 ${s.color === 'bg-emerald' ? 'border-emerald-deep' : s.color === 'bg-teal' ? 'border-teal-deep' : 'border-gold-muted'}`}>
                  {s.num}
                </div>
                <h3 className="relative z-10 mt-6 font-display text-2xl font-extrabold text-ink">{s.title}</h3>
                <p className="relative z-10 mt-3 max-w-sm text-sm leading-relaxed text-bark">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-20 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-parchment bg-white text-sand"><ChevronRight size={20} /></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ISLAMIC VERSE STRIP ── */}
      <section className="relative h-72 overflow-hidden bg-emerald-deep">
        <img src={knowledgeJourneyArt} alt="Knowledge illustration" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-emerald-deep/58" />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="absolute inset-0 flex items-center justify-center">
          <div className="quote-panel mx-6 w-full max-w-3xl rounded-3xl px-6 py-8 text-center sm:px-10">
            <p dir="rtl" lang="ar" className="arabic-quote text-4xl sm:text-5xl mb-4">وَقُل رَّبِّ زِدْنِي عِلْمًا</p>
            <p className="text-parchment/90 text-sm sm:text-base max-w-2xl mx-auto font-semibold">"And say: My Lord, increase me in knowledge." — Taha 20:114</p>
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory to-emerald-pale/20" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={pop}>
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-ink tracking-tight mb-6">
              Begin Your Journey <span className="text-emerald">Today</span>
            </h2>
            <p className="text-bark text-lg mb-10 max-w-xl mx-auto">Join IlmConnect and connect with qualified teachers ready to guide your Islamic education.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2.5 px-8 py-4 bg-emerald text-white font-extrabold rounded-2xl border-b-[5px] border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-[5px] transition-all shadow-lg shadow-emerald/25 text-lg">
                Get Started Free <ArrowRight size={20} />
              </Link>
              <Link to="/teachers" className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-parchment border-b-[5px] text-ink font-extrabold rounded-2xl hover:border-emerald/30 hover:text-emerald active:border-b-2 active:mt-[3px] transition-all text-lg">
                Browse Teachers
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
