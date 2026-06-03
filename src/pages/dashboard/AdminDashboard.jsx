import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import {
  Users, GraduationCap, BookOpen, ShieldCheck, AlertTriangle,
  CheckCircle2, XCircle, Star, Search, Settings, Trash2, Eye,
  FileText, DollarSign, Video, Calendar, TrendingUp, TrendingDown,
  Clock, ExternalLink, RefreshCw, Database, Activity, X, Check,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../lib/auth.jsx'
import { authFetch } from '../../lib/api.js'

const API = import.meta.env.VITE_API_URL || 'https://backend-ilm.vercel.app'
const adminApi = {
  stats:         ()       => `${API}/api/admin/stats`,
  revenue:       ()       => `${API}/api/admin/revenue`,
  users:         (q = '') => `${API}/api/admin/users${q ? `?search=${encodeURIComponent(q)}` : ''}`,
  deleteUser:    (id)     => `${API}/api/admin/users/${id}`,
  teachers:      (s)      => `${API}/api/admin/teachers${s ? `?status=${s}` : ''}`,
  reviewTeacher: (id)     => `${API}/api/admin/teachers/${id}/review`,
  verifyTeacher: (id)     => `${API}/api/admin/teachers/${id}/verify`,
  courses:       ()       => `${API}/api/admin/courses`,
  updateCourseStatus:(id) => `${API}/api/admin/courses/${id}/status`,
  reviews:       ()       => `${API}/api/admin/reviews`,
  deleteReview:  (id)     => `${API}/api/admin/reviews/${id}`,
  bookings:      (s)      => `${API}/api/admin/bookings${s ? `?status=${s}` : ''}`,
  payments:      ()       => `${API}/api/admin/payments`,
  recordings:    ()       => `${API}/api/admin/recordings`,
}

/* ─── helpers ─── */
const fmt      = n  => Number(n || 0).toLocaleString()
const fmtMoney = n  => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate  = d  => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'
const fmtDT    = d  => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'
const fmtDur   = s  => { if (!s) return '—'; const m = Math.floor(s/60); return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m` }

/* ─── pill ─── */
const PILL = {
  approved:'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  verified:'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  published:'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  successful:'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  completed:'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  ready:'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  pending:'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  pending_review:'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  processing:'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  upcoming:'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  rejected:'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  failed:'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  cancelled:'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  draft:'bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30',
  free:'bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/30',
  paid:'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  teacher:'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  parent:'bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/30',
  student:'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  admin:'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
}
function Pill({ children }) {
  const label = String(children || '')
  const k = label.toLowerCase().replace(/\s+/g, '_')
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest font-mono ${PILL[k]||'bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30'}`}>{label.replace(/_/g, ' ')}</span>
}

/* ─── KPI card ─── */
function KPI({ icon: Icon, label, value, sub, color='emerald' }) {
  const C = { emerald:'text-emerald-400 bg-emerald-500/10', amber:'text-amber-400 bg-amber-500/10', rose:'text-red-400 bg-red-500/10', blue:'text-blue-400 bg-blue-500/10', teal:'text-teal-400 bg-teal-500/10' }
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#161b27] p-5 transition-all hover:border-white/10 hover:bg-[#1a2030]">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background:'radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.04) 0%, transparent 60%)' }} />
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${C[color]}`}><Icon size={18} /></div>
      <div className="mt-4">
        <div className="font-mono text-2xl font-bold tabular-nums text-white">{value ?? <span className="text-zinc-600">—</span>}</div>
        <div className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</div>
        {sub && <div className="mt-1 text-xs text-zinc-600 font-mono">{sub}</div>}
      </div>
    </div>
  )
}

/* ─── Card ─── */
function Card({ title, children, actions, className='' }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-[#161b27] ${className}`}>
      {title && <div className="flex items-center justify-between border-b border-white/5 px-5 py-4"><h3 className="text-sm font-bold uppercase tracking-[0.12em] text-zinc-400">{title}</h3>{actions && <div className="flex items-center gap-2">{actions}</div>}</div>}
      <div className="p-5">{children}</div>
    </div>
  )
}

/* ─── Table ─── */
function Table({ cols, rows, loading, empty }) {
  if (loading) return <div className="space-y-2 py-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-12 rounded-xl bg-white/3 animate-pulse" style={{animationDelay:`${i*80}ms`}}/>)}</div>
  if (!rows?.length) return <div className="flex flex-col items-center justify-center py-16 text-zinc-600"><Database size={32} className="mb-3 opacity-40"/><div className="text-sm font-medium">{empty||'No records found'}</div></div>
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead><tr>{cols.map(c=><th key={c.key} className="pb-3 pt-1 px-5 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 whitespace-nowrap">{c.label}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/4">{rows.map((row,i)=><tr key={i} className="group transition-colors hover:bg-white/2">{cols.map(c=><td key={c.key} className="py-3 px-5 align-middle whitespace-nowrap">{c.render?c.render(row):<span className="text-zinc-300 font-mono text-xs">{row[c.key]??'—'}</span>}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

/* ─── SearchBar ─── */
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14}/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||'Search…'} className="h-10 w-full rounded-xl border border-white/6 bg-[#0d1117] pl-10 pr-4 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition"/>
    </div>
  )
}

/* ─── FilterTabs ─── */
function FilterTabs({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o=><button key={o.value} onClick={()=>onChange(o.value)} className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${value===o.value?'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30':'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>{o.label}</button>)}
    </div>
  )
}

/* ─── Modal ─── */
function Modal({ open, onClose, title, children }) {
  useEffect(()=>{ if(open) document.body.style.overflow='hidden'; else document.body.style.overflow=''; return ()=>{document.body.style.overflow=''} },[open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#161b27] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition"><X size={16}/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════ */
export default function AdminDashboard() {
  const { token } = useAuth()
  const { activeTab } = useOutletContext()
  const qc = useQueryClient()

  const [userSearch,    setUserSearch]    = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [bookingFilter, setBookingFilter] = useState('')
  const [rejectModal,   setRejectModal]   = useState(null)
  const [rejectReason,  setRejectReason]  = useState('')
  const [docModal,      setDocModal]      = useState(null)
  const [deleteUserModal, setDeleteUserModal] = useState(null)

  /* queries */
  const statsQ     = useQuery({ queryKey:['adminStats'],    queryFn:()=>authFetch(adminApi.stats(),token),  enabled:!!token })
  const revenueQ   = useQuery({ queryKey:['adminRevenue'],  queryFn:()=>authFetch(adminApi.revenue(),token),enabled:!!token&&(activeTab==='overview'||activeTab==='payments') })
  const usersQ     = useQuery({ queryKey:['adminUsers',userSearch],  queryFn:()=>authFetch(adminApi.users(userSearch),token),  enabled:!!token&&activeTab==='users' })
  const teachersQ  = useQuery({ queryKey:['adminTeachers',teacherFilter], queryFn:()=>authFetch(adminApi.teachers(teacherFilter),token), enabled:!!token&&(activeTab==='teachers'||activeTab==='overview') })
  const coursesQ   = useQuery({ queryKey:['adminCourses'],  queryFn:()=>authFetch(adminApi.courses(),token),  enabled:!!token&&activeTab==='courses' })
  const reviewsQ   = useQuery({ queryKey:['adminReviews'],  queryFn:()=>authFetch(adminApi.reviews(),token),  enabled:!!token&&activeTab==='reviews' })
  const bookingsQ  = useQuery({ queryKey:['adminBookings',bookingFilter], queryFn:()=>authFetch(adminApi.bookings(bookingFilter),token), enabled:!!token&&activeTab==='bookings' })
  const paymentsQ  = useQuery({ queryKey:['adminPayments'], queryFn:()=>authFetch(adminApi.payments(),token), enabled:!!token&&activeTab==='payments' })
  const recordingsQ= useQuery({ queryKey:['adminRecordings'],queryFn:()=>authFetch(adminApi.recordings(),token),enabled:!!token&&activeTab==='recordings' })

  /* mutations */
  const verifyMut = useMutation({
    mutationFn: ({id,status}) => authFetch(adminApi.verifyTeacher(id),token,{method:'PUT',body:JSON.stringify({verification_status:status})}),
    onSuccess: () => { qc.invalidateQueries({queryKey:['adminTeachers']}); qc.invalidateQueries({queryKey:['adminStats']}) },
  })
  const rejectReasonMut = useMutation({
    mutationFn: ({id,reason}) => authFetch(adminApi.reviewTeacher(id),token,{method:'PUT',body:JSON.stringify({verification_status:'rejected',rejection_reason:reason})}),
    onSuccess: () => { qc.invalidateQueries({queryKey:['adminTeachers']}); qc.invalidateQueries({queryKey:['adminStats']}); setRejectModal(null); setRejectReason('') },
  })
  const deleteReviewMut = useMutation({
    mutationFn: (id) => authFetch(adminApi.deleteReview(id),token,{method:'DELETE'}),
    onSuccess: () => qc.invalidateQueries({queryKey:['adminReviews']}),
  })
  const deleteUserMut = useMutation({
    mutationFn: (id) => authFetch(adminApi.deleteUser(id),token,{method:'DELETE'}),
    onSuccess: () => { qc.invalidateQueries({queryKey:['adminUsers']}); qc.invalidateQueries({queryKey:['adminStats']}); setDeleteUserModal(null) },
  })
  const courseStatusMut = useMutation({
    mutationFn: ({ id, status }) => authFetch(adminApi.updateCourseStatus(id), token, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: (_, v) => {
      toast.success(v.status === 'published' ? 'Course approved' : 'Course sent back to draft')
      qc.invalidateQueries({ queryKey: ['adminCourses'] })
      qc.invalidateQueries({ queryKey: ['adminStats'] })
    },
    onError: (err) => toast.error(err?.message || 'Failed to update course'),
  })

  const stats   = statsQ.data   || {}
  const revenue = revenueQ.data || {}

  /* shared modals */
  const Modals = (
    <>
      {/* Reject with reason */}
      <Modal open={!!rejectModal} onClose={()=>setRejectModal(null)} title="Reject Teacher">
        {rejectModal && <div className="space-y-4">
          <div className="rounded-xl bg-[#0d1117] px-4 py-3">
            <div className="font-semibold text-zinc-200">{rejectModal.teacher.profiles?.full_name}</div>
            <div className="text-xs text-zinc-600 font-mono">{rejectModal.teacher.profiles?.email}</div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Rejection Reason</label>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} placeholder="Explain why this teacher is being rejected…" className="w-full rounded-xl border border-white/6 bg-[#0d1117] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition resize-none"/>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>rejectReasonMut.mutate({id:rejectModal.teacher.id,reason:rejectReason})} disabled={rejectReasonMut.isPending} className="flex-1 rounded-xl bg-red-500/15 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/25 transition disabled:opacity-50">{rejectReasonMut.isPending?'Rejecting…':'Confirm Reject'}</button>
            <button onClick={()=>setRejectModal(null)} className="rounded-xl border border-white/6 px-5 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-white/4 transition">Cancel</button>
          </div>
        </div>}
      </Modal>

      {/* Documents */}
      <Modal open={!!docModal} onClose={()=>setDocModal(null)} title="Verification Documents">
        {docModal && <div className="space-y-3">
          <div className="text-xs text-zinc-600 mb-4">{docModal.teacher.profiles?.full_name} — {docModal.teacher.documents?.length} document(s)</div>
          {(docModal.teacher.documents||[]).map((doc,i)=>(
            <div key={i} className="flex items-center justify-between rounded-xl bg-[#0d1117] px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-zinc-300">{doc.fileName||doc.type||`Document ${i+1}`}</div>
                <div className="font-mono text-xs text-zinc-600">{doc.type} · {fmtDate(doc.uploadedAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Pill>{doc.status||'pending'}</Pill>
                {doc.url&&<a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-400 hover:bg-blue-500/20 transition"><Eye size={11}/> View</a>}
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={()=>{verifyMut.mutate({id:docModal.teacher.id,status:'approved'});setDocModal(null)}} className="flex-1 rounded-xl bg-emerald-500/15 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/25 transition">Approve Teacher</button>
            <button onClick={()=>{setDocModal(null);setRejectModal({teacher:docModal.teacher});setRejectReason('')}} className="flex-1 rounded-xl bg-red-500/15 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/25 transition">Reject</button>
          </div>
        </div>}
      </Modal>

      {/* Delete user */}
      <Modal open={!!deleteUserModal} onClose={()=>setDeleteUserModal(null)} title="Delete User">
        {deleteUserModal && <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-red-500/8 px-4 py-3">
            <AlertCircle size={18} className="text-red-400 shrink-0"/>
            <div><div className="text-sm font-semibold text-red-300">This action is irreversible</div><div className="text-xs text-red-500/70">All account data will be deleted</div></div>
          </div>
          <div className="rounded-xl bg-[#0d1117] px-4 py-3">
            <div className="font-semibold text-zinc-200">{deleteUserModal.user.full_name||'Unnamed User'}</div>
            <div className="font-mono text-xs text-zinc-600">{deleteUserModal.user.email}</div>
            <div className="mt-1"><Pill>{deleteUserModal.user.role}</Pill></div>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>deleteUserMut.mutate(deleteUserModal.user.id)} disabled={deleteUserMut.isPending} className="flex-1 rounded-xl bg-red-500/15 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/25 transition disabled:opacity-50">{deleteUserMut.isPending?'Deleting…':'Delete Permanently'}</button>
            <button onClick={()=>setDeleteUserModal(null)} className="rounded-xl border border-white/6 px-5 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-white/4 transition">Cancel</button>
          </div>
        </div>}
      </Modal>
    </>
  )

  /* ── OVERVIEW ── */
  if (activeTab === 'overview') return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-500 mb-2">● Live</div>
          <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">Command Center</h1>
        </div>
        <button onClick={()=>{qc.invalidateQueries({queryKey:['adminStats']});qc.invalidateQueries({queryKey:['adminRevenue']})}} className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/3 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/6 hover:text-white transition">
          <RefreshCw size={13}/> Refresh
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI icon={Users}         label="Total users"    value={fmt(stats.total_users)}       color="emerald"/>
        <KPI icon={GraduationCap} label="Teachers"       value={fmt(stats.total_teachers)}    color="amber"/>
        <KPI icon={BookOpen}      label="Courses"        value={fmt(stats.total_courses)}     color="teal"/>
        <KPI icon={AlertTriangle} label="Pending review" value={fmt(stats.pending_teachers)}  color="rose"/>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI icon={Users}      label="Students"       value={fmt(stats.total_students)}  color="blue"/>
        <KPI icon={Users}      label="Parents"        value={fmt(stats.total_parents)}   color="teal"/>
        <KPI icon={Calendar}   label="Total bookings" value={fmt(stats.total_bookings)}  color="emerald"/>
        <KPI icon={DollarSign} label="Total revenue"  value={fmtMoney(revenue.total_revenue)} color="amber"/>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Pending Teacher Verification" actions={<span className="font-mono text-xs text-zinc-600">{(teachersQ.data?.teachers||[]).filter(t=>t.verification_status==='pending').length} queued</span>}>
          {teachersQ.isLoading ? <div className="space-y-2">{Array.from({length:3}).map((_,i)=><div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse"/>)}</div> : (() => {
            const pending=(teachersQ.data?.teachers||[]).filter(t=>t.verification_status==='pending')
            if(!pending.length) return <div className="flex flex-col items-center py-10 text-zinc-600"><CheckCircle2 size={28} className="mb-2 text-emerald-500/40"/><div className="text-sm font-medium">All caught up</div></div>
            return <div className="space-y-2">{pending.slice(0,6).map(t=>(
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-[#0d1117] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-200">{t.profiles?.full_name||'Teacher'}</div>
                  <div className="text-xs text-zinc-600 font-mono">{t.subject||'—'} · {t.qualification||'—'}</div>
                </div>
                <div className="ml-3 flex items-center gap-1.5">
                  {t.documents?.length>0&&<button onClick={()=>setDocModal({teacher:t})} className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:bg-blue-500/20 transition"><FileText size={11}/> {t.documents.length} docs</button>}
                  <button onClick={()=>verifyMut.mutate({id:t.id,status:'approved'})} className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400 hover:bg-emerald-500/20 transition" title="Approve"><Check size={14}/></button>
                  <button onClick={()=>{setRejectModal({teacher:t});setRejectReason('')}} className="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition" title="Reject"><X size={14}/></button>
                </div>
              </div>
            ))}</div>
          })()}
        </Card>
        <Card title="Revenue Snapshot">
          <div className="space-y-3">
            {[
              {label:'Lifetime Revenue',val:fmtMoney(revenue.total_revenue),icon:DollarSign,color:'text-emerald-400'},
              {label:'This Month',val:fmtMoney(revenue.this_month),icon:TrendingUp,color:'text-amber-400'},
              {label:'Last Month',val:fmtMoney(revenue.last_month),icon:Activity,color:'text-blue-400'},
              {label:'Total Bookings',val:fmt(stats.total_bookings),icon:Calendar,color:'text-teal-400'},
              {label:'Total Reviews',val:fmt(stats.total_reviews),icon:Star,color:'text-amber-400'},
            ].map(({label,val,icon:Icon,color})=>(
              <div key={label} className="flex items-center gap-3 rounded-xl bg-[#0d1117] px-4 py-3">
                <Icon size={16} className={color}/>
                <div className="flex-1 text-xs font-medium text-zinc-500">{label}</div>
                <div className="font-mono text-sm font-bold tabular-nums text-zinc-200">{val??'—'}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {Modals}
    </div>
  )

  /* ── USERS ── */
  if (activeTab === 'users') return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-white">Users</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage all registered accounts</p>
        </div>
        <div className="w-full sm:w-72"><SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search by name or email…"/></div>
      </div>
      <Card>
        <Table loading={usersQ.isLoading} empty="No users found" rows={usersQ.data?.users||[]} cols={[
          {key:'full_name', label:'Name',   render:u=><span className="font-semibold text-zinc-200">{u.full_name||'—'}</span>},
          {key:'email',     label:'Email',  render:u=><span className="text-zinc-500 font-mono text-xs">{u.email||'—'}</span>},
          {key:'role',      label:'Role',   render:u=><Pill>{u.role}</Pill>},
          {key:'created_at',label:'Joined', render:u=><span className="font-mono text-xs text-zinc-600">{fmtDate(u.created_at)}</span>},
          {key:'_del',      label:'',       render:u=>u.role!=='admin'?<button onClick={()=>setDeleteUserModal({user:u})} className="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100" title="Delete user"><Trash2 size={13}/></button>:null},
        ]}/>
      </Card>
      {Modals}
    </div>
  )

  /* ── TEACHERS ── */
  if (activeTab === 'teachers') return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-white">Teachers</h1>
          <p className="mt-1 text-sm text-zinc-600">Review, verify, and manage teacher accounts</p>
        </div>
        <FilterTabs value={teacherFilter} onChange={setTeacherFilter} options={[{value:'',label:'All'},{value:'pending',label:'Pending'},{value:'approved',label:'Approved'},{value:'rejected',label:'Rejected'}]}/>
      </div>
      <div className="space-y-3">
        {teachersQ.isLoading ? Array.from({length:4}).map((_,i)=><div key={i} className="h-28 rounded-2xl bg-white/3 animate-pulse"/>)
        : (teachersQ.data?.teachers||[]).length===0 ? <Card><div className="flex flex-col items-center py-16 text-zinc-600"><GraduationCap size={32} className="mb-3 opacity-40"/><div className="text-sm font-medium">No teachers found</div></div></Card>
        : (teachersQ.data.teachers).map(t=>(
          <div key={t.id} className="group rounded-2xl border border-white/5 bg-[#161b27] p-5 transition hover:border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-bold text-sm shrink-0">{(t.profiles?.full_name||'T')[0].toUpperCase()}</div>
                <div>
                  <div className="font-semibold text-zinc-200">{t.profiles?.full_name||'Teacher'}</div>
                  <div className="mt-0.5 font-mono text-xs text-zinc-600">{t.profiles?.email||''}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill>{t.verification_status}</Pill>
                    {t.subject&&<span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-500">{t.subject}</span>}
                    {t.qualification&&<span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-500">{t.qualification}</span>}
                    {t.experience_years&&<span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-500">{t.experience_years}y exp</span>}
                    {t.hourly_rate&&<span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-500">${t.hourly_rate}/hr</span>}
                  </div>
                  {t.rejection_reason&&<div className="mt-2 flex items-start gap-2 rounded-lg bg-red-500/8 px-3 py-2 text-xs text-red-400"><AlertCircle size={12} className="mt-0.5 shrink-0"/><span>{t.rejection_reason}</span></div>}
                </div>
              </div>
              <div className="flex items-center gap-2 lg:shrink-0">
                {t.documents?.length>0&&<button onClick={()=>setDocModal({teacher:t})} className="flex items-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/8 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/15 transition"><FileText size={13}/> {t.documents.length} doc{t.documents.length!==1?'s':''}</button>}
                {t.verification_status!=='approved'&&<button onClick={()=>verifyMut.mutate({id:t.id,status:'approved'})} disabled={verifyMut.isPending} className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"><CheckCircle2 size={13}/> Approve</button>}
                {t.verification_status!=='rejected'&&<button onClick={()=>{setRejectModal({teacher:t});setRejectReason('')}} className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"><XCircle size={13}/> Reject</button>}
                {t.verification_status!=='pending'&&<button onClick={()=>verifyMut.mutate({id:t.id,status:'pending'})} className="flex items-center gap-1.5 rounded-xl border border-white/6 px-3 py-2 text-xs font-bold text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition"><Clock size={13}/> Reset</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {Modals}
    </div>
  )

  /* ── COURSES ── */
  if (activeTab === 'courses') return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div><h1 className="font-display text-3xl font-black tracking-tight text-white">Courses</h1><p className="mt-1 text-sm text-zinc-600">Review teacher-submitted courses before they appear publicly</p></div>
      <Card>
        <Table loading={coursesQ.isLoading} empty="No courses found" rows={coursesQ.data?.courses||[]} cols={[
          {key:'title',      label:'Title',   render:c=><span className="font-semibold text-zinc-200 max-w-[200px] truncate block">{c.title}</span>},
          {key:'teacher',    label:'Teacher', render:c=><span className="text-zinc-500 text-xs">{c.profiles?.full_name||c.teacher_name||'—'}</span>},
          {key:'subject',    label:'Subject', render:c=><span className="font-mono text-xs text-zinc-600">{c.subject||'—'}</span>},
          {key:'lessons',    label:'Lessons', render:c=><span className="font-mono text-xs text-zinc-500 tabular-nums">{c.total_lessons||0}</span>},
          {key:'price',      label:'Price',   render:c=><span className="font-mono text-xs text-amber-400 tabular-nums">{c.is_free ? 'Free' : fmtMoney(c.price||0)}</span>},
          {key:'status',     label:'Status',  render:c=><Pill>{c.status||'draft'}</Pill>},
          {key:'created_at', label:'Created', render:c=><span className="font-mono text-xs text-zinc-600">{fmtDate(c.created_at)}</span>},
          {key:'actions',    label:'Actions', render:c=><div className="flex items-center gap-2">{c.status!=='published'&&<button onClick={()=>courseStatusMut.mutate({id:c.id,status:'published'})} disabled={courseStatusMut.isPending} className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"><CheckCircle2 size={13}/> Approve</button>}{c.status!=='draft'&&<button onClick={()=>courseStatusMut.mutate({id:c.id,status:'draft'})} disabled={courseStatusMut.isPending} className="flex items-center gap-1.5 rounded-xl border border-white/6 px-3 py-2 text-xs font-bold text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition disabled:opacity-50"><Clock size={13}/> Send back</button>}</div>},
        ]}/>
      </Card>
    </div>
  )

  /* ── REVIEWS ── */
  if (activeTab === 'reviews') return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div><h1 className="font-display text-3xl font-black tracking-tight text-white">Reviews</h1><p className="mt-1 text-sm text-zinc-600">Moderate and remove platform reviews</p></div>
      <div className="space-y-3">
        {reviewsQ.isLoading ? Array.from({length:4}).map((_,i)=><div key={i} className="h-24 rounded-2xl bg-white/3 animate-pulse"/>)
        : (reviewsQ.data?.reviews||[]).length===0 ? <Card><div className="flex flex-col items-center py-16 text-zinc-600"><Star size={32} className="mb-3 opacity-40"/><div className="text-sm font-medium">No reviews yet</div></div></Card>
        : (reviewsQ.data.reviews).map(r=>(
          <div key={r.id} className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-[#161b27] p-5 transition hover:border-white/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-sm font-bold shrink-0">{(r.reviewer_name||'U')[0].toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-zinc-200">{r.reviewer_name||'User'}</span>
                <span className="text-zinc-600">→</span>
                <span className="text-sm font-semibold text-zinc-300">{r.teacher_name||'Teacher'}</span>
                <div className="flex items-center gap-0.5">{Array.from({length:5},(_,i)=><Star key={i} size={11} className={i<r.rating?'fill-amber-400 text-amber-400':'text-zinc-700'}/>)}</div>
              </div>
              {r.comment&&<div className="mt-1.5 text-sm text-zinc-500">{r.comment}</div>}
              <div className="mt-1 font-mono text-[10px] text-zinc-700">{fmtDate(r.created_at)}</div>
            </div>
            <button onClick={()=>{if(window.confirm('Delete this review permanently?'))deleteReviewMut.mutate(r.id)}} className="shrink-0 rounded-lg bg-red-500/8 p-1.5 text-red-500 hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100" title="Delete"><Trash2 size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  )

  /* ── BOOKINGS ── */
  if (activeTab === 'bookings') return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="font-display text-3xl font-black tracking-tight text-white">Bookings</h1><p className="mt-1 text-sm text-zinc-600">All class sessions and booking activity</p></div>
        <FilterTabs value={bookingFilter} onChange={setBookingFilter} options={[{value:'',label:'All'},{value:'upcoming',label:'Upcoming'},{value:'completed',label:'Completed'},{value:'cancelled',label:'Cancelled'}]}/>
      </div>
      <Card>
        <Table loading={bookingsQ.isLoading} empty="No bookings found" rows={bookingsQ.data?.bookings||[]} cols={[
          {key:'id',           label:'ID',      render:b=><span className="font-mono text-[10px] text-zinc-700">{String(b.id||'').slice(0,8)}…</span>},
          {key:'course',       label:'Course',  render:b=><span className="text-xs font-medium text-zinc-300 max-w-[160px] truncate block">{b.courses?.title||b.courses?.subject||'—'}</span>},
          {key:'student',      label:'Student', render:b=><span className="text-xs text-zinc-500">{b.profiles?.full_name||b['profiles!student_id']?.full_name||'—'}</span>},
          {key:'teacher',      label:'Teacher', render:b=><span className="text-xs text-zinc-500">{b.teachers?.profiles?.full_name||b['teachers!teacher_id']?.profiles?.full_name||'—'}</span>},
          {key:'session_date', label:'Date',    render:b=><span className="font-mono text-xs text-zinc-600">{fmtDT(b.session_date||b.scheduled_at)}</span>},
          {key:'status',       label:'Status',  render:b=><Pill>{b.status||'—'}</Pill>},
          {key:'price_paid',   label:'Amount',  render:b=>b.price_paid?<span className="font-mono text-xs text-amber-400 tabular-nums">{fmtMoney(b.price_paid)}</span>:<span className="text-zinc-700">—</span>},
        ]}/>
      </Card>
    </div>
  )

  /* ── PAYMENTS ── */
  if (activeTab === 'payments') return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div><h1 className="font-display text-3xl font-black tracking-tight text-white">Payments</h1><p className="mt-1 text-sm text-zinc-600">Revenue and transaction history</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <KPI icon={DollarSign} label="Lifetime Revenue" value={fmtMoney(revenue.total_revenue)} color="emerald"/>
        <KPI icon={TrendingUp} label="This Month"       value={fmtMoney(revenue.this_month)}    color="amber"/>
        <KPI icon={Activity}   label="Last Month"       value={fmtMoney(revenue.last_month)}    color="blue"/>
      </div>
      <Card title="All Transactions">
        <Table loading={paymentsQ.isLoading} empty="No payment records" rows={paymentsQ.data?.payments||[]} cols={[
          {key:'id',             label:'ID',      render:p=><span className="font-mono text-[10px] text-zinc-700">{String(p.id||'').slice(0,8)}…</span>},
          {key:'payer',          label:'Payer',   render:p=><span className="text-xs text-zinc-400">{p.profiles?.full_name||p['profiles!payer_id']?.full_name||'—'}</span>},
          {key:'teacher',        label:'Teacher', render:p=><span className="text-xs text-zinc-500">{p.teachers?.profiles?.full_name||p['teachers!teacher_id']?.profiles?.full_name||'—'}</span>},
          {key:'amount',         label:'Amount',  render:p=><span className="font-mono text-sm font-bold tabular-nums text-amber-400">{fmtMoney(p.amount)}</span>},
          {key:'status',         label:'Status',  render:p=><Pill>{p.status||'—'}</Pill>},
          {key:'payment_method', label:'Method',  render:p=><span className="font-mono text-xs text-zinc-600">{p.payment_method||'—'}</span>},
          {key:'created_at',     label:'Date',    render:p=><span className="font-mono text-xs text-zinc-600">{fmtDT(p.created_at)}</span>},
        ]}/>
      </Card>
    </div>
  )

  /* ── RECORDINGS ── */
  if (activeTab === 'recordings') return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div><h1 className="font-display text-3xl font-black tracking-tight text-white">Recordings</h1><p className="mt-1 text-sm text-zinc-600">All class recordings uploaded by teachers</p></div>
      <Card>
        <Table loading={recordingsQ.isLoading} empty="No recordings yet" rows={recordingsQ.data?.recordings||[]} cols={[
          {key:'title',            label:'Title',      render:r=><span className="font-medium text-zinc-200 max-w-[180px] truncate block">{r.title||'—'}</span>},
          {key:'teacher',          label:'Teacher',    render:r=><span className="text-xs text-zinc-500">{r.teachers?.profiles?.full_name||r['teachers!teacher_id']?.profiles?.full_name||'—'}</span>},
          {key:'course',           label:'Course',     render:r=><span className="text-xs text-zinc-600">{r.class_sessions?.courses?.title||'—'}</span>},
          {key:'duration_seconds', label:'Duration',   render:r=><span className="font-mono text-xs text-zinc-600">{fmtDur(r.duration_seconds)}</span>},
          {key:'visibility',       label:'Visibility', render:r=><Pill>{r.visibility||'—'}</Pill>},
          {key:'status',           label:'Status',     render:r=><Pill>{r.status||'—'}</Pill>},
          {key:'created_at',       label:'Uploaded',   render:r=><span className="font-mono text-xs text-zinc-600">{fmtDate(r.created_at)}</span>},
        ]}/>
      </Card>
    </div>
  )

  /* ── SETTINGS ── */
  if (activeTab === 'settings') return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div><h1 className="font-display text-3xl font-black tracking-tight text-white">Settings</h1><p className="mt-1 text-sm text-zinc-600">Platform configuration and system info</p></div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Platform Config">
          <div className="space-y-2">
            {[{label:'API URL',val:API},{label:'Environment',val:import.meta.env.MODE},{label:'Build Date',val:new Date().toLocaleDateString()}].map(({label,val})=>(
              <div key={label} className="flex items-center justify-between rounded-xl bg-[#0d1117] px-4 py-3">
                <span className="text-xs font-medium text-zinc-600 uppercase tracking-wider">{label}</span>
                <code className="font-mono text-xs text-emerald-400">{val}</code>
              </div>
            ))}
          </div>
        </Card>
        <Card title="External Links">
          <div className="space-y-2">
            {[{label:'Health Check',href:`${API}/api/health`},{label:'Supabase Dashboard',href:'https://supabase.com/dashboard'},{label:'Vercel Dashboard',href:'https://vercel.com/dashboard'}].map(({label,href})=>(
              <a key={label} href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-[#0d1117] px-4 py-3 text-sm text-emerald-400 hover:bg-white/4 transition">
                <span>{label}</span><ExternalLink size={13}/>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  return null
}
