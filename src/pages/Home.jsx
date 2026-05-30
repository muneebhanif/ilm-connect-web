import { motion as Motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, apiFetch, getCourseThumbnail, getTeacherCoverImage, normalizeTeacher } from '../lib/api'
import { girlsArt, happyHijabiArt, happyManArt, happyMomArt, knowledgeJourneyArt, learningLiveClassArt, teacherSpotlightArt } from '../lib/artwork'
import { PublicCardsSkeleton } from '../components/skeletons.jsx'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  GraduationCap,
  Library,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Video,
} from 'lucide-react'

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
}

const scaleReveal = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

const platformStats = [
  { value: '100+', label: 'Vetted teachers', icon: GraduationCap },
  { value: '1k+', label: 'Active learners', icon: Users },
  { value: '4.9', label: 'Average rating', icon: Star },
]

const trustSignals = [
  { icon: ShieldCheck, title: 'Verified educators', text: 'Teacher profiles, documents, ratings, and approval workflows before families book.' },
  { icon: Calendar, title: 'Booking that behaves', text: 'Parents schedule sessions, teachers start classes, students join from one clean dashboard.' },
  { icon: Video, title: 'Live class stack', text: 'Integrated video rooms, messaging, attendance, recordings, and class history.' },
  { icon: Globe, title: 'Built for home learning', text: 'Flexible online Islamic education for families learning across time zones.' },
]

const features = [
  { icon: BookOpen, title: 'Quran, Tajweed, Arabic', desc: 'Structured learning paths for recitation, memorization, Arabic foundations, and Islamic studies.' },
  { icon: Users, title: 'Family-first controls', desc: 'Parents manage children profiles, student credentials, bookings, and upcoming classes.' },
  { icon: MessageCircle, title: 'Direct communication', desc: 'Teachers, students, and parents can keep scheduling questions and class context in one place.' },
  { icon: Library, title: 'Courses and recordings', desc: 'Teachers publish courses and upload recordings so learning continues after the live session.' },
  { icon: ShieldCheck, title: 'Trust by design', desc: 'Verification, reviews, public profiles, and admin oversight make teacher discovery safer.' },
  { icon: Trophy, title: 'Progress visibility', desc: 'Attendance, completed classes, upcoming sessions, and learning snapshots stay visible.' },
]

const roleCards = [
  {
    title: 'Parents',
    label: 'Plan the journey',
    icon: Users,
    desc: 'Book trusted teachers, manage child profiles, and keep the whole household learning schedule visible.',
    points: ['Book live sessions', 'Create child logins', 'Track upcoming classes'],
    art: happyMomArt,
    color: 'teal',
  },
  {
    title: 'Students',
    label: 'Enter the class',
    icon: GraduationCap,
    desc: 'Join live lessons, revisit recordings, and stay connected to teachers from a focused learner dashboard.',
    points: ['Join live classes', 'Open recordings', 'Review class history'],
    art: happyHijabiArt,
    color: 'gold',
  },
  {
    title: 'Teachers',
    label: 'Run the studio',
    icon: Library,
    desc: 'Manage schedules, students, courses, media, verification, payouts, and messages from one teaching hub.',
    points: ['Start classes', 'Publish courses', 'Manage students'],
    art: happyManArt,
    color: 'emerald',
  },
]

const steps = [
  { title: 'Choose your role', desc: 'Create an account as a parent or teacher. Student access is managed by parents.', icon: Sparkles },
  { title: 'Match with a teacher', desc: 'Browse verified profiles, subjects, ratings, and course offerings before booking.', icon: Users },
  { title: 'Learn live, keep context', desc: 'Join the session, message when needed, and revisit recordings or class history.', icon: Video },
]

function Pill({ children, tone = 'emerald' }) {
  const tones = {
    emerald: 'border-emerald/20 bg-emerald/10 text-emerald',
    gold: 'border-gold/25 bg-gold/15 text-gold-muted',
    teal: 'border-teal/20 bg-teal/10 text-teal',
    ink: 'border-white/12 bg-white/8 text-white',
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] ${tones[tone] || tones.emerald}`}>
      {children}
    </span>
  )
}

function FeaturedTeacherCard({ teacher, index }) {
  const name = teacher.full_name || 'Teacher'
  const subjects = Array.isArray(teacher.subjects) ? teacher.subjects.filter(Boolean) : []
  const rating = Number(teacher.rating || teacher.average_rating || 0)
  const cover = getTeacherCoverImage(teacher)

  return (
    <Motion.article
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={scaleReveal}
      custom={index}
      className="group overflow-hidden rounded-[2rem] border border-parchment/80 bg-white/86 shadow-[0_24px_70px_rgba(60,60,60,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-emerald/30 hover:shadow-[0_34px_90px_rgba(46,158,46,0.14)]"
    >
      <div className="relative h-44 overflow-hidden">
        <img src={cover} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/82 via-ink/18 to-transparent" />
        <div className="absolute left-4 top-4">
          <Pill>Verified</Pill>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-4">
          {teacher.avatar_url ? (
            <img src={teacher.avatar_url} alt={name} className="h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-lg" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-emerald/10 text-xl font-black text-emerald shadow-lg">
              {name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-xl font-black tracking-tight text-ink">{name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm font-black text-gold-muted">
              <Star size={14} className="fill-current" /> {rating.toFixed(1)} rating
            </div>
          </div>
        </div>
        <div className="mt-5 flex min-h-8 flex-wrap gap-1.5">
          {(subjects.length ? subjects : ['Islamic Studies']).slice(0, 3).map((subject) => (
            <span key={subject} className="rounded-full border border-emerald/15 bg-emerald/8 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald">{subject}</span>
          ))}
        </div>
        <p className="mt-4 min-h-11 line-clamp-2 text-sm leading-relaxed text-bark">{teacher.bio || 'Experienced Islamic educator available for live learning.'}</p>
        <div className="mt-6 flex items-center justify-between border-t border-parchment/70 pt-5">
          <div>
            <div className="font-display text-3xl font-black tracking-tight text-ink">${Number(teacher.hourly_rate || 0).toFixed(0)}</div>
            <div className="text-xs font-bold text-bark">per hour</div>
          </div>
          <Link to={`/teachers/${teacher.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white transition hover:bg-emerald">
            View <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </Motion.article>
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
    <div className="public-home relative overflow-hidden bg-[#f6f3e8] text-ink">
      <section className="relative isolate min-h-[92vh] overflow-hidden pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,200,0,0.26),transparent_24rem),radial-gradient(circle_at_86%_10%,rgba(46,158,46,0.22),transparent_28rem),linear-gradient(135deg,#f8f5ea_0%,#f4f7ef_48%,#f8edcf_100%)]" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-ink/8" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f6f3e8] to-transparent" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <Motion.div initial="hidden" animate="visible" variants={reveal} custom={0}>
              <Pill tone="gold"><Sparkles size={13} /> Islamic learning marketplace</Pill>
            </Motion.div>
            <Motion.h1
              initial="hidden"
              animate="visible"
              variants={reveal}
              custom={1}
              className="mt-8 font-display text-5xl font-black leading-[0.95] tracking-[-0.06em] text-ink sm:text-6xl lg:text-[5.7rem]"
            >
              A calmer way to find the right Quran teacher.
            </Motion.h1>
            <Motion.p
              initial="hidden"
              animate="visible"
              variants={reveal}
              custom={2}
              className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-ink-soft sm:text-xl"
            >
              IlmConnect brings teacher discovery, live classes, messages, recordings, and family dashboards into one polished learning flow.
            </Motion.p>
            <Motion.div initial="hidden" animate="visible" variants={reveal} custom={3} className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/teachers" className="group inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 text-sm font-black text-white shadow-[0_20px_55px_rgba(60,60,60,0.18)] transition hover:bg-emerald">
                Browse teachers <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <Link to="/courses" className="inline-flex items-center gap-3 rounded-full border border-ink/12 bg-white/72 px-7 py-4 text-sm font-black text-ink shadow-sm backdrop-blur transition hover:border-emerald/30 hover:text-emerald">
                Explore courses <BookOpen size={18} />
              </Link>
            </Motion.div>
            <Motion.div initial="hidden" animate="visible" variants={reveal} custom={4} className="mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
              {platformStats.map((stat) => (
                <div key={stat.label} className="rounded-[1.5rem] border border-ink/10 bg-white/62 p-4 shadow-sm backdrop-blur">
                  <stat.icon size={20} className="text-emerald" />
                  <div className="mt-4 font-display text-3xl font-black tracking-tight text-ink">{stat.value}</div>
                  <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-bark">{stat.label}</div>
                </div>
              ))}
            </Motion.div>
          </div>

          <Motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -left-8 top-10 hidden rounded-[2rem] border border-white/60 bg-white/66 p-3 shadow-[0_24px_70px_rgba(60,60,60,0.12)] backdrop-blur xl:block">
              <img src={happyMomArt} alt="Parent illustration" className="h-24 w-24 object-contain" />
            </div>
            <div className="absolute -right-6 bottom-16 hidden rounded-[2rem] border border-white/60 bg-white/66 p-3 shadow-[0_24px_70px_rgba(60,60,60,0.12)] backdrop-blur xl:block">
              <img src={happyHijabiArt} alt="Student illustration" className="h-24 w-24 object-contain" />
            </div>

            <div className="relative mx-auto max-w-xl rounded-[2.5rem] border border-white/72 bg-white/72 p-4 shadow-[0_34px_100px_rgba(60,60,60,0.16)] backdrop-blur-xl">
              <div className="overflow-hidden rounded-[2rem] bg-ink text-white">
                <div className="grid min-h-[24rem] lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="relative flex items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,200,0,0.28),transparent_16rem),linear-gradient(160deg,#1f2c22,#122016)] p-8">
                    <img src={learningLiveClassArt} alt="Live Quran class illustration" className="max-h-72 w-full object-contain drop-shadow-2xl" />
                  </div>
                  <div className="flex flex-col justify-between p-7">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-light">
                        <span className="h-2 w-2 rounded-full bg-emerald-light" /> Live class ready
                      </div>
                      <h2 className="mt-6 font-display text-3xl font-black leading-tight tracking-tight">Tajweed session with full family visibility.</h2>
                      <p className="mt-4 text-sm font-semibold leading-6 text-white/68">A teacher starts class, the student joins, and parents can see the learning trail without chasing updates.</p>
                    </div>
                    <div className="mt-8 space-y-3">
                      {['Teacher verified', 'Student dashboard active', 'Recording access enabled'].map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/7 px-4 py-3 text-sm font-bold text-white/84">
                          <CheckCircle2 size={16} className="text-gold" /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 left-8 right-8 rounded-[1.5rem] border border-emerald/20 bg-white px-5 py-4 shadow-[0_20px_60px_rgba(46,158,46,0.18)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-bark">Next class</div>
                    <div className="mt-1 font-display text-xl font-black text-ink">Quran recitation, 5:30 PM</div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald px-4 py-2 text-xs font-black text-white">
                    <Clock size={14} /> On schedule
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        </div>
      </section>

      <section className="relative border-y border-ink/8 bg-white/70 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {trustSignals.map((item, i) => (
            <Motion.div
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={scaleReveal}
              custom={i}
              className="rounded-[1.7rem] border border-parchment/80 bg-[#fbfaf4] p-5 shadow-sm transition hover:border-emerald/25"
            >
              <item.icon size={22} className="text-emerald" />
              <div className="mt-4 font-display text-lg font-black tracking-tight text-ink">{item.title}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-bark">{item.text}</p>
            </Motion.div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden py-28">
        <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-gold/18 blur-3xl" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-90px' }} variants={reveal}>
              <Pill tone="emerald"><Sparkles size={13} /> Why it feels different</Pill>
              <h2 className="mt-6 font-display text-4xl font-black leading-tight tracking-[-0.04em] text-ink sm:text-5xl">Not another noisy education template.</h2>
              <p className="mt-5 text-base font-semibold leading-8 text-bark">The product has a lot of moving parts, so the interface should make families feel oriented, not entertained by random motion.</p>
            </Motion.div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, i) => (
                <Motion.article
                  key={feature.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={scaleReveal}
                  custom={i}
                  className="group rounded-[2rem] border border-parchment/80 bg-white/82 p-6 shadow-[0_18px_55px_rgba(60,60,60,0.055)] backdrop-blur transition hover:-translate-y-1 hover:border-emerald/25"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/10 text-emerald transition group-hover:bg-emerald group-hover:text-white">
                    <feature.icon size={22} />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-black tracking-tight text-ink">{feature.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-bark">{feature.desc}</p>
                </Motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-ink/8 bg-ink py-28 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,200,0,0.18),transparent_24rem),radial-gradient(circle_at_88%_18%,rgba(46,158,46,0.18),transparent_26rem)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-90px' }} variants={reveal} className="max-w-3xl">
            <Pill tone="ink"><Users size={13} /> Built for every role</Pill>
            <h2 className="mt-6 font-display text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">Three dashboards, one learning relationship.</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-white/64">Parents, students, and teachers each get the controls they need without stepping on each other.</p>
          </Motion.div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {roleCards.map((role, i) => (
              <Motion.article
                key={role.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={scaleReveal}
                custom={i}
                className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.09]"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-gold">{role.label}</div>
                    <h3 className="mt-2 font-display text-3xl font-black tracking-tight">{role.title}</h3>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-2">
                    <img src={role.art} alt="" className="h-20 w-20 object-contain" />
                  </div>
                </div>
                <p className="mt-5 text-sm font-semibold leading-7 text-white/64">{role.desc}</p>
                <div className="mt-6 space-y-3">
                  {role.points.map((point) => (
                    <div key={point} className="flex items-center gap-3 text-sm font-bold text-white/82">
                      <CheckCircle2 size={16} className="text-emerald-light" /> {point}
                    </div>
                  ))}
                </div>
              </Motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-28">
        <div className="absolute right-0 top-0 hidden h-full w-[28rem] opacity-20 xl:block">
          <img src={teacherSpotlightArt} alt="Teacher illustration" className="h-full w-full object-contain" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Pill tone="gold"><Star size={13} /> Featured teachers</Pill>
              <h2 className="mt-5 font-display text-4xl font-black tracking-[-0.04em] text-ink sm:text-5xl">Trusted educators, visible before booking.</h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-bark">Browse profiles with ratings, subjects, pricing, and teacher context before committing to a class.</p>
            </div>
            <Link to="/teachers" className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-5 py-3 text-sm font-black text-ink transition hover:border-emerald/30 hover:text-emerald">
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

      <section className="relative border-y border-ink/8 bg-white/74 py-28 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Pill tone="teal"><BookOpen size={13} /> Structured learning</Pill>
              <h2 className="mt-5 font-display text-4xl font-black tracking-[-0.04em] text-ink sm:text-5xl">Courses with a clear next step.</h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-bark">A calm catalog experience for families who want direction, not a pile of cards.</p>
            </div>
            <Link to="/courses" className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-black text-ink transition hover:border-emerald/30 hover:text-emerald">
              Browse courses <ArrowRight size={16} />
            </Link>
          </div>
          {coursesLoading ? <PublicCardsSkeleton count={3} imageHeight="h-52" /> : (
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredCourses.map((course, i) => (
                <Motion.article
                  key={course.id || i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={scaleReveal}
                  custom={i}
                  className="group overflow-hidden rounded-[2rem] border border-parchment/80 bg-white shadow-[0_24px_70px_rgba(60,60,60,0.075)] transition duration-300 hover:-translate-y-1 hover:border-emerald/25"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img src={getCourseThumbnail(course)} alt={course.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-ink">{course.subject || 'General'}</div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-2xl font-black tracking-tight text-ink">{course.title}</h3>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-bark">{course.description || 'A guided course designed to help learners build consistency and understanding.'}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-parchment/70 pt-5">
                      <div>
                        <div className="text-xl font-black text-emerald">{course.is_free ? 'Free' : `$${course.price || 0}`}</div>
                        <div className="text-xs font-bold text-bark">{course.total_lessons || 0} lessons</div>
                      </div>
                      <Link to="/courses" className="inline-flex items-center gap-2 rounded-full bg-ivory px-4 py-2.5 text-sm font-black text-ink-soft transition hover:bg-emerald hover:text-white">
                        Explore <PlayCircle size={15} />
                      </Link>
                    </div>
                  </div>
                </Motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-90px' }} variants={reveal} className="mx-auto max-w-3xl text-center">
            <Pill tone="emerald"><Sparkles size={13} /> How it works</Pill>
            <h2 className="mt-6 font-display text-4xl font-black tracking-[-0.04em] text-ink sm:text-5xl">Simple enough to trust.</h2>
          </Motion.div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <Motion.article
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={scaleReveal}
                custom={i}
                className="relative rounded-[2rem] border border-parchment/80 bg-white/82 p-7 shadow-[0_18px_55px_rgba(60,60,60,0.055)] backdrop-blur"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white">
                  <step.icon size={23} />
                </div>
                <div className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-gold-muted">Step 0{i + 1}</div>
                <h3 className="mt-2 font-display text-2xl font-black tracking-tight text-ink">{step.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-bark">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="absolute -right-5 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-parchment bg-white text-bark md:flex"><ChevronRight size={20} /></div>
                )}
              </Motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative h-[22rem] overflow-hidden bg-ink">
        <img src={knowledgeJourneyArt} alt="Knowledge illustration" className="h-full w-full object-cover opacity-64" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/78 to-emerald-deep/60" />
        <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="absolute inset-0 flex items-center justify-center px-6">
          <div className="max-w-4xl text-center">
            <p dir="rtl" lang="ar" className="arabic-quote text-4xl sm:text-6xl">وَقُل رَّبِّ زِدْنِي عِلْمًا</p>
            <p className="mx-auto mt-5 max-w-2xl text-sm font-bold leading-7 text-white/74 sm:text-base">"And say: My Lord, increase me in knowledge." — Taha 20:114</p>
          </div>
        </Motion.div>
      </section>

      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(46,158,46,0.16),transparent_28rem)]" />
        <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
          <Motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-90px' }} variants={scaleReveal}>
            <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-[2rem] border border-emerald/20 bg-white shadow-[0_20px_60px_rgba(46,158,46,0.15)]">
              <img src={girlsArt} alt="Learners illustration" className="h-16 w-16 object-contain" />
            </div>
            <h2 className="font-display text-4xl font-black tracking-[-0.04em] text-ink sm:text-6xl">Make the first class feel easy.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold leading-8 text-bark">Start with teacher discovery, or browse courses if you already know the learning path you want.</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/signup" className="group inline-flex items-center gap-3 rounded-full bg-emerald px-8 py-4 text-base font-black text-white shadow-[0_20px_55px_rgba(46,158,46,0.22)] transition hover:bg-emerald-deep">
                Get started <ArrowRight size={19} className="transition group-hover:translate-x-1" />
              </Link>
              <Link to="/teachers" className="inline-flex items-center gap-3 rounded-full border border-ink/12 bg-white px-8 py-4 text-base font-black text-ink transition hover:border-emerald/30 hover:text-emerald">
                Browse teachers
              </Link>
            </div>
          </Motion.div>
        </div>
      </section>
    </div>
  )
}
