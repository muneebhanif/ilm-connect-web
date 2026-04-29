import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useOutletContext } from 'react-router-dom'
import {
  Users, Calendar, BookOpen, Search, Plus, Trash2, UserRound, GraduationCap, Clock3, Star, Sparkles,
  Settings, Bell, School, AlertCircle, Video, ShieldCheck, CheckCircle2, ChevronRight, Mail, Lock,
  User, Camera, TrendingUp, Award, MessageSquare, ArrowRight, XCircle, MapPin, Phone,
} from 'lucide-react'
import { useAuth } from '../../lib/auth.jsx'
import toast from 'react-hot-toast'
import { api, authFetch } from '../../lib/api.js'
import { fileToBase64, getFileExtension } from '../../lib/files.js'
import { StatCard, SectionCard, EmptyState, StatusPill, ActionButton, TextInput, GridList } from '../../components/dashboard-ui.jsx'
import MessageCenter from '../../components/MessageCenter.jsx'
import { SectionRowsSkeleton, SkeletonBlock } from '../../components/skeletons.jsx'

function PageHeader({ title, description, actions, children }) {
  return (
    <div className="px-5 py-6 lg:px-10 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bark">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

function formatDate(item) {
  const raw = item.scheduled_date || item.scheduled_at || item.date
  if (!raw) return 'Date unavailable'
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? 'Date unavailable' : d.toLocaleString()
}

export default function ParentDashboard() {
  const { user, token, signup } = useAuth()
  const qc = useQueryClient()
  const { activeTab, setActiveTab } = useOutletContext()
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [childForm, setChildForm] = useState({ name: '', age: '' })
  const [credentialForm, setCredentialForm] = useState({ email: '', password: '' })
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '' })
  const [reviewDrafts, setReviewDrafts] = useState({})

  const profileQ = useQuery({ queryKey: ['parentProfile', user?.id], queryFn: () => authFetch(api.parentProfile(user.id), token), enabled: !!user?.id && !!token })
  const childrenQ = useQuery({ queryKey: ['parentChildren', user?.id], queryFn: () => authFetch(api.parentChildren(user.id), token), enabled: !!user?.id && !!token })
  const classesQ = useQuery({ queryKey: ['parentClasses', user?.id], queryFn: () => authFetch(api.parentClasses(user.id), token), enabled: !!user?.id && !!token })
  const childDetailQ = useQuery({ queryKey: ['childDetail', selectedChildId], queryFn: () => authFetch(api.childProfile(selectedChildId), token), enabled: !!selectedChildId && !!token })

  const profile = profileQ.data?.profile || user || {}
  const stats = profileQ.data?.stats || {}
  const children = childrenQ.data?.children || []
  const classes = classesQ.data?.classes || []
  const selectedChild = childDetailQ.data?.child || null
  const childProgress = childDetailQ.data?.progress || null

  const upcoming = useMemo(() => classes.filter(c => { const r = c.scheduled_date || c.scheduled_at || c.date; return r && new Date(r) >= new Date() }), [classes])

  useEffect(() => {
    setProfileForm({ full_name: user?.full_name || '' })
  }, [user?.full_name])

  useEffect(() => {
    if (!children.length) {
      if (selectedChildId) setSelectedChildId(null)
      return
    }
    const hasSelectedChild = children.some((child) => child.id === selectedChildId)
    if (!hasSelectedChild) {
      setSelectedChildId(children[0].id)
    }
  }, [children, selectedChildId])

  useEffect(() => {
    setCredentialForm({ email: '', password: '' })
  }, [selectedChildId])

  const addChild = useMutation({ mutationFn: (p) => authFetch(api.addChild(user.id), token, { method: 'POST', body: JSON.stringify(p) }), onSuccess: () => { toast.success('Child added'); setChildForm({ name: '', age: '' }); qc.invalidateQueries({ queryKey: ['parentChildren', user.id] }); qc.invalidateQueries({ queryKey: ['parentProfile', user.id] }) }, onError: (err) => toast.error(err?.message || 'Failed to add child') })
  const deleteChild = useMutation({ mutationFn: (id) => authFetch(api.deleteChild(user.id, id), token, { method: 'DELETE' }), onSuccess: (_, deletedChildId) => { toast.success('Child removed'); if (selectedChildId === deletedChildId) setSelectedChildId(null); qc.invalidateQueries({ queryKey: ['parentChildren', user.id] }); qc.invalidateQueries({ queryKey: ['childDetail', deletedChildId] }) }, onError: (err) => toast.error(err?.message || 'Failed to remove child') })
  const updateProfile = useMutation({ mutationFn: (p) => authFetch(api.updateParentProfile(user.id), token, { method: 'PUT', body: JSON.stringify(p) }), onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries({ queryKey: ['parentProfile', user.id] }) }, onError: (err) => toast.error(err?.message || 'Failed to update profile') })
  const uploadAvatar = useMutation({ mutationFn: async (f) => { const img = await fileToBase64(f); return authFetch(api.uploadProfileImage(user.id), token, { method: 'POST', body: JSON.stringify({ image: img, fileExtension: getFileExtension(f.name) }) }) }, onSuccess: () => { toast.success('Avatar uploaded'); qc.invalidateQueries({ queryKey: ['parentProfile', user.id] }) }, onError: (err) => toast.error(err?.message || 'Upload failed') })
  const reviewMut = useMutation({ mutationFn: (p) => authFetch(api.createReview(), token, { method: 'POST', body: JSON.stringify(p) }), onSuccess: () => toast.success('Review submitted!'), onError: (err) => toast.error(err?.message || 'Failed to submit review') })
  const createChildCredentials = useMutation({
    mutationFn: async () => {
      if (!selectedChild?.id) throw new Error('Select a child first')
      return signup('student', {
        email: credentialForm.email.trim(),
        password: credentialForm.password,
        fullName: selectedChild.name || selectedChild.full_name || 'Student',
        studentId: selectedChild.id,
      })
    },
    onSuccess: () => {
      toast.success('Child credentials created successfully')
      setCredentialForm({ email: '', password: '' })
      qc.invalidateQueries({ queryKey: ['parentChildren', user.id] })
      qc.invalidateQueries({ queryKey: ['childDetail', selectedChild?.id] })
    },
    onError: (err) => toast.error(err?.message || 'Failed to create child credentials')
  })

  const fileInputClass = "block w-full rounded-2xl border border-parchment/60 bg-ivory px-4 py-3 text-sm text-bark file:mr-3 file:rounded-lg file:border-0 file:bg-emerald/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-emerald"

  // ─── OVERVIEW ───
  if (activeTab === 'overview') return (
    <PageHeader
      title={`Assalamu Alaikum, ${profile.full_name || user?.full_name || 'Parent'}`}
      description="Manage your family's learning journey from one place."
      actions={
        <>
          <Link
            to="/teachers"
            className="inline-flex items-center gap-2 rounded-2xl border border-parchment bg-white px-5 py-3 text-sm font-semibold text-ink-soft transition hover:border-emerald/30 hover:text-emerald hover:shadow-sm"
          >
            <Search size={16} />
            Find teachers
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald/20 transition hover:bg-emerald/90 hover:shadow-emerald/30"
          >
            <BookOpen size={16} />
            Browse courses
          </Link>
        </>
      }
    >
      <GridList cols="md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Children" value={stats.children || children.length} tone="emerald" />
        <StatCard icon={Calendar} label="Upcoming" value={upcoming.length} tone="gold" />
        <StatCard icon={BookOpen} label="Active classes" value={stats.activeClasses || classes.length} tone="teal" />
        <StatCard icon={School} label="Teachers" value={stats.teachers || 0} tone="ink" />
      </GridList>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Upcoming classes" subtitle="Your next scheduled sessions.">
          {classesQ.isLoading ? (
            <SectionRowsSkeleton rows={3} itemClassName="h-24" />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming classes"
              text="Browse teachers and book sessions for your children."
              action={<Link to="/teachers" className="text-sm font-semibold text-emerald hover:underline">Browse teachers →</Link>}
            />
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="group flex items-start justify-between rounded-2xl border border-parchment/60 bg-white p-4 transition hover:border-emerald/20 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink">{c.courses?.title || c.subject || 'Class'}</div>
                    <div className="mt-1 text-sm text-bark">
                      Teacher: {c.courses?.teachers?.profiles?.full_name || 'Teacher'}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-bark">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} className="shrink-0" />
                        {formatDate(c)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UserRound size={12} className="shrink-0" />
                        {c.students?.name || 'Student'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                    <StatusPill tone={c.status === 'completed' ? 'emerald' : 'gold'}>
                      {c.status || 'upcoming'}
                    </StatusPill>
                    {c.status !== 'completed' && c.status !== 'cancelled' && (
                      <Link
                        to={`/classroom/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald/90"
                      >
                        <Video size={12} />
                        Join
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Your children" subtitle="Quick access to child profiles.">
          {children.length === 0 ? (
            <EmptyState icon={Users} title="No children yet" text="Add a child to start booking classes." />
          ) : (
            <div className="space-y-3">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedChildId(c.id); setActiveTab('children') }}
                  className="group flex w-full items-center justify-between rounded-2xl border border-parchment/60 bg-white p-4 text-left transition hover:border-emerald/20 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-ink">{c.name || c.full_name}</div>
                      <div className="text-xs text-bark">Age {c.age || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone="emerald">View</StatusPill>
                    <ChevronRight size={16} className="text-bark/30 group-hover:text-emerald transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── CHILDREN ───
  if (activeTab === 'children') return (
    <PageHeader title="Children" description="Add or manage child profiles and track their progress.">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Manage children" subtitle="Add new children or remove existing profiles.">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              addChild.mutate({ name: childForm.name.trim(), age: Number(childForm.age) })
            }}
            className="grid gap-4 sm:grid-cols-[1fr_100px_auto]"
          >
            <TextInput
              label="Name"
              placeholder="Muhammad Ibrahim"
              value={childForm.name}
              onChange={(e) => setChildForm((p) => ({ ...p, name: e.target.value }))}
            />
            <TextInput
              label="Age"
              type="number"
              min="3"
              max="25"
              value={childForm.age}
              onChange={(e) => setChildForm((p) => ({ ...p, age: e.target.value }))}
            />
            <div className="self-end">
              <ActionButton type="submit" disabled={addChild.isPending || !childForm.name || !childForm.age} icon={Plus}>
                {addChild.isPending ? 'Adding...' : 'Add'}
              </ActionButton>
            </div>
          </form>

          {addChild.isError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose/10 border border-rose/20 px-3 py-2 text-sm text-rose">
              <AlertCircle size={14} />
              {addChild.error.message}
            </div>
          )}

          <div className="mt-6 space-y-2.5">
            {children.length === 0 ? (
              <EmptyState icon={Users} title="No children" text="Add the first child profile to get started." />
            ) : (
              children.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                    selectedChildId === c.id
                      ? 'border-emerald bg-emerald/5 shadow-sm'
                      : 'border-parchment/60 bg-white hover:border-emerald/20 hover:shadow-sm'
                  }`}
                >
                  <button className="flex flex-1 items-center gap-3.5 text-left" onClick={() => setSelectedChildId(c.id)}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-parchment/50 shadow-sm">
                      <UserRound size={18} className="text-emerald" />
                    </div>
                    <div>
                      <div className="font-semibold text-ink">{c.name || c.full_name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-bark">
                        <span>Age {c.age || '—'}</span>
                        <StatusPill tone={c.profile_id ? 'emerald' : 'gold'}>
                          {c.profile_id ? 'Login ready' : 'No login yet'}
                        </StatusPill>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteChild.mutate(c.id)}
                    disabled={deleteChild.isPending}
                    className="rounded-xl p-2.5 text-bark/60 transition hover:bg-rose/10 hover:text-rose"
                    title="Remove child"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Child profile" subtitle={selectedChild ? `Detailed view for ${selectedChild.name || selectedChild.full_name}` : 'Select a child to see details.'}>
          {!selectedChildId ? (
            <EmptyState icon={GraduationCap} title="Select a child" text="Choose a child from the list to see their progress and details." />
          ) : childDetailQ.isLoading ? (
            <div className="space-y-4">
              <SkeletonBlock className="h-28 w-full rounded-2xl" />
              <div className="grid grid-cols-2 gap-4">
                <SkeletonBlock className="h-28 rounded-2xl" />
                <SkeletonBlock className="h-28 rounded-2xl" />
              </div>
            </div>
          ) : !selectedChild ? (
            <EmptyState icon={AlertCircle} title="Unable to load" text="Please try again or select a different child." />
          ) : (
            <div className="space-y-6">
              {/* Profile header */}
              <div className="flex items-start gap-4 rounded-2xl bg-gradient-to-br from-ivory via-white to-emerald/5 border border-parchment/60 p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <div className="font-display text-xl font-bold text-ink">{selectedChild.name}</div>
                  <div className="mt-1 text-sm text-bark">Age {selectedChild.age || '—'}</div>
                </div>
              </div>

              {/* Stats grid */}
              <GridList cols="grid-cols-2 md:grid-cols-3">
                <StatCard icon={Star} label="Stars" value={childProgress?.stars || 0} tone="gold" />
                <StatCard icon={Sparkles} label="Streak" value={childProgress?.streak || 0} tone="emerald" />
                <StatCard icon={BookOpen} label="Completed" value={childProgress?.completedClasses || 0} tone="teal" />
                <StatCard icon={Calendar} label="Upcoming" value={childProgress?.upcomingSessions?.length || 0} tone="ink" />
                <StatCard icon={CheckCircle2} label="Attendance" value={`${childProgress?.attendanceSummary?.attendancePercentage || 0}%`} tone="emerald" />
                <StatCard icon={Users} label="Classes taken" value={childProgress?.attendanceSummary?.attendedClasses || 0} tone="gold" />
              </GridList>

              {/* Attendance summary */}
              <SectionCard title="Attendance summary" subtitle="Track how many completed classes this child attended.">
                <GridList cols="md:grid-cols-3">
                  <StatCard icon={TrendingUp} label="Attendance rate" value={`${childProgress?.attendanceSummary?.attendancePercentage || 0}%`} tone="emerald" />
                  <StatCard icon={BookOpen} label="Completed classes" value={childProgress?.attendanceSummary?.totalClasses || 0} tone="teal" />
                  <StatCard icon={XCircle} label="Missed classes" value={childProgress?.attendanceSummary?.missedClasses || 0} tone="rose" />
                </GridList>
              </SectionCard>

              {/* Credentials */}
              <SectionCard title="Student login credentials" subtitle="Create website and mobile login details for this child.">
                <div className="space-y-4">
                  <div className="rounded-xl border border-parchment/60 bg-ivory/50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-bark/60 mb-1">Student ID</div>
                    <div className="break-all text-sm font-mono text-ink">{selectedChild.id}</div>
                  </div>

                  {selectedChild.profile_id ? (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald/20 bg-emerald/5 p-4">
                      <CheckCircle2 size={18} className="text-emerald shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-emerald">Credentials already created</div>
                        <p className="mt-1 text-sm text-bark">This child is already linked to a student login and can sign in on web or mobile.</p>
                      </div>
                    </div>
                  ) : (
                    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); createChildCredentials.mutate() }}>
                      <TextInput
                        label="Student email"
                        type="email"
                        placeholder="student@example.com"
                        value={credentialForm.email}
                        onChange={(e) => setCredentialForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                      <TextInput
                        label="Password"
                        type="password"
                        placeholder="Create a secure password"
                        value={credentialForm.password}
                        onChange={(e) => setCredentialForm((prev) => ({ ...prev, password: e.target.value }))}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <ActionButton
                          type="submit"
                          disabled={createChildCredentials.isPending || !credentialForm.email.trim() || !credentialForm.password.trim()}
                          icon={Plus}
                        >
                          {createChildCredentials.isPending ? 'Creating...' : 'Create credentials'}
                        </ActionButton>
                        <StatusPill tone="gold">Linked to selected child automatically</StatusPill>
                      </div>
                    </form>
                  )}
                </div>
              </SectionCard>

              {/* Recent attendance */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-soft">
                  <CheckCircle2 size={15} />
                  Recent attendance
                </div>
                {(childProgress?.attendanceSummary?.recentAttendance || []).length === 0 ? (
                  <p className="text-sm text-bark">Attendance will appear after completed classes.</p>
                ) : (
                  <div className="space-y-2">
                    {childProgress.attendanceSummary.recentAttendance.slice(0, 5).map((item) => (
                      <div
                        key={item.session_id}
                        className="flex items-center justify-between rounded-xl border border-parchment/60 bg-white p-4 transition hover:border-emerald/20"
                      >
                        <div>
                          <div className="font-semibold text-ink">{item.course_title || 'Class'}</div>
                          <div className="mt-1 text-xs text-bark">{new Date(item.session_date).toLocaleDateString()}</div>
                        </div>
                        <StatusPill tone={item.attended ? 'emerald' : 'rose'}>
                          {item.attended ? 'Present' : 'Absent'}
                        </StatusPill>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enrolled courses */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-soft">
                  <BookOpen size={15} />
                  Enrolled courses
                </div>
                {(childProgress?.enrollments || []).length === 0 ? (
                  <p className="text-sm text-bark">No enrollments yet.</p>
                ) : (
                  childProgress.enrollments.map((e) => (
                    <div key={e.id} className="mb-2 rounded-xl border border-parchment/60 bg-white p-4 transition hover:border-emerald/20">
                      <div className="font-semibold text-ink">{e.courses?.title}</div>
                      <div className="mt-1 text-sm text-bark">
                        Teacher: {e.courses?.profiles?.full_name}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── CLASSES ───
  if (activeTab === 'classes') return (
    <PageHeader title="Classes" description="All booked classes for your family.">
      <SectionCard>
        {classesQ.isLoading ? (
          <SectionRowsSkeleton rows={4} itemClassName="h-24" />
        ) : classes.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No classes"
            text="Book a class to get started with your child's learning."
            action={<Link to="/teachers" className="text-sm font-semibold text-emerald hover:underline">Browse teachers →</Link>}
          />
        ) : (
          <div className="space-y-4">
            {classes.map((c) => (
              <div key={c.id} className="rounded-2xl border border-parchment/60 bg-white p-5 transition hover:border-emerald/20 hover:shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                      <Calendar size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">{c.courses?.title || c.subject || 'Class'}</div>
                      <div className="mt-1 text-sm text-bark">
                        Teacher: {c.courses?.teachers?.profiles?.full_name || 'Teacher'}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-bark">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} className="shrink-0" />
                          {formatDate(c)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} className="shrink-0" />
                          {c.students?.name || 'Student'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusPill tone={c.status === 'completed' ? 'emerald' : c.status === 'cancelled' ? 'rose' : 'gold'}>
                    {c.status || 'upcoming'}
                  </StatusPill>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {c.status !== 'completed' && c.status !== 'cancelled' && (
                    <Link
                      to={`/classroom/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald/90"
                    >
                      <Video size={14} />
                      Join class
                    </Link>
                  )}

                  {c.status === 'completed' && c.courses?.teacher_id && (() => {
                    const d = reviewDrafts[c.id] || { rating: 5, comment: '' }
                    return (
                      <div className="mt-2 w-full rounded-2xl border border-parchment/60 bg-ivory/50 p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-soft">
                          <ShieldCheck size={15} className="text-gold" />
                          Rate this teacher
                        </div>
                        <div className="grid gap-4 lg:grid-cols-[120px_1fr_auto]">
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Rating (1-5)</span>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={d.rating}
                              onChange={(e) => setReviewDrafts((p) => ({ ...p, [c.id]: { ...d, rating: e.target.value } }))}
                              className="w-full rounded-xl border-2 border-parchment bg-ivory px-3 py-2.5 text-sm text-ink focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/10 transition"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Comment</span>
                            <input
                              value={d.comment}
                              onChange={(e) => setReviewDrafts((p) => ({ ...p, [c.id]: { ...d, comment: e.target.value } }))}
                              placeholder="Share your experience..."
                              className="w-full rounded-xl border-2 border-parchment bg-ivory px-3 py-2.5 text-sm text-ink placeholder:text-bark/40 focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/10 transition"
                            />
                          </label>
                          <div className="flex items-end">
                            <button
                              onClick={() => reviewMut.mutate({ teacher_id: c.courses.teacher_id, session_id: c.id, rating: Number(d.rating || 5), comment: d.comment })}
                              disabled={reviewMut.isPending}
                              className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald/90 disabled:opacity-50"
                            >
                              {reviewMut.isPending ? 'Submitting...' : 'Submit'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageHeader>
  )

  // ─── BROWSE (TEACHERS) ───
  if (activeTab === 'browse') return (
    <PageHeader title="Find Teachers" description="Browse and book qualified teachers for your children.">
      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard>
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/10">
              <Search size={28} className="text-emerald" />
            </div>
            <h3 className="font-display text-2xl font-bold text-ink">Browse Teachers</h3>
            <p className="mt-2 text-sm text-bark max-w-xs">Find the perfect teacher for your child based on subject, availability, and reviews.</p>
            <Link
              to="/teachers"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald/20 transition hover:bg-emerald/90 hover:shadow-emerald/30"
            >
              View all teachers
              <ArrowRight size={16} />
            </Link>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
              <BookOpen size={28} className="text-gold" />
            </div>
            <h3 className="font-display text-2xl font-bold text-ink">Browse Courses</h3>
            <p className="mt-2 text-sm text-bark max-w-xs">Explore structured learning content designed for Islamic education.</p>
            <Link
              to="/courses"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gold/20 transition hover:bg-gold/90 hover:shadow-gold/30"
            >
              View all courses
              <ArrowRight size={16} />
            </Link>
          </div>
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── PROFILE ───
  if (activeTab === 'profile') return (
    <PageHeader title="Profile" description="Update your account details and manage your family settings.">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard title="Parent profile" subtitle="Your personal information and avatar.">
          <div className="mb-6 flex items-center gap-5 rounded-2xl bg-gradient-to-br from-ivory via-white to-emerald/5 border border-parchment/60 p-5">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-xl object-cover border border-parchment/50 shadow-sm" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald/10 text-xl font-bold text-emerald border border-emerald/20">
                {(profile.full_name || 'P')[0]}
              </div>
            )}
            <div>
              <div className="font-display text-xl font-bold text-ink">{profile.full_name || 'Parent'}</div>
              <div className="text-sm text-bark">{profile.email}</div>
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              updateProfile.mutate({ full_name: profileForm.full_name })
            }}
          >
            <TextInput
              label="Full name"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ full_name: e.target.value })}
            />
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-soft">
                <Camera size={14} />
                Profile image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])}
                className={fileInputClass}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ActionButton type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save changes'}
              </ActionButton>
              {uploadAvatar.isPending && <StatusPill tone="gold">Uploading...</StatusPill>}
              {updateProfile.isSuccess && <StatusPill tone="emerald">Saved!</StatusPill>}
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Quick summary" subtitle="At-a-glance overview of your account.">
          <div className="space-y-3">
            <div className="rounded-xl border border-parchment/60 bg-ivory/50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink">Role</div>
                <div className="mt-1 text-sm text-bark capitalize">{profile.role || 'parent'}</div>
              </div>
              <ShieldCheck size={18} className="text-emerald/40" />
            </div>
            <div className="rounded-xl border border-parchment/60 bg-ivory/50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink">Children</div>
                <div className="mt-1 text-sm text-bark">{children.length} profile{children.length === 1 ? '' : 's'}</div>
              </div>
              <Users size={18} className="text-emerald/40" />
            </div>
            <div className="rounded-xl border border-parchment/60 bg-ivory/50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink">Classes</div>
                <div className="mt-1 text-sm text-bark">{classes.length} total</div>
              </div>
              <BookOpen size={18} className="text-emerald/40" />
            </div>
          </div>

          {selectedChild ? (
            <div className="mt-6 space-y-4 rounded-2xl border border-parchment/60 bg-ivory/50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-ink">Selected child attendance</div>
                  <div className="mt-1 text-sm text-bark">{selectedChild.name || selectedChild.full_name}</div>
                </div>
                <ActionButton type="button" tone="light" onClick={() => setActiveTab('children')}>
                  Open details
                </ActionButton>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-parchment/60 bg-white p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-bark/60">Attendance</div>
                  <div className="mt-2 text-2xl font-bold text-ink">{childProgress?.attendanceSummary?.attendancePercentage || 0}%</div>
                </div>
                <div className="rounded-xl border border-parchment/60 bg-white p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-bark/60">Taken</div>
                  <div className="mt-2 text-2xl font-bold text-ink">{childProgress?.attendanceSummary?.attendedClasses || 0}</div>
                </div>
                <div className="rounded-xl border border-parchment/60 bg-white p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-bark/60">Missed</div>
                  <div className="mt-2 text-2xl font-bold text-ink">{childProgress?.attendanceSummary?.missedClasses || 0}</div>
                </div>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── MESSAGES ───
  if (activeTab === 'messages') return (
    <PageHeader title="Messages" description="Chat directly with your children's teachers.">
      <div className="rounded-2xl border border-parchment/60 bg-white overflow-hidden">
        <MessageCenter token={token} currentUserId={user?.id} />
      </div>
    </PageHeader>
  )

  return null
}