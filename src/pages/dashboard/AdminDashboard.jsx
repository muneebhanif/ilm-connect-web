import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import {
  Users, GraduationCap, BookOpen, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Star, Search, BarChart3, Settings, Trash2, Eye, ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../lib/auth.jsx'
import { authFetch } from '../../lib/api.js'
import { StatCard, SectionCard, EmptyState, StatusPill, ActionButton, TextInput, GridList } from '../../components/dashboard-ui.jsx'
import { SectionRowsSkeleton, SkeletonBlock } from '../../components/skeletons.jsx'

const API = import.meta.env.VITE_API_URL || 'https://backend-ilm.vercel.app'
const adminApi = {
  stats: () => `${API}/api/admin/stats`,
  users: (q = '') => `${API}/api/admin/users${q ? `?search=${q}` : ''}`,
  teachers: (status) => `${API}/api/admin/teachers${status ? `?status=${status}` : ''}`,
  verifyTeacher: (id) => `${API}/api/admin/teachers/${id}/verify`,
  courses: () => `${API}/api/admin/courses`,
  reviews: () => `${API}/api/admin/reviews`,
  deleteReview: (id) => `${API}/api/admin/reviews/${id}`,
}

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

export default function AdminDashboard() {
  const { token } = useAuth()
  const { activeTab } = useOutletContext()
  const qc = useQueryClient()

  const [userSearch, setUserSearch] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')

  const statsQ = useQuery({ queryKey: ['adminStats'], queryFn: () => authFetch(adminApi.stats(), token), enabled: !!token })
  const usersQ = useQuery({ queryKey: ['adminUsers', userSearch], queryFn: () => authFetch(adminApi.users(userSearch), token), enabled: !!token && activeTab === 'users' })
  const teachersQ = useQuery({ queryKey: ['adminTeachers', teacherFilter], queryFn: () => authFetch(adminApi.teachers(teacherFilter), token), enabled: !!token && (activeTab === 'teachers' || activeTab === 'overview') })
  const coursesQ = useQuery({ queryKey: ['adminCourses'], queryFn: () => authFetch(adminApi.courses(), token), enabled: !!token && activeTab === 'courses' })
  const reviewsQ = useQuery({ queryKey: ['adminReviews'], queryFn: () => authFetch(adminApi.reviews(), token), enabled: !!token && activeTab === 'reviews' })

  const verifyMut = useMutation({
    mutationFn: ({ id, status }) => authFetch(adminApi.verifyTeacher(id), token, { method: 'PUT', body: JSON.stringify({ verification_status: status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminTeachers'] }); qc.invalidateQueries({ queryKey: ['adminStats'] }) },
  })
  const deleteReviewMut = useMutation({
    mutationFn: (id) => authFetch(adminApi.deleteReview(id), token, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminReviews'] }),
  })

  const stats = statsQ.data || {}

  // ─── OVERVIEW ───
  if (activeTab === 'overview') return (
    <PageHeader title="Admin Console" description="Platform overview and quick actions.">
      <GridList cols="md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats.total_users ?? '—'} tone="emerald" />
        <StatCard icon={GraduationCap} label="Teachers" value={stats.total_teachers ?? '—'} tone="gold" />
        <StatCard icon={BookOpen} label="Courses" value={stats.total_courses ?? '—'} tone="teal" />
        <StatCard icon={AlertTriangle} label="Pending verification" value={stats.pending_teachers ?? '—'} tone="rose" />
      </GridList>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Pending teacher verification">
          {teachersQ.isLoading ? <SectionRowsSkeleton rows={3} itemClassName="h-20" /> : (() => { const pending = (teachersQ.data?.teachers || []).filter(t => t.verification_status === 'pending'); return pending.length === 0 ? <EmptyState icon={ShieldCheck} title="All clear" text="No pending verifications." /> : <div className="space-y-3">{pending.slice(0, 5).map(t => <div key={t.id} className="flex items-center justify-between rounded-[24px] border border-parchment/50 bg-white p-4"><div><div className="font-semibold text-ink">{t.profiles?.full_name || 'Teacher'}</div><div className="text-sm text-bark">{t.subject || '—'} • {t.qualification || '—'}</div></div><div className="flex gap-2"><button onClick={() => verifyMut.mutate({ id: t.id, status: 'approved' })} className="rounded-xl bg-emerald/10 p-2 text-emerald hover:bg-emerald/20" title="Approve"><CheckCircle2 size={18} /></button><button onClick={() => verifyMut.mutate({ id: t.id, status: 'rejected' })} className="rounded-xl bg-rose/10 p-2 text-rose hover:bg-rose/20" title="Reject"><XCircle size={18} /></button></div></div>)}</div> })()}
        </SectionCard>
        <SectionCard title="Quick stats">
          <div className="space-y-3">
            <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4 flex items-center justify-between"><span className="text-sm text-bark">Students</span><span className="font-semibold text-ink">{stats.total_students ?? '—'}</span></div>
            <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4 flex items-center justify-between"><span className="text-sm text-bark">Parents</span><span className="font-semibold text-ink">{stats.total_parents ?? '—'}</span></div>
            <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4 flex items-center justify-between"><span className="text-sm text-bark">Total bookings</span><span className="font-semibold text-ink">{stats.total_bookings ?? '—'}</span></div>
            <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4 flex items-center justify-between"><span className="text-sm text-bark">Reviews</span><span className="font-semibold text-ink">{stats.total_reviews ?? '—'}</span></div>
          </div>
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── USERS ───
  if (activeTab === 'users') return (
    <PageHeader title="Users" description="Search and manage platform users.">
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-bark/40" size={16} />
          <input placeholder="Search by name or email…" value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full rounded-2xl border border-parchment/50 bg-white py-3 pl-10 pr-4 text-sm text-ink outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20" />
        </div>
      </div>
      <SectionCard>
        {usersQ.isLoading ? <SectionRowsSkeleton rows={6} itemClassName="h-16" /> : (usersQ.data?.users || []).length === 0 ? <EmptyState icon={Users} title="No users found" text="Try a different search." /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-bark/60"><th className="pb-3 pl-3">Name</th><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3">Joined</th></tr></thead><tbody className="divide-y divide-parchment/30">{(usersQ.data.users).map(u => <tr key={u.id} className="hover:bg-ivory/50"><td className="py-3 pl-3 font-medium text-ink">{u.full_name || '—'}</td><td className="py-3 text-bark">{u.email || '—'}</td><td className="py-3"><StatusPill tone={u.role === 'teacher' ? 'gold' : u.role === 'parent' ? 'teal' : u.role === 'admin' ? 'rose' : 'emerald'}>{u.role}</StatusPill></td><td className="py-3 text-bark">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td></tr>)}</tbody></table></div>}
      </SectionCard>
    </PageHeader>
  )

  // ─── TEACHERS ───
  if (activeTab === 'teachers') return (
    <PageHeader title="Teacher Management" description="View, verify, and manage teachers.">
      <div className="mb-6 flex flex-wrap gap-3">
        {['', 'pending', 'approved', 'rejected'].map(s => <button key={s} onClick={() => setTeacherFilter(s)} className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${teacherFilter === s ? 'bg-emerald text-white shadow-lg shadow-emerald/20' : 'bg-white text-bark border border-parchment/50 hover:bg-ivory/50'}`}>{s || 'All'}</button>)}
      </div>
      <SectionCard>
        {teachersQ.isLoading ? <SectionRowsSkeleton rows={5} itemClassName="h-24" /> : (teachersQ.data?.teachers || []).length === 0 ? <EmptyState icon={GraduationCap} title="No teachers found" /> : <div className="space-y-4">{(teachersQ.data.teachers).map(t => <div key={t.id} className="rounded-[24px] border border-parchment/50 bg-white p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="font-semibold text-ink">{t.profiles?.full_name || 'Teacher'}</div><div className="mt-1 text-sm text-bark">{t.subject || '—'} • {t.qualification || '—'} • {t.experience_years || '—'} yrs</div><div className="mt-1 text-xs text-bark">{t.profiles?.email || ''}</div></div><div className="flex items-center gap-3"><StatusPill tone={t.verification_status === 'approved' ? 'emerald' : t.verification_status === 'rejected' ? 'rose' : 'gold'}>{t.verification_status}</StatusPill>{t.verification_status === 'pending' && <><button onClick={() => verifyMut.mutate({ id: t.id, status: 'approved' })} className="rounded-xl bg-emerald/10 p-2 text-emerald hover:bg-emerald/20" title="Approve"><CheckCircle2 size={18} /></button><button onClick={() => verifyMut.mutate({ id: t.id, status: 'rejected' })} className="rounded-xl bg-rose/10 p-2 text-rose hover:bg-rose/20" title="Reject"><XCircle size={18} /></button></>}</div></div></div>)}</div>}
      </SectionCard>
    </PageHeader>
  )

  // ─── COURSES ───
  if (activeTab === 'courses') return (
    <PageHeader title="Courses" description="All courses on the platform.">
      <SectionCard>
        {coursesQ.isLoading ? <SectionRowsSkeleton rows={5} itemClassName="h-20" /> : (coursesQ.data?.courses || []).length === 0 ? <EmptyState icon={BookOpen} title="No courses" /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-bark/60"><th className="pb-3 pl-3">Title</th><th className="pb-3">Teacher</th><th className="pb-3">Subject</th><th className="pb-3">Price</th><th className="pb-3">Status</th></tr></thead><tbody className="divide-y divide-parchment/30">{(coursesQ.data.courses).map(c => <tr key={c.id} className="hover:bg-ivory/50"><td className="py-3 pl-3 font-medium text-ink">{c.title}</td><td className="py-3 text-bark">{c.teachers?.profiles?.full_name || '—'}</td><td className="py-3 text-bark">{c.subject || '—'}</td><td className="py-3 text-bark">${c.price || 0}</td><td className="py-3"><StatusPill tone={c.is_published ? 'emerald' : 'gold'}>{c.is_published ? 'Published' : 'Draft'}</StatusPill></td></tr>)}</tbody></table></div>}
      </SectionCard>
    </PageHeader>
  )

  // ─── REVIEWS ───
  if (activeTab === 'reviews') return (
    <PageHeader title="Reviews" description="Moderate platform reviews.">
      <SectionCard>
        {reviewsQ.isLoading ? <SectionRowsSkeleton rows={5} itemClassName="h-24" /> : (reviewsQ.data?.reviews || []).length === 0 ? <EmptyState icon={Star} title="No reviews" /> : <div className="space-y-4">{(reviewsQ.data.reviews).map(r => <div key={r.id} className="rounded-[24px] border border-parchment/50 bg-white p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-2"><span className="font-semibold text-ink">{r.reviewer_name || 'User'}</span><span className="text-bark">→</span><span className="font-semibold text-ink">{r.teacher_name || 'Teacher'}</span></div><div className="mt-1 flex items-center gap-2">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} className={i < r.rating ? 'fill-gold text-gold' : 'text-parchment'} />)}</div>{r.comment && <div className="mt-2 text-sm text-bark">{r.comment}</div>}<div className="mt-1 text-xs text-bark/60">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</div></div><button onClick={() => { if (confirm('Delete this review?')) deleteReviewMut.mutate(r.id) }} className="rounded-xl bg-rose/10 p-2 text-rose hover:bg-rose/20" title="Delete"><Trash2 size={16} /></button></div></div>)}</div>}
      </SectionCard>
    </PageHeader>
  )

  // ─── SETTINGS ───
  if (activeTab === 'settings') return (
    <PageHeader title="Settings" description="Platform configuration.">
      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="Platform info">
          <div className="space-y-3 text-sm text-bark">
            <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4 flex items-center justify-between"><span>API URL</span><code className="text-xs text-ink">{API}</code></div>
            <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4 flex items-center justify-between"><span>Environment</span><code className="text-xs text-ink">{import.meta.env.MODE}</code></div>
          </div>
        </SectionCard>
        <SectionCard title="Quick links">
          <div className="space-y-3">
            <a href={`${API}/api/health`} target="_blank" rel="noreferrer" className="block rounded-2xl border border-parchment/50 bg-white p-4 text-sm text-emerald hover:bg-ivory/50">Health check endpoint →</a>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="block rounded-2xl border border-parchment/50 bg-white p-4 text-sm text-emerald hover:bg-ivory/50">Supabase dashboard →</a>
          </div>
        </SectionCard>
      </div>
    </PageHeader>
  )

  return null
}
