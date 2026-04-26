import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useOutletContext } from 'react-router-dom'
import {
  Calendar, BookOpen, Clock3, Video, Play, GraduationCap, FileVideo, Search, Star,
  UserCircle2, ShieldCheck, MonitorPlay, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../lib/auth.jsx'
import toast from 'react-hot-toast'
import { api, authFetch } from '../../lib/api.js'
import { StatCard, SectionCard, EmptyState, StatusPill, ActionButton, TextInput, GridList } from '../../components/dashboard-ui.jsx'
import MessageCenter from '../../components/MessageCenter.jsx'
import { SectionRowsSkeleton, SkeletonBlock } from '../../components/skeletons.jsx'

function PageHeader({ title, description, actions, children }) {
  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bark">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

function getLiveClassMeta(item = {}) {
  const liveStatus = String(item.live_status || '').toLowerCase()
  const status = String(item.status || '').toLowerCase()
  const isLive = liveStatus === 'live'
  const canJoin = isLive && status !== 'completed' && status !== 'cancelled'

  return {
    isLive,
    canJoin,
    label: isLive ? 'Teacher is live now' : 'Waiting for teacher to start',
    tone: isLive ? 'emerald' : 'gold',
  }
}

function getClassTimeValue(value) {
  const parsed = new Date(value || '').getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function formatClassDateLabel(value) {
  const parsed = new Date(value || '')
  if (Number.isNaN(parsed.getTime())) return 'Date not available'
  return parsed.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function groupStudentClasses(classes = []) {
  const now = Date.now()
  const live = []
  const upcoming = []
  const history = []

  classes.forEach((item) => {
    const status = String(item.status || '').toLowerCase()
    const liveMeta = getLiveClassMeta(item)
    const startsAt = getClassTimeValue(item.scheduled_date)
    const isHistory = status === 'completed' || status === 'cancelled' || (!liveMeta.isLive && startsAt > 0 && startsAt < now)

    if (liveMeta.isLive) {
      live.push(item)
      return
    }
    if (isHistory) {
      history.push(item)
      return
    }
    upcoming.push(item)
  })

  live.sort((a, b) => getClassTimeValue(a.scheduled_date) - getClassTimeValue(b.scheduled_date))
  upcoming.sort((a, b) => getClassTimeValue(a.scheduled_date) - getClassTimeValue(b.scheduled_date))
  history.sort((a, b) => getClassTimeValue(b.scheduled_date) - getClassTimeValue(a.scheduled_date))

  return { live, upcoming, history }
}

export default function StudentDashboard() {
  const { user, token } = useAuth()
  const { activeTab } = useOutletContext()
  const [reviewDrafts, setReviewDrafts] = useState({})

  const profileQ = useQuery({ queryKey: ['studentProfile', user?.id], queryFn: () => authFetch(api.studentProfile(user.id), token), enabled: !!user?.id && !!token })
  const classesQ = useQuery({ queryKey: ['studentClasses', user?.id], queryFn: () => authFetch(api.studentClasses(user.id), token), enabled: !!user?.id && !!token, refetchInterval: 10000 })
  const recordingsQ = useQuery({ queryKey: ['studentRecordings', user?.id], queryFn: () => authFetch(api.studentRecordings(user.id), token), enabled: !!user?.id && !!token })

  const recordingAccess = useMutation({ mutationFn: (id) => authFetch(api.recordingAccess(id), token), onSuccess: (d) => { if (d?.url) window.open(d.url, '_blank', 'noopener,noreferrer'); else toast.error('Could not get recording URL') }, onError: (err) => toast.error(err?.message || 'Access denied') })
  const reviewMut = useMutation({ mutationFn: (p) => authFetch(api.createReview(), token, { method: 'POST', body: JSON.stringify(p) }), onSuccess: () => toast.success('Review submitted!'), onError: (err) => toast.error(err?.message || 'Failed to submit review') })

  const student = profileQ.data?.student || {}
  const allClasses = classesQ.data?.classes || []
  const classGroups = useMemo(() => groupStudentClasses(allClasses), [allClasses])
  const focusClasses = [...classGroups.live, ...classGroups.upcoming]
  const attendance = classesQ.data?.attendance || { totalClasses: 0, attendedClasses: 0, missedClasses: 0, attendancePercentage: 0 }
  const recordings = recordingsQ.data?.recordings || []
  const upcoming = focusClasses
  const completed = classGroups.history.filter(c => c.status === 'completed')

  // ─── OVERVIEW ───
  if (activeTab === 'overview') return (
    <PageHeader title={`Welcome, ${student.name || user?.full_name || 'Student'}`} description="Track classes, access recordings, and manage your learning." actions={<Link to="/teachers" className="inline-flex items-center gap-2 rounded-2xl bg-emerald px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald/20">Browse teachers <Search size={16} /></Link>}>
      <GridList cols="md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} label="Upcoming" value={upcoming.length} tone="emerald" />
        <StatCard icon={BookOpen} label="Total classes" value={allClasses.length} tone="gold" />
        <StatCard icon={FileVideo} label="Recordings" value={recordings.length} tone="teal" />
        <StatCard icon={Star} label="Completed" value={completed.length} tone="ink" />
        <StatCard icon={CheckCircle2} label="Attendance" value={`${attendance.attendancePercentage || 0}%`} tone="emerald" />
      </GridList>
      {upcoming.some((item) => getLiveClassMeta(item).isLive) && (
        <div className="mt-6 rounded-[24px] border border-emerald/20 bg-emerald/8 px-5 py-4 text-sm text-emerald">
          Your teacher has started at least one class. Join from the cards below.
        </div>
      )}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Upcoming classes">
          {classesQ.isLoading ? <SectionRowsSkeleton rows={4} itemClassName="h-20" /> : focusClasses.length === 0 ? <EmptyState icon={GraduationCap} title="No active classes" text="Live and upcoming classes will appear here first." /> : <div className="space-y-3">{focusClasses.slice(0, 5).map(c => { const liveMeta = getLiveClassMeta(c); return <div key={c.id} className={`rounded-[24px] border p-4 ${liveMeta.isLive ? 'border-emerald/20 bg-gradient-to-r from-emerald/10 via-white to-teal/10' : 'border-parchment/50 bg-ivory/55'}`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><StatusPill tone={liveMeta.tone}>{liveMeta.isLive ? 'live now' : 'coming up'}</StatusPill><span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/70">{formatClassDateLabel(c.scheduled_date)}</span></div><div className="mt-2 font-semibold text-ink">{c.courses?.title || 'Class'}</div><div className="mt-1 text-sm text-bark">Teacher: {c.courses?.teachers?.profiles?.full_name || 'Teacher'}</div></div><div className="flex flex-col items-end gap-2"><StatusPill tone={liveMeta.tone}>{liveMeta.label}</StatusPill></div></div>{liveMeta.canJoin ? <Link to={`/classroom/${c.id}`} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white"><MonitorPlay size={14} /> Join now</Link> : <div className="mt-3 rounded-2xl border border-parchment/50 bg-white px-4 py-3 text-sm text-bark">The join button will appear automatically when the teacher starts this class.</div>}</div>})}</div>}
        </SectionCard>
        <SectionCard title="Student profile">
          {profileQ.isLoading ? <div className="space-y-4"><SkeletonBlock className="h-20 w-full rounded-2xl" /><div className="grid grid-cols-2 gap-3"><SkeletonBlock className="h-24" /><SkeletonBlock className="h-24" /></div></div> : <div className="rounded-[24px] bg-ivory/55 p-6"><div className="flex items-center gap-4">{student.avatar_url ? <img src={student.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald"><UserCircle2 size={24} /></div>}<div><div className="font-display text-2xl font-bold text-ink">{student.name || 'Student'}</div><div className="text-sm text-bark">{student.email || ''}</div></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-parchment/50 bg-white p-4"><div className="text-xs uppercase tracking-wider text-bark/70">Age</div><div className="mt-2 text-lg font-semibold text-ink">{student.age || '—'}</div></div><div className="rounded-2xl border border-parchment/50 bg-white p-4"><div className="text-xs uppercase tracking-wider text-bark/70">Access</div><div className="mt-2"><StatusPill tone="emerald">Active</StatusPill></div></div></div></div>}
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── CLASSES ───
  if (activeTab === 'classes') return (
    <PageHeader title="My Classes" description="All scheduled and completed classes.">
      <GridList cols="md:grid-cols-3">
        <StatCard icon={MonitorPlay} label="Live now" value={classGroups.live.length} tone="emerald" />
        <StatCard icon={Calendar} label="Coming up" value={classGroups.upcoming.length} tone="gold" />
        <StatCard icon={Clock3} label="Past classes" value={classGroups.history.length} tone="ink" />
      </GridList>
      <SectionCard className="mt-6">
        <div className="mb-5 rounded-[24px] border border-parchment/50 bg-ivory/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald">Attendance overview</div>
              <div className="mt-1 text-xl font-bold text-ink">{attendance.attendancePercentage || 0}% attendance</div>
            </div>
            <StatusPill tone={(attendance.attendancePercentage || 0) >= 75 ? 'emerald' : (attendance.attendancePercentage || 0) >= 50 ? 'gold' : 'rose'}>
              {attendance.attendedClasses || 0}/{attendance.totalClasses || 0} attended
            </StatusPill>
          </div>
        </div>
        {classesQ.isLoading ? <SectionRowsSkeleton rows={4} itemClassName="h-24" /> : allClasses.length === 0 ? <EmptyState icon={GraduationCap} title="No classes" text="Enroll or book classes to see them here." /> : <div className="space-y-6">
          {classGroups.live.length > 0 && <div><div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald">Live now</div><div className="space-y-4">{classGroups.live.map(c => { const tid = c.courses?.teacher_id; const d = reviewDrafts[c.id] || { rating: 5, comment: '' }; const liveMeta = getLiveClassMeta(c); return <div key={c.id} className="rounded-[28px] border border-emerald/20 bg-gradient-to-r from-emerald/10 via-white to-teal/10 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald text-white"><Video size={18} /></div><div><div className="flex flex-wrap items-center gap-2"><StatusPill tone="emerald">live now</StatusPill><span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald">{formatClassDateLabel(c.scheduled_date)}</span></div><div className="mt-2 font-semibold text-ink">{c.courses?.title || 'Class'}</div><div className="mt-1 text-sm text-bark">Teacher: {c.courses?.teachers?.profiles?.full_name || 'Teacher'}</div></div></div><div className="flex flex-col items-end gap-2"><StatusPill tone={liveMeta.tone}>{liveMeta.label}</StatusPill><Link to={`/classroom/${c.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white"><MonitorPlay size={14} /> Join live class</Link></div></div>{c.status === 'completed' && tid && <div className="mt-4 rounded-2xl border border-parchment/50 bg-ivory/55 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-soft"><ShieldCheck size={15} /> Rate teacher</div><div className="grid gap-3 lg:grid-cols-[120px_1fr_auto]"><TextInput label="Rating" type="number" min="1" max="5" value={d.rating} onChange={e => setReviewDrafts(p => ({ ...p, [c.id]: { ...d, rating: e.target.value } }))} /><TextInput label="Comment" value={d.comment} onChange={e => setReviewDrafts(p => ({ ...p, [c.id]: { ...d, comment: e.target.value } }))} /><div className="flex items-end"><ActionButton onClick={() => reviewMut.mutate({ teacher_id: tid, session_id: c.id, rating: Number(d.rating), comment: d.comment })} disabled={reviewMut.isPending}>Submit</ActionButton></div></div></div>}</div> })}</div></div>}
          {classGroups.upcoming.length > 0 && <div><div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-gold">Coming up</div><div className="space-y-4">{classGroups.upcoming.map(c => { const liveMeta = getLiveClassMeta(c); return <div key={c.id} className="rounded-[24px] border border-parchment/50 bg-white p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold"><Calendar size={18} /></div><div><div className="flex flex-wrap items-center gap-2"><StatusPill tone="gold">upcoming</StatusPill><span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/70">{formatClassDateLabel(c.scheduled_date)}</span></div><div className="mt-2 font-semibold text-ink">{c.courses?.title || 'Class'}</div><div className="mt-1 text-sm text-bark">Teacher: {c.courses?.teachers?.profiles?.full_name || 'Teacher'}</div><div className="mt-2 text-xs text-bark">{c.duration_minutes || 60} min session</div></div></div><div className="flex flex-col items-end gap-2"><StatusPill tone={liveMeta.tone}>{liveMeta.label}</StatusPill></div></div><div className="mt-3 rounded-2xl border border-parchment/50 bg-ivory/55 px-4 py-3 text-sm text-bark">The join button appears automatically as soon as the teacher starts the class.</div></div> })}</div></div>}
          {classGroups.history.length > 0 && <div><div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-bark/70">History</div><div className="space-y-4">{classGroups.history.map(c => { const tid = c.courses?.teacher_id; const d = reviewDrafts[c.id] || { rating: 5, comment: '' }; const liveMeta = getLiveClassMeta(c); return <div key={c.id} className="rounded-[24px] border border-parchment/50 bg-ivory/55 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-soft"><Clock3 size={18} /></div><div><div className="font-semibold text-ink">{c.courses?.title || 'Class'}</div><div className="mt-1 text-sm text-bark">Teacher: {c.courses?.teachers?.profiles?.full_name || 'Teacher'}</div><div className="mt-2 text-xs text-bark">{formatClassDateLabel(c.scheduled_date)} • {c.duration_minutes || 60} min</div></div></div><div className="flex flex-col items-end gap-2"><StatusPill tone={c.status === 'completed' ? 'emerald' : c.status === 'cancelled' ? 'rose' : liveMeta.tone}>{c.status || 'ended'}</StatusPill></div></div>{c.status === 'completed' && tid && <div className="mt-4 rounded-2xl border border-parchment/50 bg-white p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-soft"><ShieldCheck size={15} /> Rate teacher</div><div className="grid gap-3 lg:grid-cols-[120px_1fr_auto]"><TextInput label="Rating" type="number" min="1" max="5" value={d.rating} onChange={e => setReviewDrafts(p => ({ ...p, [c.id]: { ...d, rating: e.target.value } }))} /><TextInput label="Comment" value={d.comment} onChange={e => setReviewDrafts(p => ({ ...p, [c.id]: { ...d, comment: e.target.value } }))} /><div className="flex items-end"><ActionButton onClick={() => reviewMut.mutate({ teacher_id: tid, session_id: c.id, rating: Number(d.rating), comment: d.comment })} disabled={reviewMut.isPending}>Submit</ActionButton></div></div></div>}</div> })}</div></div>}
        </div>}
      </SectionCard>
    </PageHeader>
  )

  // ─── RECORDINGS ───
  if (activeTab === 'recordings') return (
    <PageHeader title="Recordings" description="Access class recordings.">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Available recordings">
          {recordingsQ.isLoading ? <SectionRowsSkeleton rows={4} itemClassName="h-20" /> : recordings.length === 0 ? <EmptyState icon={FileVideo} title="No recordings" text="Recordings will appear when teachers upload them." /> : <div className="space-y-4">{recordings.map(r => <div key={r.id} className="rounded-[24px] border border-parchment/50 bg-white p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="font-semibold text-ink">{r.title}</div><div className="mt-1 text-sm text-bark">{r.course?.title || 'Course'} • {r.teacher?.full_name || 'Teacher'}</div>{r.description && <div className="mt-2 text-sm text-bark">{r.description}</div>}</div><div className="flex items-center gap-2"><StatusPill tone={r.can_access ? 'emerald' : 'gold'}>{r.can_access ? 'Accessible' : r.visibility}</StatusPill><button onClick={() => recordingAccess.mutate(r.id)} disabled={!r.can_access || recordingAccess.isPending} className="inline-flex items-center gap-2 rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Play size={14} /> Open</button></div></div></div>)}</div>}
        </SectionCard>
        <SectionCard title="Access guide">
          <div className="space-y-3 text-sm text-bark">
            <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4"><span className="font-semibold text-ink">Free recordings</span> are available to all enrolled students.</div>
            <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4"><span className="font-semibold text-ink">Paid recordings</span> require course enrollment.</div>
            <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4">The Open button fetches a secure URL for playback.</div>
          </div>
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── COURSES ───
  if (activeTab === 'courses') return (
    <PageHeader title="Browse Courses" description="Explore available courses.">
      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard>
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/10"><BookOpen size={28} className="text-emerald" /></div>
            <h3 className="font-display text-2xl font-bold text-ink">Course Catalog</h3>
            <p className="mt-2 text-sm text-bark">Browse all available courses and lessons.</p>
            <Link to="/courses" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald/20">View courses</Link>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10"><Search size={28} className="text-gold" /></div>
            <h3 className="font-display text-2xl font-bold text-ink">Find Teachers</h3>
            <p className="mt-2 text-sm text-bark">Connect with qualified instructors.</p>
            <Link to="/teachers" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gold/20">Browse teachers</Link>
          </div>
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── PROFILE ───
  if (activeTab === 'profile') return (
    <PageHeader title="Profile" description="Your learner profile.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Identity">
          {profileQ.isLoading ? <div className="space-y-4"><SkeletonBlock className="h-28 w-full rounded-[24px]" /></div> : <div className="space-y-4">
            <div className="rounded-[24px] bg-ivory/55 p-6"><div className="font-display text-3xl font-bold text-ink">{student.name || 'Student'}</div><div className="mt-1 text-sm text-bark">{student.email || ''}</div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-parchment/50 bg-white p-4"><div className="text-xs uppercase tracking-wider text-bark/70">Student ID</div><div className="mt-2 text-sm font-semibold text-ink truncate">{student.id || '—'}</div></div><div className="rounded-2xl border border-parchment/50 bg-white p-4"><div className="text-xs uppercase tracking-wider text-bark/70">Age</div><div className="mt-2 text-sm font-semibold text-ink">{student.age || '—'}</div></div></div>
          </div>}
        </SectionCard>
        <SectionCard title="Learning snapshot">
          <GridList cols="sm:grid-cols-2">
            <StatCard icon={Calendar} label="Upcoming" value={upcoming.length} tone="emerald" />
            <StatCard icon={ShieldCheck} label="Completed" value={completed.length} tone="gold" />
            <StatCard icon={FileVideo} label="Recordings" value={recordings.filter(r => r.can_access).length} tone="teal" />
            <StatCard icon={BookOpen} label="Classes" value={allClasses.length} tone="ink" />
            <StatCard icon={CheckCircle2} label="Attendance" value={`${attendance.attendancePercentage || 0}%`} tone="emerald" />
            <StatCard icon={Star} label="Taken" value={attendance.attendedClasses || 0} tone="gold" />
          </GridList>
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── MESSAGES ───
  if (activeTab === 'messages') return (
    <PageHeader title="Messages" description="Chat with teachers.">
      <MessageCenter token={token} currentUserId={user?.id} />
    </PageHeader>
  )

  return null
}
