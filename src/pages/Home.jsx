import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { api, apiFetch, getCourseThumbnail, getTeacherCoverImage, normalizeTeacher } from '../lib/api'
import { girlsArt, happyHijabiArt, happyManArt, happyMomArt, knowledgeJourneyArt, learningLiveClassArt, phoneMockupArt, teacherSpotlightArt } from '../lib/artwork'
import { PublicCardsSkeleton } from '../components/skeletons.jsx'
import TeacherCoverBanner from '../components/TeacherCoverBanner.jsx'
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
  Smartphone,
  Bell,
  Download,
  QrCode,
  Copy,
  Check,
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
    roleKey: 'parent',
    title: 'For Parents',
    icon: Users,
    desc: 'Book trusted teachers, manage children profiles, and track class activity from one dashboard.',
    points: ['Book live sessions', 'Manage children accounts', 'Monitor upcoming classes'],
    accent: 'teal',
    art: happyMomArt,
    cta: 'Join as Parent',
    to: '/signup?role=parent',
  },
  {
    roleKey: 'student',
    title: 'For Students',
    icon: GraduationCap,
    desc: 'Join scheduled classes, revisit recordings, and build consistency with guided learning.',
    points: ['Attend live lessons', 'Access recordings', 'Follow structured courses'],
    accent: 'purple',
    art: happyHijabiArt,
    cta: 'Join as Student',
    to: '/signup?role=student',
  },
  {
    roleKey: 'teacher',
    title: 'For Teachers',
    icon: Library,
    desc: 'Teach live, publish courses, manage schedules, and build a trusted teaching profile.',
    points: ['Run live classes', 'Publish course content', 'Manage students and schedule'],
    accent: 'emerald',
    art: happyManArt,
    cta: 'Teach on IlmConnect',
    to: '/signup?role=teacher',
  },
]

function FeaturedTeacherCard({ teacher, index }) {
  const name = teacher.full_name || 'Teacher'
  const subjects = Array.isArray(teacher.subjects) ? teacher.subjects.filter(Boolean) : []
  const rating = Number(teacher.rating || teacher.average_rating || 0)

  return (
    <Motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={pop}
      custom={index}
      className="group overflow-hidden rounded-2xl border-2 border-parchment bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald/30 hover:shadow-[0_12px_40px_-12px_rgba(88,204,2,0.2)]"
    >
      <TeacherCoverBanner teacher={teacher} className="h-36" />
      <div className="px-6 pb-6 pt-0">
        <div className="mb-4 flex items-start gap-4">
          <div className="-mt-10 relative flex-shrink-0 rounded-2xl border-4 border-white bg-white shadow-lg z-10">
            {teacher.avatar_url ? (
              <img src={teacher.avatar_url} alt={name} className="h-18 w-18 rounded-xl object-cover" />
            ) : (
              <div className="flex h-18 w-18 items-center justify-center rounded-xl bg-emerald-100 text-2xl font-black text-emerald-700">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-2">
            <h3 className="truncate font-display text-lg font-extrabold text-slate-900 group-hover:text-emerald transition-colors">{name}</h3>
            <div className="mt-1 flex items-center gap-1.5">
              <Star size={14} className={rating > 0 ? "text-amber-500 fill-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.25)]" : "text-amber-300/80 fill-amber-50"} />
              <span className="text-xs font-extrabold text-slate-800">{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
              <span className="text-xs font-semibold text-slate-500">{teacher.review_count ? `(${teacher.review_count})` : '(New)'}</span>
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
    </Motion.div>
  )
}

export default function Home() {
  const [copiedApkLink, setCopiedApkLink] = useState(false)
  const apkDownloadUrl = import.meta.env.VITE_APK_DOWNLOAD_URL || '/apk/ilm-connect-v1.apk'
  const fullApkUrl = apkDownloadUrl.startsWith('http')
    ? apkDownloadUrl
    : `${typeof window !== 'undefined' ? window.location.origin : 'https://ilm-connect-web.vercel.app'}${apkDownloadUrl}`

  const handleCopyApkLink = (e) => {
    e?.preventDefault?.()
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullApkUrl)
      setCopiedApkLink(true)
      toast.success('APK download link copied!')
      setTimeout(() => setCopiedApkLink(false), 2500)
    }
  }

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
    <div className="public-home relative overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative flex min-h-[82vh] items-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-pale via-ivory to-gold-light/30" />
        <div className="absolute top-20 -left-20 w-72 h-56 rounded-full bg-emerald/8 blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full bg-gold/8 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-purple/5 blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:px-8 lg:py-18 w-full">
          <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 xl:gap-20">
            <div className="relative z-10">
              <Motion.div initial="hidden" animate="visible" variants={pop} custom={0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald/20 rounded-full mb-6 shadow-sm">
                <Flame size={16} className="text-emerald" />
                <span className="text-emerald text-xs font-extrabold tracking-wide uppercase">Islamic Education Platform</span>
              </Motion.div>
              <Motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-ink leading-[1.06] tracking-tight mb-5">
                Learn Quran<br />
                <span className="text-emerald">with the Best</span><br />
                <span className="text-gold">Teachers</span>
              </Motion.h1>
              <Motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="text-ink-soft text-base sm:text-lg leading-relaxed max-w-xl mb-8">
                Connect with qualified Islamic educators for live Quran, Tajweed, and Arabic classes — all from the comfort of your home.
              </Motion.p>
              <Motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-wrap items-center gap-4">
                <Link to="/teachers" className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald text-white text-base font-extrabold rounded-2xl border-b-[5px] border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-[5px] transition-all shadow-lg shadow-emerald/25">
                  Browse Teachers <ArrowRight size={18} />
                </Link>
                <Link to="/courses" className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-parchment border-b-[5px] text-ink font-extrabold rounded-2xl hover:border-emerald/30 hover:text-emerald active:border-b-2 active:mt-[3px] transition-all">
                  Explore Courses
                </Link>
              </Motion.div>
              <Motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
                className="mt-8 grid max-w-lg grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
                {[
                  { val: '100+', label: 'Teachers', Icon: GraduationCap },
                  { val: '1,000+', label: 'Students', Icon: Users },
                  { val: '4.9', label: 'Rating', Icon: Star },
                ].map((s) => (
                  <div key={s.label} className="flex min-w-0 items-center gap-3 rounded-2xl border-2 border-parchment/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:bg-transparent sm:px-0 sm:py-0 sm:border-0 sm:shadow-none">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald/10 border border-emerald/20">
                      <s.Icon size={20} className="text-emerald" />
                    </div>
                    <div>
                      <div className="font-display font-black text-lg leading-none text-ink sm:text-xl">{s.val}</div>
                      <div className="mt-1 text-bark text-[11px] font-bold leading-none sm:text-xs">{s.label}</div>
                    </div>
                  </div>
                ))}
              </Motion.div>
            </div>

            {/* Hero right - Playful card stack */}
            <Motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} className="hidden lg:block relative">
              <div className="relative mx-auto w-full max-w-[26rem]">
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/30 flex items-center justify-center rotate-12"><BookOpen size={28} className="text-gold-muted" /></div>
                <div className="absolute -bottom-4 -left-6 w-14 h-14 rounded-2xl bg-purple/20 border-2 border-purple/30 flex items-center justify-center"><GraduationCap size={24} className="text-purple" /></div>
                <div className="absolute -left-18 top-18 hidden w-20 xl:block">
                  <img src={happyMomArt} alt="Parent illustration" className="h-full w-full object-contain" />
                </div>
                <div className="absolute -right-14 bottom-12 hidden w-20 xl:block">
                  <img src={happyHijabiArt} alt="Student illustration" className="h-full w-full object-contain" />
                </div>

                {/* Main hero card */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-parchment bg-white shadow-2xl">
                  <div className="flex h-56 items-center justify-center bg-gradient-to-br from-emerald-pale via-white to-gold-light/40 p-6">
                    <img src={learningLiveClassArt} alt="IlmConnect live class illustration" className="h-full w-full object-contain" />
                  </div>
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-emerald px-4 py-1.5 border-b-[3px] border-emerald-deep">
                    <span className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-white text-xs font-extrabold">LIVE CLASS</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald/10 border-2 border-emerald/20 border-b-4 flex items-center justify-center"><Video size={22} className="text-emerald" /></div>
                      <div>
                        <div className="font-display font-extrabold text-ink text-base">Quran Tajweed Class</div>
                        <div className="text-bark text-xs flex items-center gap-1 font-bold"><Clock size={12} /> Starting in 5 min</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-emerald font-extrabold bg-emerald/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 border-2 border-emerald/20">
                        <span className="w-2 h-2 bg-emerald rounded-full" /> Live
                      </span>
                      <Link to="/signup" className="px-5 py-2.5 bg-emerald text-white text-sm font-extrabold rounded-xl border-b-4 border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-1 transition-all">Join Now</Link>
                    </div>
                  </div>
                </div>
              </div>
            </Motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="relative border-y-2 border-parchment/60 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Verified teachers', text: 'Public profiles, ratings, and approval workflow.' },
              { icon: Globe, title: 'Global access', text: 'Learn from home with flexible scheduling.' },
              { icon: Calendar, title: 'Live booking', text: 'Book sessions and manage classes in one place.' },
              { icon: Video, title: 'Integrated classes', text: 'Live video, messaging, and recordings built-in.' },
            ].map((item, i) => (
              <Motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={pop} custom={i}
                className="flex items-start gap-4 rounded-2xl bg-ivory px-5 py-5 border-2 border-parchment/50 hover:border-emerald/20 transition-colors">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald/10 border-b-[3px] border-emerald/20">
                  <item.icon size={22} className="text-emerald" />
                </div>
                <div>
                  <div className="font-extrabold text-ink">{item.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-bark">{item.text}</div>
                </div>
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative py-20">
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="pointer-events-none absolute -left-6 top-10 hidden w-24 lg:block opacity-90">
            <img src={girlsArt} alt="Learners illustration" className="h-full w-full object-contain" />
          </div>
          <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border-2 border-gold/20 rounded-full mb-4">
              <Zap size={14} className="text-gold-muted" />
              <span className="text-gold-muted text-xs font-extrabold tracking-wide uppercase">Why IlmConnect</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-ink tracking-tight">Everything You Need to Learn</h2>
            <p className="text-bark text-lg mt-4 max-w-2xl mx-auto">A complete Islamic education platform designed for modern families.</p>
          </Motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const c = featureColors[f.color]
              return (
                <Motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={pop} custom={i}
                  className={`group relative bg-white rounded-2xl p-7 border-2 ${c.border} ${c.hover} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                  <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center mb-5 border-b-4 ${c.border}`}>
                    <f.icon size={26} className={c.text} />
                  </div>
                  <h3 className="font-display font-extrabold text-ink text-lg mb-2">{f.title}</h3>
                  <p className="text-bark text-sm leading-relaxed">{f.desc}</p>
                </Motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="relative py-20 bg-white border-y-2 border-parchment/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/10 border-2 border-emerald/20 rounded-full mb-4">
              <Users size={14} className="text-emerald" />
              <span className="text-emerald text-xs font-extrabold tracking-wide uppercase">Built for every role</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-ink">One Platform, Three Experiences</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-bark">Discovery, booking, live classes, and dashboards for parents, teachers, and students.</p>
          </Motion.div>
          <div className="grid gap-5 lg:grid-cols-3">
            {roleCards.map((role, i) => {
              const accentMap = { teal: 'border-teal/20 bg-teal/10 text-teal', purple: 'border-purple/20 bg-purple/10 text-purple', emerald: 'border-emerald/20 bg-emerald/10 text-emerald' }
              const accent = accentMap[role.accent]
              return (
                <Motion.div key={role.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={pop} custom={i}
                  className="rounded-2xl border-2 border-parchment bg-ivory/50 p-8 hover:border-emerald/20 transition-colors">
                  <div className="mb-5 flex justify-end">
                    <div className="h-20 w-20 rounded-2xl bg-white/80 p-2 shadow-sm">
                      <img src={role.art} alt="" className="h-full w-full object-contain" />
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
                  <div className="mt-8 pt-4 border-t border-parchment/60">
                    <Link
                      to={role.to}
                      className="inline-flex items-center gap-2 text-sm font-extrabold text-ink hover:text-emerald group transition-colors"
                    >
                      <span>{role.cta}</span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1 text-emerald" />
                    </Link>
                  </div>
                </Motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED TEACHERS ── */}
      <section className="relative py-20 overflow-hidden">
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
              <h2 className="font-display text-3xl font-black tracking-tight text-ink">Meet Trusted Educators</h2>
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
      <section className="relative py-20 bg-white border-y-2 border-parchment/60">
        <div className="pointer-events-none absolute left-4 top-12 hidden w-24 lg:block opacity-80">
          <img src={happyHijabiArt} alt="Student illustration" className="h-full w-full object-contain" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple/10 border-2 border-purple/20 rounded-full mb-4">
                <BookOpen size={14} className="text-purple" />
                <span className="text-purple text-xs font-extrabold tracking-wide uppercase">Structured Learning</span>
              </div>
              <h2 className="font-display text-3xl font-black tracking-tight text-ink">Courses with Clear Direction</h2>
              <p className="mt-3 max-w-2xl text-bark">Explore structured learning paths focused on Islamic education.</p>
            </div>
            <Link to="/courses" className="inline-flex items-center gap-2 font-extrabold text-emerald hover:text-emerald-deep transition-colors">
              Browse all courses <ArrowRight size={16} />
            </Link>
          </div>
          {coursesLoading ? <PublicCardsSkeleton count={3} imageHeight="h-52" /> : (
            <div className="grid gap-6 lg:grid-cols-3">
            {featuredCourses.map((course, i) => (
              <Motion.div key={course.id || i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={pop} custom={i}
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
                    <Link to={course.id ? `/courses/${course.id}` : '/courses'} className="inline-flex items-center gap-2 rounded-xl bg-ivory border-2 border-parchment px-4 py-2.5 text-sm font-bold text-ink-soft hover:border-emerald/30 hover:text-emerald transition-all">
                      Enroll <PlayCircle size={15} />
                    </Link>
                  </div>
                </div>
              </Motion.div>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory to-ivory-dark/30" />
        <div className="pointer-events-none absolute right-4 top-16 hidden w-24 lg:block opacity-85">
          <img src={happyManArt} alt="Teacher illustration" className="h-full w-full object-contain" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/10 border-2 border-emerald/20 rounded-full mb-4">
              <Sparkles size={14} className="text-emerald" />
              <span className="text-emerald text-xs font-extrabold tracking-wide uppercase">How It Works</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-ink tracking-tight">Three Simple Steps</h2>
          </Motion.div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <Motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={pop} custom={i}
                className="relative overflow-hidden rounded-2xl border-2 border-parchment bg-white p-8 hover:border-emerald/20 transition-colors">
                <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl ${s.color} text-white text-xl font-black border-b-4 ${s.color === 'bg-emerald' ? 'border-emerald-deep' : s.color === 'bg-teal' ? 'border-teal-deep' : 'border-gold-muted'}`}>
                  {s.num}
                </div>
                <h3 className="relative z-10 mt-6 font-display text-2xl font-extrabold text-ink">{s.title}</h3>
                <p className="relative z-10 mt-3 max-w-sm text-sm leading-relaxed text-bark">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-20 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-parchment bg-white text-sand"><ChevronRight size={20} /></div>
                )}
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD OUR MOBILE APP ── */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-b from-white via-emerald-pale/15 to-white border-y-2 border-parchment/60">
        <div className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-teal/10 blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Content */}
            <Motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/10 border-2 border-emerald/20 rounded-full mb-5">
                <Smartphone size={16} className="text-emerald" />
                <span className="text-emerald text-xs font-extrabold tracking-wide uppercase">Download Our Mobile App</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-black text-ink tracking-tight leading-[1.15]">
                Take Your Quran & Tajweed Learning <span className="text-emerald">Everywhere</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-bark leading-relaxed max-w-2xl">
                Experience seamless 1-on-1 Islamic learning on the go. Join live video sessions with verified teachers, receive instant class reminders, and practice daily Quran recitation from anywhere in the world.
              </p>

              {/* Feature Points */}
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border border-parchment/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-emerald/30">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                    <Video size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-ink text-base">Live Interactive Video Classes</h3>
                    <p className="mt-0.5 text-sm text-bark">Crystal-clear video & audio with teacher screen share, live messaging, and interactive whiteboard tools.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-parchment/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-teal/30">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-ink text-base">Smart Class Reminders & Schedule</h3>
                    <p className="mt-0.5 text-sm text-bark">Instant push notifications 15 minutes before class with automatic timezone alignment so you never miss a lesson.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-parchment/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-purple/30">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-ink text-base">Lesson Recordings & Progress Tracking</h3>
                    <p className="mt-0.5 text-sm text-bark">Revisit previous classes, follow curriculum milestones, and practice recitation whenever you want.</p>
                  </div>
                </div>
              </div>

              {/* Direct APK Download & QR Code Section */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
                {/* Download Button */}
                <div className="flex flex-col gap-2">
                  <a
                    href={apkDownloadUrl}
                    download="ilm-connect-v1.apk"
                    className="group inline-flex items-center justify-center gap-3.5 rounded-2xl bg-emerald px-6 py-4 text-white font-extrabold shadow-lg shadow-emerald/25 transition-all duration-300 hover:bg-emerald-deep hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white group-hover:scale-110 transition-transform">
                      <Download size={22} />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-black uppercase tracking-wider text-emerald-pale">Direct Download</div>
                      <div className="text-base font-black">Download Android APK</div>
                    </div>
                  </a>
                  <div className="flex items-center justify-between px-2 text-[11px] font-bold text-bark">
                    <span>v1.0.0</span>
                    <span>•</span>
                    <span>Android 8.0+</span>
                    <span>•</span>
                    <span>~380 MB</span>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex items-center gap-4 rounded-2xl border-2 border-parchment/80 bg-white/95 p-3.5 shadow-md backdrop-blur-md">
                  <div className="rounded-xl border border-parchment/70 bg-white p-2 shadow-sm">
                    <QRCodeSVG
                      value={fullApkUrl}
                      size={84}
                      level="M"
                      includeMargin={false}
                      fgColor="#064e3b"
                    />
                  </div>
                  <div className="max-w-[170px]">
                    <div className="flex items-center gap-1.5 text-xs font-black text-ink">
                      <QrCode size={14} className="text-emerald" /> Scan & Download
                    </div>
                    <p className="mt-1 text-[11px] leading-tight text-bark">
                      Scan with your phone camera to download APK directly to your phone.
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyApkLink}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald hover:text-emerald-deep transition-colors"
                    >
                      {copiedApkLink ? <Check size={12} /> : <Copy size={12} />}
                      {copiedApkLink ? 'Link copied!' : 'Copy download link'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-parchment/70 pt-5">
                <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
                  <CheckCircle2 size={15} className="text-emerald" />
                  <span>No Play Store login required</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
                  <CheckCircle2 size={15} className="text-emerald" />
                  <span>Direct 1-tap install</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-bark ml-auto">
                  <span className="text-amber-500 font-black">★ ★ ★ ★ ★</span>
                  <span className="font-extrabold text-ink">4.9/5 Rating</span>
                </div>
              </div>
            </Motion.div>

            {/* Right Phone Mockup Visual */}
            <Motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={pop}
              className="relative lg:col-span-5 flex items-center justify-center pt-6 lg:pt-0"
            >
              {/* Decorative radial blur backdrop */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-gradient-to-tr from-emerald/25 via-teal/20 to-gold/15 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
              </div>

              {/* Floating Tag Top */}
              <div className="absolute -top-2 left-2 sm:-top-4 sm:left-4 z-20 flex items-center gap-2.5 rounded-2xl border-2 border-white bg-white/95 px-4 py-2.5 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md">
                <span className="flex h-2.5 w-2.5 rounded-full bg-rose animate-ping" />
                <div className="text-xs font-extrabold text-ink">Live Class in Session</div>
              </div>

              {/* Floating Tag Bottom */}
              <div className="absolute -bottom-2 right-2 sm:-bottom-3 sm:right-4 z-20 flex items-center gap-2.5 rounded-2xl border-2 border-white bg-white/95 px-4 py-2.5 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald text-white text-xs font-black">
                  ✓
                </div>
                <div className="text-xs font-extrabold text-ink">Quran Recitation • 100%</div>
              </div>

              {/* Phone Mockup Photo Container */}
              <div className="relative z-10 max-w-[260px] sm:max-w-[300px] lg:max-w-[340px] transform transition-transform duration-500 hover:scale-[1.03]">
                <img
                  src={phoneMockupArt}
                  alt="IlmConnect Mobile App"
                  className="h-auto w-full drop-shadow-[0_25px_50px_rgba(6,78,59,0.22)] object-contain"
                />
              </div>
            </Motion.div>
          </div>
        </div>
      </section>

      {/* ── ISLAMIC VERSE STRIP ── */}
      <section className="relative h-56 overflow-hidden bg-emerald-deep">
        <img src={knowledgeJourneyArt} alt="Knowledge illustration" className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-emerald-deep/58" />
        <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="absolute inset-0 flex items-center justify-center">
          <div className="quote-panel mx-6 w-full max-w-3xl rounded-3xl px-6 py-8 text-center sm:px-10">
            <p dir="rtl" lang="ar" className="arabic-quote text-3xl sm:text-4xl mb-4">وَقُل رَّبِّ زِدْنِي عِلْمًا</p>
            <p className="text-parchment/90 text-sm sm:text-base max-w-2xl mx-auto font-semibold">"And say: My Lord, increase me in knowledge." — Taha 20:114</p>
          </div>
        </Motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory to-emerald-pale/20" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={pop}>
            <div className="mb-5 flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-emerald/10 border-2 border-emerald/20"><Sparkles size={24} className="text-emerald" /></div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-ink tracking-tight mb-6">
              Begin Your Journey <span className="text-emerald">Today</span>
            </h2>
            <p className="text-bark text-base sm:text-lg mb-8 max-w-xl mx-auto">Join IlmConnect and connect with qualified teachers ready to guide your Islamic education.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald text-white font-extrabold rounded-2xl border-b-[5px] border-emerald-deep hover:brightness-110 active:border-b-0 active:mt-[5px] transition-all shadow-lg shadow-emerald/25 text-base">
                Get Started Free <ArrowRight size={20} />
              </Link>
              <Link to="/teachers" className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-parchment border-b-[5px] text-ink font-extrabold rounded-2xl hover:border-emerald/30 hover:text-emerald active:border-b-2 active:mt-[3px] transition-all text-base">
                Browse Teachers
              </Link>
            </div>
          </Motion.div>
        </div>
      </section>
    </div>
  )
}
