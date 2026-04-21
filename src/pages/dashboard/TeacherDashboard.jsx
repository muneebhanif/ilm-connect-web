import { Fragment, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useOutletContext } from 'react-router-dom'
import {
  Calendar, Users, BookOpen, Clock3, Video, Bell, Star, ListVideo, ImagePlus, Plus, Trash2, Save,
  ShieldCheck, FileText, Upload, CirclePlay, Wallet, ExternalLink, CheckCircle2, Circle, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../../lib/auth.jsx'
import toast from 'react-hot-toast'
import { api, authFetch, apiFetch, normalizeTeacherProfileResponse, getCourseThumbnail } from '../../lib/api.js'
import { fileToBase64, getFileExtension } from '../../lib/files.js'
import { StatCard, SectionCard, EmptyState, StatusPill, ActionButton, TextInput, GridList } from '../../components/dashboard-ui.jsx'
import MessageCenter from '../../components/MessageCenter.jsx'
import { SectionRowsSkeleton, SkeletonBlock } from '../../components/skeletons.jsx'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
const LESSON_VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', 'webm']
const DOCUMENT_TYPES = [
  { id: 'certificate', label: 'Teaching certificate', helper: 'Ijazah, tajweed, or teaching certificate.' },
  { id: 'identity', label: 'Identity proof', helper: 'Passport, national ID, or driving licence.' },
  { id: 'resume', label: 'Resume / experience', helper: 'CV, portfolio summary, or work history.' },
]

function sortHours(slots = []) {
  return [...new Set(slots)].sort((a, b) => HOURS.indexOf(a) - HOURS.indexOf(b))
}

function normalizeAvailabilityMap(value = {}) {
  return DAYS.reduce((acc, day) => {
    acc[day] = sortHours(Array.isArray(value?.[day]) ? value[day] : [])
    return acc
  }, {})
}

function formatHourLabel(hour = '') {
  const [raw] = String(hour).split(':')
  const num = Number(raw)
  if (Number.isNaN(num)) return hour
  const suffix = num >= 12 ? 'PM' : 'AM'
  const normalized = num % 12 || 12
  return `${normalized}:00 ${suffix}`
}

function getVerificationTone(status = 'pending') {
  const normalized = String(status).toLowerCase()
  if (normalized === 'verified' || normalized === 'approved') return 'emerald'
  if (normalized === 'rejected') return 'rose'
  return 'gold'
}

function buildProfileChecklist(teacher = {}, documents = [], availability = {}, courses = []) {
  const totalAvailability = Object.values(availability || {}).reduce((sum, slots) => sum + (Array.isArray(slots) ? slots.length : 0), 0)
  return [
    { label: 'Add your full name', done: Boolean(teacher.full_name?.trim()) },
    { label: 'Write a teacher bio', done: Boolean(teacher.bio?.trim()) },
    { label: 'Upload a profile photo', done: Boolean(teacher.avatar_url) },
    { label: 'Add subjects', done: Array.isArray(teacher.subjects) && teacher.subjects.length > 0 },
    { label: 'Add languages', done: Array.isArray(teacher.languages) && teacher.languages.length > 0 },
    { label: 'Set your pricing', done: Boolean(Number(teacher.hourly_rate || 0) || Number(teacher.weekly_package_price || 0) || Number(teacher.monthly_package_price || 0)) },
    { label: 'Set weekly availability', done: totalAvailability > 0 },
    { label: 'Upload verification documents', done: Array.isArray(documents) && documents.length > 0 },
    { label: 'Create your first course', done: Array.isArray(courses) && courses.length > 0 },
  ]
}

function mapErr(msg = '') {
  const n = String(msg).toLowerCase()
  if (n.includes('row level security')) return 'Permission error. Please run the latest migration.'
  if (n.includes('course not found')) return 'Course not found. Refresh and try again.'
  if (n.includes('thumbnail is required')) return 'Please upload a course thumbnail.'
  if (n.includes('upload at least one')) return 'Upload at least one video lesson first.'
  return msg || 'Something went wrong.'
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

export default function TeacherDashboard() {
  const { user, token } = useAuth()
  const qc = useQueryClient()
  const { activeTab } = useOutletContext()
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [courseThumbnailFile, setCourseThumbnailFile] = useState(null)
  const [courseThumbnailPreview, setCourseThumbnailPreview] = useState('')
  const [lessonFile, setLessonFile] = useState(null)
  const [profileForm, setProfileForm] = useState({ full_name: '', bio: '', hourly_rate: '', weekly_package_price: '', monthly_package_price: '', subjects: '', languages: '', gender: '', timezone: '', phone: '' })
  const [courseForm, setCourseForm] = useState({ id: '', title: '', description: '', subject: '', level: 'beginner', price: '', is_free: true, total_lessons: '', thumbnail_url: '' })
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', content_url: '', is_preview: false })
  const [recordingForm, setRecordingForm] = useState({ sessionId: '', title: '', description: '', visibility: 'free', durationSeconds: '' })
  const [availabilityDraft, setAvailabilityDraft] = useState(() => normalizeAvailabilityMap())

  const scheduleQ = useQuery({ queryKey: ['teacherSchedule', user?.id], queryFn: () => authFetch(api.teacherSchedule(user.id), token), enabled: !!user?.id && !!token })
  const studentsQ = useQuery({ queryKey: ['teacherStudents', user?.id], queryFn: () => authFetch(api.teacherStudents(user.id), token), enabled: !!user?.id && !!token })
  const coursesQ = useQuery({ queryKey: ['teacherCourses', user?.id], queryFn: () => authFetch(api.teacherCourses(user.id), token), enabled: !!user?.id && !!token })
  const profileQ = useQuery({ queryKey: ['teacherPublicProfile', user?.id], queryFn: () => apiFetch(api.teacherProfile(user.id)), enabled: !!user?.id })
  const notifsQ = useQuery({ queryKey: ['teacherNotifications', user?.id], queryFn: () => authFetch(api.teacherNotifications(user.id), token), enabled: !!user?.id && !!token })
  const payoutQ = useQuery({ queryKey: ['teacherPayoutStatus', user?.id], queryFn: () => authFetch(api.teacherConnectStatus(), token), enabled: !!user?.id && !!token })
  const docsQ = useQuery({ queryKey: ['teacherDocuments', user?.id], queryFn: () => authFetch(api.teacherDocuments(user.id), token), enabled: !!user?.id && !!token })
  const lessonsQ = useQuery({ queryKey: ['courseLessons', selectedCourseId, user?.id], queryFn: () => authFetch(api.courseLessons(selectedCourseId, user.id), token), enabled: !!selectedCourseId && !!user?.id && !!token })

  const teacher = normalizeTeacherProfileResponse(profileQ.data || {}, user?.id)
  const stats = teacher.stats || {}
  const schedule = scheduleQ.data?.sessions || []
  const completedClasses = schedule.filter(s => s.status === 'completed')
  const students = studentsQ.data?.students || []
  const courses = coursesQ.data?.courses || []
  const notifications = notifsQ.data?.notifications || []
  const documents = docsQ.data?.documents || []
  const lessons = lessonsQ.data?.lessons || []
  const availability = normalizeAvailabilityMap(teacher.availability || {})
  const verificationStatus = docsQ.data?.verification_status || teacher.verification_status || 'pending'
  const totalAvailabilitySlots = Object.values(availabilityDraft).reduce((sum, slots) => sum + slots.length, 0)
  const hasAvailabilityChanges = JSON.stringify(availabilityDraft) !== JSON.stringify(availability)
  const profileChecklist = buildProfileChecklist(teacher, documents, availability, courses)
  const completedChecklistCount = profileChecklist.filter((item) => item.done).length
  const profileCompletion = Math.round((completedChecklistCount / profileChecklist.length) * 100)
  const remainingChecklist = profileChecklist.filter((item) => !item.done)

  useEffect(() => { if (teacher?.full_name) setProfileForm({ full_name: teacher.full_name || '', bio: teacher.bio || '', hourly_rate: teacher.hourly_rate ? String(teacher.hourly_rate) : '', weekly_package_price: teacher.weekly_package_price ? String(teacher.weekly_package_price) : '', monthly_package_price: teacher.monthly_package_price ? String(teacher.monthly_package_price) : '', subjects: Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : '', languages: Array.isArray(teacher.languages) ? teacher.languages.join(', ') : '', gender: teacher.gender || '', timezone: teacher.timezone || '', phone: teacher.phone || '' }) }, [teacher.full_name, teacher.bio, teacher.hourly_rate, teacher.weekly_package_price, teacher.monthly_package_price, teacher.subjects, teacher.languages, teacher.gender, teacher.timezone, teacher.phone])
  useEffect(() => { if (!selectedCourseId && courses.length > 0) setSelectedCourseId(courses[0].id) }, [courses, selectedCourseId])
  useEffect(() => { setAvailabilityDraft(normalizeAvailabilityMap(teacher.availability || {})) }, [teacher.availability])

  // Mutations
  const updateProfile = useMutation({ mutationFn: (p) => authFetch(api.updateTeacher(user.id), token, { method: 'PUT', body: JSON.stringify(p) }), onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries({ queryKey: ['teacherPublicProfile', user.id] }) }, onError: (err) => toast.error(mapErr(err?.message)) })
  const uploadAvatar = useMutation({ mutationFn: async (f) => { const img = await fileToBase64(f); return authFetch(api.uploadProfileImage(user.id), token, { method: 'POST', body: JSON.stringify({ image: img, fileExtension: getFileExtension(f.name) }) }) }, onSuccess: () => { toast.success('Avatar uploaded'); qc.invalidateQueries({ queryKey: ['teacherPublicProfile', user.id] }) }, onError: (err) => toast.error(err?.message || 'Upload failed') })
  const uploadThumb = useMutation({ mutationFn: async ({ courseId, file }) => { const img = await fileToBase64(file); return authFetch(api.uploadCourseThumbnail(user.id, courseId), token, { method: 'POST', body: JSON.stringify({ image: img, fileExtension: getFileExtension(file.name) }) }) }, onSuccess: () => qc.invalidateQueries({ queryKey: ['teacherCourses', user.id] }) })
  const createCourse = useMutation({ mutationFn: (p) => authFetch(api.createCourse(), token, { method: 'POST', body: JSON.stringify(p) }), onError: (err) => toast.error(mapErr(err?.message)) })
  const updateCourse = useMutation({ mutationFn: ({ courseId, payload }) => authFetch(api.updateCourse(courseId), token, { method: 'PUT', body: JSON.stringify(payload) }), onSuccess: () => { toast.success('Course updated'); qc.invalidateQueries({ queryKey: ['teacherCourses', user.id] }) }, onError: (err) => toast.error(mapErr(err?.message)) })
  const deleteCourse = useMutation({ mutationFn: (id) => authFetch(api.deleteCourse(id), token, { method: 'DELETE', body: JSON.stringify({ teacher_id: user.id }) }), onSuccess: () => { toast.success('Course deleted'); qc.invalidateQueries({ queryKey: ['teacherCourses', user.id] }); setSelectedCourseId(null) }, onError: (err) => toast.error(mapErr(err?.message)) })
  const createLesson = useMutation({ mutationFn: (p) => authFetch(api.createLesson(selectedCourseId), token, { method: 'POST', body: JSON.stringify(p) }), onSuccess: () => { toast.success('Lesson added'); setLessonForm({ title: '', description: '', content_url: '', is_preview: false }); qc.invalidateQueries({ queryKey: ['courseLessons', selectedCourseId, user.id] }) }, onError: (err) => toast.error(mapErr(err?.message)) })
  const uploadLesson = useMutation({ mutationFn: async ({ file, payload }) => { const ext = getFileExtension(file.name).toLowerCase(); if (!LESSON_VIDEO_EXTENSIONS.includes(ext)) throw new Error('Only video files allowed'); if (file.size / 1048576 > 50) throw new Error('Video too large (max 50MB)'); const content = await fileToBase64(file); return authFetch(api.uploadLesson(selectedCourseId), token, { method: 'POST', body: JSON.stringify({ ...payload, content, fileExtension: ext, fileName: file.name, content_type: 'video' }) }) }, onSuccess: () => { toast.success('Lesson uploaded'); setLessonForm({ title: '', description: '', content_url: '', is_preview: false }); setLessonFile(null); qc.invalidateQueries({ queryKey: ['courseLessons', selectedCourseId, user.id] }) }, onError: (err) => toast.error(mapErr(err?.message)) })
  const deleteLesson = useMutation({ mutationFn: ({ lessonId }) => authFetch(api.deleteLesson(selectedCourseId, lessonId), token, { method: 'DELETE', body: JSON.stringify({ teacher_id: user.id }) }), onSuccess: () => { toast.success('Lesson deleted'); qc.invalidateQueries({ queryKey: ['courseLessons', selectedCourseId, user.id] }) }, onError: (err) => toast.error(mapErr(err?.message)) })
  const uploadDoc = useMutation({ mutationFn: async ({ file, documentType }) => { const doc = await fileToBase64(file); return authFetch(api.uploadTeacherDocument(user.id), token, { method: 'POST', body: JSON.stringify({ document: doc, documentType, fileExtension: getFileExtension(file.name), fileName: file.name }) }) }, onSuccess: () => { toast.success('Document uploaded'); qc.invalidateQueries({ queryKey: ['teacherDocuments', user.id] }) }, onError: (err) => toast.error(err?.message || 'Upload failed') })
  const uploadPortfolio = useMutation({ mutationFn: async ({ file, mediaType }) => { const enc = await fileToBase64(file); return authFetch(api.uploadTeacherPortfolioMedia(user.id), token, { method: 'POST', body: JSON.stringify({ file: enc, mediaType, fileExtension: getFileExtension(file.name) }) }) }, onSuccess: () => { toast.success('Portfolio media added'); qc.invalidateQueries({ queryKey: ['teacherPublicProfile', user.id] }) }, onError: (err) => toast.error(err?.message || 'Upload failed') })
  const removePortfolio = useMutation({ mutationFn: (id) => authFetch(api.deleteTeacherPortfolioMedia(user.id, id), token, { method: 'DELETE' }), onSuccess: () => { toast.success('Media removed'); qc.invalidateQueries({ queryKey: ['teacherPublicProfile', user.id] }) }, onError: (err) => toast.error(err?.message || 'Remove failed') })
  const uploadRecording = useMutation({ mutationFn: async ({ file, payload }) => { const vid = await fileToBase64(file); return authFetch(api.uploadClassRecording(user.id), token, { method: 'POST', body: JSON.stringify({ ...payload, video: vid, fileExtension: getFileExtension(file.name) }) }) }, onSuccess: () => toast.success('Recording uploaded successfully!'), onError: (err) => toast.error(err?.message || 'Recording upload failed') })
  const classAction = useMutation({ mutationFn: ({ type, sessionId }) => authFetch(type === 'start' ? api.startClass(sessionId) : api.endClass(sessionId), token, { method: 'POST' }), onSuccess: (_, v) => { toast.success(v.type === 'start' ? 'Class started' : 'Class ended'); qc.invalidateQueries({ queryKey: ['teacherSchedule', user.id] }) }, onError: (err) => toast.error(err?.message || 'Action failed') })
  const connectOnboarding = useMutation({ mutationFn: () => authFetch(api.teacherConnectOnboarding(), token, { method: 'POST', body: JSON.stringify({ refreshUrl: `${window.location.origin}/dashboard/teacher?tab=payouts`, returnUrl: `${window.location.origin}/dashboard/teacher?tab=payouts` }) }), onSuccess: (d) => { if (d?.onboardingUrl) window.open(d.onboardingUrl, '_blank') }, onError: (err) => toast.error(err?.message || 'Failed to start Stripe onboarding') })
  const stripeDash = useMutation({ mutationFn: () => authFetch(api.teacherDashboardLink(), token, { method: 'POST' }), onSuccess: (d) => { if (d?.dashboardUrl) window.open(d.dashboardUrl, '_blank') } })

  const resetCourseForm = () => { setCourseForm({ id: '', title: '', description: '', subject: '', level: 'beginner', price: '', is_free: true, total_lessons: '', thumbnail_url: '' }); setCourseThumbnailFile(null); setCourseThumbnailPreview('') }
  const toggleAvailabilitySlot = (day, hour) => {
    setAvailabilityDraft((current) => {
      const daySlots = Array.isArray(current?.[day]) ? current[day] : []
      const nextSlots = daySlots.includes(hour)
        ? daySlots.filter((slot) => slot !== hour)
        : sortHours([...daySlots, hour])
      return { ...current, [day]: nextSlots }
    })
  }
  const clearAvailabilityDay = (day) => setAvailabilityDraft((current) => ({ ...current, [day]: [] }))
  const resetAvailability = () => setAvailabilityDraft(normalizeAvailabilityMap(teacher.availability || {}))
  const saveAvailability = () => updateProfile.mutate({ availability: availabilityDraft })
  const submitCourse = async (e) => {
    e.preventDefault()
    const p = { teacher_id: user.id, title: courseForm.title, description: courseForm.description, subject: courseForm.subject, level: courseForm.level, price: courseForm.is_free ? 0 : Number(courseForm.price || 0), is_free: courseForm.is_free, total_lessons: Number(courseForm.total_lessons || 0), thumbnail_url: courseForm.id ? courseForm.thumbnail_url || null : null }
    const r = courseForm.id ? await updateCourse.mutateAsync({ courseId: courseForm.id, payload: p }) : await createCourse.mutateAsync(p)
    const cid = courseForm.id || r?.course?.id || r?.id
    if (cid && courseThumbnailFile) await uploadThumb.mutateAsync({ courseId: cid, file: courseThumbnailFile })
    resetCourseForm(); qc.invalidateQueries({ queryKey: ['teacherCourses', user.id] })
  }

  const fileInputClass = "block w-full rounded-2xl border border-parchment/60 bg-ivory px-4 py-3 text-sm text-bark file:mr-3 file:rounded-lg file:border-0 file:bg-emerald/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-emerald"

  // ─── OVERVIEW ───
  if (activeTab === 'overview') return (
    <PageHeader title={`Welcome back, ${teacher.full_name || user?.full_name || 'Teacher'}`} description="Your teaching command center." actions={<Link to={`/teachers/${user?.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-parchment bg-white px-5 py-3 text-sm font-semibold text-ink-soft hover:border-emerald/30 hover:text-emerald">Public profile <ShieldCheck size={16} /></Link>}>
      <SectionCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-[28px] bg-gradient-to-r from-emerald/10 via-white to-gold/10 p-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald shadow-sm">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald">Teacher verification</div>
                <div className="mt-1 text-xl font-bold text-ink">Keep your profile trusted and booking-ready</div>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bark">
              Upload your teaching certificate, identity proof, and resume so parents can trust your profile and admins can review you faster.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <StatusPill tone={getVerificationTone(verificationStatus)}>{verificationStatus}</StatusPill>
            <div className="text-sm text-bark">{documents.length} document{documents.length === 1 ? '' : 's'} uploaded</div>
            <div className="flex flex-wrap gap-2">
              <Link to="?tab=assets" className="rounded-2xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white">Open verification</Link>
              <Link to="?tab=profile" className="rounded-2xl border border-parchment bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft hover:border-emerald/30 hover:text-emerald">Complete profile</Link>
            </div>
          </div>
        </div>
      </SectionCard>
      <SectionCard>
        <div className="flex flex-col gap-5 rounded-[28px] bg-white p-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 rounded-[24px] bg-ivory/55 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald">Profile completion</div>
                <div className="mt-1 text-2xl font-bold text-ink">Complete your profile — {profileCompletion}%</div>
              </div>
              <StatusPill tone={profileCompletion >= 80 ? 'emerald' : profileCompletion >= 50 ? 'gold' : 'rose'}>{profileCompletion}% done</StatusPill>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-parchment/70">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald to-teal transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="mt-3 text-sm text-bark">
              Teachers with complete profiles look more trustworthy and are easier for parents to book.
            </p>
          </div>
          <div className="min-w-0 flex-1 rounded-[24px] bg-emerald/5 p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald">Next steps</div>
            <div className="mt-3 space-y-2">
              {remainingChecklist.length === 0 ? (
                <div className="rounded-2xl border border-emerald/20 bg-white px-4 py-3 text-sm font-semibold text-emerald">Your profile is complete. Keep it updated.</div>
              ) : (
                remainingChecklist.slice(0, 4).map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-parchment/50 bg-white px-4 py-3 text-sm text-ink">
                    <Circle size={16} className="text-bark/50" />
                    <span>{item.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SectionCard>
      <GridList cols="md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} label="Upcoming classes" value={stats.upcomingClasses || schedule.filter(s => s.status !== 'completed').length} tone="emerald" />
        <StatCard icon={Users} label="Students" value={stats.totalStudents || students.length} tone="gold" />
        <StatCard icon={BookOpen} label="Courses" value={courses.length} tone="teal" />
        <StatCard icon={Star} label="Rating" value={Number(teacher.rating || 0).toFixed(1)} tone="ink" />
      </GridList>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Upcoming schedule">
          {scheduleQ.isLoading ? <SectionRowsSkeleton rows={4} itemClassName="h-20" /> : schedule.length === 0 ? <EmptyState icon={Calendar} title="No classes" text="Sessions appear when bookings are created." /> : <div className="space-y-3">{schedule.slice(0, 5).map(s => <div key={s.id} className="flex items-start justify-between rounded-2xl border border-parchment/50 bg-ivory/55 p-4"><div><div className="font-semibold text-ink">{s.courses?.title || 'Session'}</div><div className="mt-1 text-sm text-bark">{s.students?.name || 'Student'}</div><div className="mt-1 text-xs text-bark"><Clock3 size={12} className="inline mr-1" />{new Date(s.session_date).toLocaleString()}</div></div><StatusPill tone={s.status === 'completed' ? 'emerald' : s.status === 'cancelled' ? 'rose' : 'gold'}>{s.status || 'upcoming'}</StatusPill></div>)}</div>}
        </SectionCard>
        <SectionCard title="Notifications">
          {notifsQ.isLoading ? <SectionRowsSkeleton rows={4} itemClassName="h-16" /> : notifications.length === 0 ? <EmptyState icon={Bell} title="No notifications" text="Updates will appear here." /> : <div className="space-y-3">{notifications.slice(0, 6).map(n => <div key={n.id} className="flex items-start justify-between rounded-2xl border border-parchment/50 bg-white p-4 gap-3"><div><div className="font-semibold text-ink">{n.title}</div><div className="mt-1 text-sm text-bark">{n.message}</div></div><StatusPill tone={n.type === 'system' ? 'teal' : 'gold'}>{n.type.replace('_', ' ')}</StatusPill></div>)}</div>}
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── SCHEDULE ───
  if (activeTab === 'schedule') return (
    <PageHeader title="Schedule" description="Review and control live sessions.">
      <SectionCard>
        {scheduleQ.isLoading ? <SectionRowsSkeleton rows={4} itemClassName="h-20" /> : schedule.length === 0 ? <EmptyState icon={Calendar} title="No sessions" text="Sessions appear with bookings." /> : <div className="space-y-4">{schedule.map(s => <div key={s.id} className="rounded-[24px] border border-parchment/50 bg-white p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/10 text-emerald"><Video size={20} /></div><div><div className="font-semibold text-ink">{s.courses?.title || 'Session'}</div><div className="mt-1 text-sm text-bark">{s.students?.name || 'Student'}</div><div className="mt-2 text-xs text-bark">{new Date(s.session_date).toLocaleString()} • {s.duration_minutes || 60}min</div></div></div><div className="flex flex-wrap items-center gap-2"><StatusPill tone={s.status === 'completed' ? 'emerald' : s.status === 'cancelled' ? 'rose' : 'gold'}>{s.status || 'upcoming'}</StatusPill><Link to={`/classroom/${s.id}`} className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white">Join</Link><button onClick={() => classAction.mutate({ type: 'start', sessionId: s.id })} disabled={classAction.isPending} className="rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Start</button><button onClick={() => classAction.mutate({ type: 'end', sessionId: s.id })} disabled={classAction.isPending} className="rounded-xl bg-rose px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">End</button></div></div></div>)}</div>}
      </SectionCard>
    </PageHeader>
  )

  // ─── COURSES ───
  if (activeTab === 'courses') return (
    <PageHeader title="Courses" description="Create and manage your course catalog.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title={courseForm.id ? 'Edit course' : 'New course'}>
          <form className="space-y-4" onSubmit={submitCourse}>
            <TextInput label="Title" value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} />
            <TextInput label="Description" as="textarea" rows="4" value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Subject" value={courseForm.subject} onChange={e => setCourseForm(p => ({ ...p, subject: e.target.value }))} />
              <TextInput label="Level" value={courseForm.level} onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))} />
              <TextInput label="Price" type="number" value={courseForm.price} onChange={e => setCourseForm(p => ({ ...p, price: e.target.value }))} disabled={courseForm.is_free} />
              <TextInput label="Total lessons" type="number" value={courseForm.total_lessons} onChange={e => setCourseForm(p => ({ ...p, total_lessons: e.target.value }))} />
            </div>
            <div><label className="mb-2 block text-sm font-semibold text-ink-soft">Cover image</label><input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; setCourseThumbnailFile(f || null); setCourseThumbnailPreview(f ? URL.createObjectURL(f) : courseForm.thumbnail_url || '') }} className={fileInputClass} />{courseThumbnailPreview && <img src={courseThumbnailPreview} alt="" className="mt-3 h-32 w-full rounded-2xl object-cover" />}</div>
            <label className="flex items-center gap-3 text-sm font-semibold text-ink-soft"><input type="checkbox" checked={courseForm.is_free} onChange={e => setCourseForm(p => ({ ...p, is_free: e.target.checked }))} className="rounded" /> Free course</label>
            <div className="flex flex-wrap gap-3">
              <ActionButton type="submit" icon={Save} disabled={createCourse.isPending || updateCourse.isPending || uploadThumb.isPending}>{courseForm.id ? 'Save' : 'Create'}</ActionButton>
              {courseForm.id && <button type="button" className="rounded-2xl border border-parchment px-5 py-3 text-sm font-semibold text-ink-soft" onClick={resetCourseForm}>Clear</button>}
            </div>
          </form>
        </SectionCard>
        <SectionCard title="Your courses">
          {coursesQ.isLoading ? <SectionRowsSkeleton rows={3} itemClassName="h-44" /> : courses.length === 0 ? <EmptyState icon={BookOpen} title="No courses yet" text="Create your first course." /> : <div className="space-y-4">{courses.map(c => <div key={c.id} className="overflow-hidden rounded-[24px] border border-parchment/50 bg-white"><img src={getCourseThumbnail(c)} alt={c.title} className="h-36 w-full object-cover" /><div className="p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="font-semibold text-ink">{c.title}</div><div className="mt-1 text-sm text-bark">{c.subject || 'General'} • {c.level || 'beginner'}</div><div className="mt-1 text-xs text-bark">{c.total_lessons || 0} lessons • {c.is_free ? 'Free' : `$${c.price}`}</div></div><div className="flex flex-wrap gap-2"><Link to="?tab=lessons" onClick={() => setSelectedCourseId(c.id)} className="rounded-xl border border-parchment px-3 py-2 text-sm font-semibold text-ink-soft hover:border-emerald/20">Lessons</Link><button onClick={() => { setCourseForm({ id: c.id, title: c.title || '', description: c.description || '', subject: c.subject || '', level: c.level || 'beginner', price: String(c.price || ''), is_free: !!c.is_free, total_lessons: String(c.total_lessons || ''), thumbnail_url: c.thumbnail_url || '' }); setCourseThumbnailPreview(c.thumbnail_url || ''); setCourseThumbnailFile(null) }} className="rounded-xl bg-emerald/10 px-3 py-2 text-sm font-semibold text-emerald">Edit</button><button onClick={() => deleteCourse.mutate(c.id)} className="rounded-xl bg-rose/10 px-3 py-2 text-sm font-semibold text-rose">Delete</button></div></div></div></div>)}</div>}
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── LESSONS ───
  if (activeTab === 'lessons') return (
    <PageHeader title="Lessons" description="Manage lesson videos per course.">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <SectionCard title="Select course">
          <div className="space-y-3">{courses.length === 0 ? <EmptyState icon={ListVideo} title="No courses" text="Create a course first." /> : courses.map(c => <button key={c.id} onClick={() => setSelectedCourseId(c.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedCourseId === c.id ? 'border-emerald bg-emerald/6' : 'border-parchment/50 bg-ivory/55 hover:border-emerald/20'}`}><div className="font-semibold text-ink">{c.title}</div><div className="mt-1 text-xs text-bark">{c.subject} • {c.total_lessons || 0} lessons</div></button>)}</div>
          {selectedCourseId && <form className="mt-6 space-y-4 border-t border-parchment/40 pt-6" onSubmit={e => { e.preventDefault(); if (lessonFile) { uploadLesson.mutate({ file: lessonFile, payload: { teacher_id: user.id, title: lessonForm.title, description: lessonForm.description, is_preview: lessonForm.is_preview } }); return }; createLesson.mutate({ teacher_id: user.id, title: lessonForm.title, description: lessonForm.description, content_type: 'video', content_url: lessonForm.content_url, is_preview: lessonForm.is_preview }) }}>
            <TextInput label="Lesson title" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} />
            <TextInput label="Description" as="textarea" rows="2" value={lessonForm.description} onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))} />
            <div><label className="mb-2 block text-sm font-semibold text-ink-soft">Upload video</label><input type="file" accept="video/mp4,video/quicktime,.mp4,.mov,.m4v,.webm" onChange={e => { const f = e.target.files?.[0]; setLessonFile(f || null); if (f && !lessonForm.title.trim()) setLessonForm(p => ({ ...p, title: f.name.replace(/\.[^/.]+$/, '') })) }} className={fileInputClass} />{lessonFile && <div className="mt-2 text-xs font-medium text-emerald">✓ {lessonFile.name}</div>}</div>
            <TextInput label="Or video URL" value={lessonForm.content_url} onChange={e => setLessonForm(p => ({ ...p, content_url: e.target.value }))} disabled={!!lessonFile} placeholder="https://..." />
            <label className="flex items-center gap-3 text-sm font-semibold text-ink-soft"><input type="checkbox" checked={lessonForm.is_preview} onChange={e => setLessonForm(p => ({ ...p, is_preview: e.target.checked }))} className="rounded" /> Preview lesson</label>
            <ActionButton type="submit" disabled={createLesson.isPending || uploadLesson.isPending} icon={Plus}>{createLesson.isPending || uploadLesson.isPending ? 'Adding...' : 'Add lesson'}</ActionButton>
            {uploadLesson.isError && <div className="text-sm text-rose">{mapErr(uploadLesson.error?.message)}</div>}
          </form>}
        </SectionCard>
        <SectionCard title="Lesson library">
          {lessonsQ.isLoading ? <SectionRowsSkeleton rows={4} itemClassName="h-16" /> : !selectedCourseId ? <EmptyState icon={ListVideo} title="Select a course" /> : lessons.length === 0 ? <EmptyState icon={ListVideo} title="No lessons yet" /> : <div className="space-y-3">{lessons.map(l => <div key={l.id} className="flex items-start justify-between rounded-2xl border border-parchment/50 bg-ivory/55 p-4"><div><div className="font-semibold text-ink">{l.title}</div><div className="mt-1 text-sm text-bark">{l.description || 'Video lesson'}</div>{l.content_url && <a href={l.content_url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-emerald break-all">{l.content_url}</a>}</div><div className="flex gap-2 flex-shrink-0">{l.is_preview && <StatusPill tone="teal">Preview</StatusPill>}<button onClick={() => deleteLesson.mutate({ lessonId: l.id })} className="rounded-xl bg-rose/10 p-2 text-rose"><Trash2 size={14} /></button></div></div>)}</div>}
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── AVAILABILITY ───
  if (activeTab === 'availability') return (
    <PageHeader title="Availability" description="Build a weekly teaching calendar so parents can see when you are free.">
      <SectionCard>
        <div className="flex flex-col gap-4 rounded-[28px] bg-gradient-to-r from-white via-emerald/5 to-teal/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald">Weekly calendar</div>
            <div className="mt-1 text-lg font-bold text-ink">Tap slots to mark when you can teach</div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bark">Each selected cell becomes an available hour on your public booking schedule. Save once when you are done editing.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={totalAvailabilitySlots > 0 ? 'emerald' : 'ink'}>{totalAvailabilitySlots} total slots</StatusPill>
            <button onClick={resetAvailability} disabled={!hasAvailabilityChanges || updateProfile.isPending} className="rounded-2xl border border-parchment bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft disabled:opacity-50">Reset</button>
            <button onClick={() => setAvailabilityDraft(normalizeAvailabilityMap())} disabled={totalAvailabilitySlots === 0 || updateProfile.isPending} className="rounded-2xl border border-rose/20 bg-rose/5 px-4 py-2.5 text-sm font-semibold text-rose disabled:opacity-50">Clear all</button>
            <ActionButton onClick={saveAvailability} icon={Save} disabled={!hasAvailabilityChanges || updateProfile.isPending}>{updateProfile.isPending ? 'Saving...' : 'Save calendar'}</ActionButton>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[980px] rounded-[28px] border border-parchment/50 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-[96px_repeat(7,minmax(120px,1fr))] gap-3">
              <div className="rounded-2xl bg-ivory/70 px-3 py-4 text-xs font-bold uppercase tracking-[0.18em] text-bark">Time</div>
              {DAYS.map((day) => (
                <div key={day} className="rounded-2xl bg-ivory/70 px-3 py-4 text-center">
                  <div className="text-sm font-bold text-ink">{day}</div>
                  <div className="mt-1 text-xs text-bark">{availabilityDraft[day]?.length || 0} selected</div>
                  <button onClick={() => clearAvailabilityDay(day)} disabled={(availabilityDraft[day] || []).length === 0 || updateProfile.isPending} className="mt-3 rounded-xl border border-parchment bg-white px-3 py-1.5 text-xs font-semibold text-bark disabled:opacity-50">Clear day</button>
                </div>
              ))}
              {HOURS.map((hour) => (
                <Fragment key={hour}>
                  <div key={`${hour}-label`} className="flex items-center rounded-2xl bg-ivory/55 px-3 py-3 text-sm font-semibold text-ink-soft">{formatHourLabel(hour)}</div>
                  {DAYS.map((day) => {
                    const isActive = (availabilityDraft[day] || []).includes(hour)
                    return (
                      <button
                        key={`${day}-${hour}`}
                        onClick={() => toggleAvailabilitySlot(day, hour)}
                        className={`rounded-2xl border px-3 py-3 text-left transition ${isActive ? 'border-emerald bg-emerald text-white shadow-sm' : 'border-parchment/50 bg-ivory/35 text-ink-soft hover:border-emerald/30 hover:bg-emerald/5'}`}
                      >
                        <div className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">{day.slice(0, 3)}</div>
                        <div className="mt-1 text-sm font-semibold">{isActive ? 'Available' : 'Unavailable'}</div>
                      </button>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </PageHeader>
  )

  // ─── ASSETS ───
  if (activeTab === 'assets') return (
    <PageHeader title="Verification & media" description="Upload verification documents, showcase your work, and manage class recordings.">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <SectionCard title="Verification documents">
            <div className="rounded-[24px] bg-gradient-to-r from-emerald/10 via-white to-gold/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald">Verification status</div>
                  <div className="mt-1 text-lg font-bold text-ink">{String(verificationStatus).charAt(0).toUpperCase() + String(verificationStatus).slice(1)}</div>
                </div>
                <StatusPill tone={getVerificationTone(verificationStatus)}>{verificationStatus}</StatusPill>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-bark">Upload all three document types to help the admin team verify your profile faster. PDF, JPG, JPEG, and PNG files are supported.</p>
            </div>
            <div className="mt-4 grid gap-3">
              {DOCUMENT_TYPES.map((docType) => (
                <label key={docType.id} className="flex cursor-pointer items-start gap-4 rounded-[24px] border border-dashed border-parchment bg-ivory/60 px-4 py-5 text-sm text-bark transition hover:border-emerald/30">
                  <Upload size={18} className="mt-0.5 text-emerald" />
                  <input type="file" className="hidden" accept=".pdf,image/*" onChange={e => e.target.files?.[0] && uploadDoc.mutate({ file: e.target.files[0], documentType: docType.id })} />
                  <div className="flex-1">
                    <div className="font-semibold text-ink">{docType.label}</div>
                    <div className="mt-1 text-xs leading-relaxed text-bark">{docType.helper}</div>
                  </div>
                  <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-emerald">{uploadDoc.isPending ? 'Uploading...' : 'Upload'}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 space-y-2">{documents.length === 0 ? <p className="text-sm text-bark">No documents uploaded yet.</p> : documents.map((d, i) => <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-parchment/50 bg-ivory/55 p-3"><div className="flex items-center gap-3"><FileText size={16} className="text-emerald" /><div><div className="text-sm font-semibold text-ink">{d.fileName || d.type || 'Document'}</div><div className="text-xs text-bark">{d.type || 'Document'} • {d.status || 'pending'}</div></div></div><div className="flex items-center gap-2"><StatusPill tone={getVerificationTone(d.status)}>{d.status || 'pending'}</StatusPill><a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald">View</a></div></div>)}</div>
          </SectionCard>
          <SectionCard title="Portfolio media">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-parchment bg-ivory/60 px-4 py-5 text-sm text-bark hover:border-emerald/30 transition"><ImagePlus size={18} className="text-emerald" /><input type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPortfolio.mutate({ file: f, mediaType: f.type.startsWith('video/') ? 'video' : 'image' }) }} /><span>{uploadPortfolio.isPending ? 'Uploading...' : 'Add image or video'}</span></label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{(teacher.portfolio_media || []).map(item => <div key={item.id} className="overflow-hidden rounded-2xl border border-parchment/50 bg-white">{item.type === 'image' ? <img src={item.url} alt="" className="h-32 w-full object-cover" /> : <div className="flex h-32 items-center justify-center bg-ink/90 text-white"><CirclePlay size={24} /></div>}<div className="flex items-center justify-between p-3"><StatusPill tone="teal">{item.type}</StatusPill><button onClick={() => removePortfolio.mutate(item.id)} className="text-sm font-semibold text-rose">Remove</button></div></div>)}</div>
          </SectionCard>
        </div>
        <SectionCard title="Upload recording">
          <div className="space-y-4">
            <div><label className="mb-2 block text-sm font-semibold text-ink-soft">Class</label><select value={recordingForm.sessionId} onChange={e => { const s = completedClasses.find(c => c.id === e.target.value); setRecordingForm(p => ({ ...p, sessionId: e.target.value, title: s ? `${s.courses?.title || 'Class'} – ${new Date(s.session_date).toLocaleDateString()}` : p.title })) }} className="w-full rounded-2xl border border-parchment/60 bg-ivory px-4 py-3 text-sm text-ink"><option value="">Select a completed class…</option>{completedClasses.map(s => <option key={s.id} value={s.id}>{s.courses?.title || 'Session'} — {s.students?.name || 'Student'} — {new Date(s.session_date).toLocaleDateString()}</option>)}</select>{completedClasses.length === 0 && <p className="mt-1 text-xs text-bark">No completed classes yet. Recordings can only be uploaded for finished classes.</p>}</div>
            <TextInput label="Title" value={recordingForm.title} onChange={e => setRecordingForm(p => ({ ...p, title: e.target.value }))} />
            <TextInput label="Description" as="textarea" rows="2" value={recordingForm.description} onChange={e => setRecordingForm(p => ({ ...p, description: e.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-2 block text-sm font-semibold text-ink-soft">Visibility</label><select value={recordingForm.visibility} onChange={e => setRecordingForm(p => ({ ...p, visibility: e.target.value }))} className="w-full rounded-2xl border border-parchment/60 bg-ivory px-4 py-3 text-sm text-ink"><option value="free">Free</option><option value="paid">Paid</option></select></div>
              <TextInput label="Duration (sec)" type="number" value={recordingForm.durationSeconds} onChange={e => setRecordingForm(p => ({ ...p, durationSeconds: e.target.value }))} />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-parchment bg-ivory/60 px-4 py-5 text-sm text-bark hover:border-emerald/30 transition"><CirclePlay size={18} className="text-emerald" /><input type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!recordingForm.sessionId) { toast.error('Please select a class first'); return }; if (f) uploadRecording.mutate({ file: f, payload: { sessionId: recordingForm.sessionId || null, title: recordingForm.title, description: recordingForm.description, visibility: recordingForm.visibility, durationSeconds: Number(recordingForm.durationSeconds || 0) } }) }} /><span>{uploadRecording.isPending ? 'Uploading...' : 'Select recording video'}</span></label>
          </div>
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── PAYOUTS ───
  if (activeTab === 'payouts') {
    const po = payoutQ.data || {}
    return (
      <PageHeader title="Payouts" description="Manage your Stripe payout account.">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <SectionCard title="Stripe Connect">
            <div className="mb-6 flex items-center justify-between"><span className="font-semibold text-ink">Status</span><StatusPill tone={po.payoutsEnabled ? 'emerald' : po.connected ? 'gold' : 'ink'}>{po.payoutsEnabled ? 'Ready' : po.connected ? 'Setup needed' : 'Not connected'}</StatusPill></div>
            <div className="space-y-3 mb-6">{[{ k: 'connected', l: 'Account created' }, { k: 'detailsSubmitted', l: 'Details submitted' }, { k: 'chargesEnabled', l: 'Charges enabled' }, { k: 'payoutsEnabled', l: 'Payouts enabled' }].map(i => <div key={i.k} className="flex items-center gap-3">{po[i.k] ? <CheckCircle2 size={18} className="text-emerald" /> : <Circle size={18} className="text-bark/40" />}<span className="text-sm font-medium text-ink">{i.l}</span></div>)}</div>
            {po.requirementsDue?.length > 0 && <div className="mb-4 flex items-start gap-2 rounded-2xl bg-gold/8 p-4"><AlertTriangle size={16} className="mt-0.5 text-gold" /><div><div className="text-sm font-semibold text-ink">Action required</div><div className="text-xs text-bark">{po.requirementsDue.join(', ')}</div></div></div>}
            <div className="flex flex-wrap gap-3"><ActionButton onClick={() => connectOnboarding.mutate()} disabled={connectOnboarding.isPending} icon={ExternalLink}>{po.connected ? 'Continue setup' : 'Connect Stripe'}</ActionButton>{po.connected && <button onClick={() => stripeDash.mutate()} disabled={stripeDash.isPending} className="rounded-2xl border border-parchment px-5 py-3 text-sm font-semibold text-ink-soft hover:border-emerald/30">Stripe Dashboard</button>}</div>
          </SectionCard>
          <SectionCard title="How it works">
            <div className="space-y-3 text-sm text-bark">
              <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4"><span className="font-semibold text-ink">Bookings</span> use your hourly/package rates.</div>
              <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4"><span className="font-semibold text-ink">Platform fee</span> is auto-deducted.</div>
              <div className="rounded-2xl border border-parchment/50 bg-ivory/55 p-4"><span className="font-semibold text-ink">Payouts</span> go to your bank on schedule.</div>
            </div>
          </SectionCard>
        </div>
      </PageHeader>
    )
  }

  // ─── PROFILE ───
  if (activeTab === 'profile') return (
    <PageHeader title="Profile" description="Edit your teaching profile.">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionCard title="Teacher profile">
          {profileQ.isLoading ? <div className="space-y-4"><SkeletonBlock className="h-28 w-full rounded-[24px]" /><SkeletonBlock className="h-14 w-full" /></div> : <>
            <div className="mb-6 flex items-center gap-4 rounded-[24px] bg-ivory/60 p-5">
              {teacher.avatar_url ? <img src={teacher.avatar_url} alt="" className="h-20 w-20 rounded-[24px] object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-emerald/10 text-3xl font-bold text-emerald">{(teacher.full_name || 'T')[0]}</div>}
              <div><div className="font-display text-2xl font-bold text-ink">{teacher.full_name}</div><div className="text-sm text-bark">{teacher.email}</div><div className="mt-2"><StatusPill tone={getVerificationTone(verificationStatus)}>{verificationStatus}</StatusPill></div></div>
            </div>
            <div className="mb-6 rounded-[24px] border border-parchment/50 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald">Profile completion</div>
                  <div className="mt-1 text-xl font-bold text-ink">{profileCompletion}% complete</div>
                </div>
                <StatusPill tone={profileCompletion >= 80 ? 'emerald' : profileCompletion >= 50 ? 'gold' : 'rose'}>{completedChecklistCount}/{profileChecklist.length} done</StatusPill>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-parchment/70">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald to-teal" style={{ width: `${profileCompletion}%` }} />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {profileChecklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-parchment/40 bg-ivory/45 px-4 py-3 text-sm text-ink">
                    {item.done ? <CheckCircle2 size={16} className="text-emerald" /> : <Circle size={16} className="text-bark/50" />}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); updateProfile.mutate({ full_name: profileForm.full_name, bio: profileForm.bio, hourly_rate: Number(profileForm.hourly_rate || 0), weekly_package_price: Number(profileForm.weekly_package_price || 0), monthly_package_price: Number(profileForm.monthly_package_price || 0), subjects: profileForm.subjects.split(',').map(s => s.trim()).filter(Boolean), languages: profileForm.languages.split(',').map(s => s.trim()).filter(Boolean), gender: profileForm.gender, timezone: profileForm.timezone, phone: profileForm.phone }) }}>
              <TextInput label="Full name" value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
              <TextInput label="Bio" as="textarea" rows="4" value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Hourly rate" type="number" value={profileForm.hourly_rate} onChange={e => setProfileForm(p => ({ ...p, hourly_rate: e.target.value }))} />
                <TextInput label="Weekly package" type="number" value={profileForm.weekly_package_price} onChange={e => setProfileForm(p => ({ ...p, weekly_package_price: e.target.value }))} />
                <TextInput label="Monthly package" type="number" value={profileForm.monthly_package_price} onChange={e => setProfileForm(p => ({ ...p, monthly_package_price: e.target.value }))} />
                <TextInput label="Timezone" value={profileForm.timezone} onChange={e => setProfileForm(p => ({ ...p, timezone: e.target.value }))} />
                <TextInput label="Subjects" value={profileForm.subjects} onChange={e => setProfileForm(p => ({ ...p, subjects: e.target.value }))} placeholder="Comma separated" />
                <TextInput label="Languages" value={profileForm.languages} onChange={e => setProfileForm(p => ({ ...p, languages: e.target.value }))} placeholder="Comma separated" />
                <TextInput label="Gender" value={profileForm.gender} onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))} />
                <TextInput label="Phone" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div><label className="mb-2 block text-sm font-semibold text-ink-soft">Profile image</label><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])} className={fileInputClass} /></div>
              <div className="flex flex-wrap gap-3">
                <ActionButton type="submit" icon={Save} disabled={updateProfile.isPending}>{updateProfile.isPending ? 'Saving...' : 'Save'}</ActionButton>
                {uploadAvatar.isPending && <StatusPill tone="gold">Uploading...</StatusPill>}
                {updateProfile.isSuccess && <StatusPill tone="emerald">Saved!</StatusPill>}
              </div>
            </form>
          </>}
        </SectionCard>
        <SectionCard title="Performance">
          <div className="mb-5 rounded-[24px] border border-parchment/50 bg-ivory/55 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald">Verification</div>
                <div className="mt-1 text-lg font-bold text-ink">Status: {verificationStatus}</div>
              </div>
              <StatusPill tone={getVerificationTone(verificationStatus)}>{verificationStatus}</StatusPill>
            </div>
            <p className="mt-2 text-sm text-bark">Use the Verification & Media tab to upload certificates and identity documents if your profile is still pending.</p>
          </div>
          <GridList cols="sm:grid-cols-2">
            <StatCard icon={Users} label="Students" value={stats.totalStudents || students.length} tone="gold" />
            <StatCard icon={Calendar} label="Completed" value={stats.completedClasses || 0} tone="emerald" />
            <StatCard icon={Star} label="Rating" value={Number(teacher.rating || 0).toFixed(1)} tone="teal" />
            <StatCard icon={BookOpen} label="Portfolio" value={(teacher.portfolio_media || []).length} tone="ink" />
          </GridList>
        </SectionCard>
      </div>
    </PageHeader>
  )

  // ─── MESSAGES ───
  if (activeTab === 'messages') return (
    <PageHeader title="Messages" description="Chat with students and parents.">
      <MessageCenter token={token} currentUserId={user?.id} />
    </PageHeader>
  )

  return null
}
