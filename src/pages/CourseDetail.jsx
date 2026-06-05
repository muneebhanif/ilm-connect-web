import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, Clock3, Lock, Play, School, Star, UserRound, Users } from 'lucide-react'
import { api, apiFetch, getCourseThumbnail } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import { PublicCardsSkeleton } from '../components/skeletons.jsx'

function formatDuration(seconds) {
  const value = Number(seconds || 0)
  if (!value) return ''
  return `${Math.max(1, Math.round(value / 60))} min`
}

export default function CourseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data, isLoading, error } = useQuery({
    queryKey: ['courseDetail', id],
    queryFn: () => apiFetch(api.courseById(id)),
    enabled: !!id,
  })

  const course = data?.course || data
  const title = course?.title || 'Course'
  const subject = course?.subject || 'General'
  const teacherId = course?.teacher_id || course?.profiles?.id
  const teacherName = course?.teacher_name || course?.profiles?.full_name || 'Instructor'
  const teacherAvatar = course?.profiles?.avatar_url
  const lessonCount = course?.lesson_count || course?.lessons_count || course?.total_lessons || 0
  const previewLessons = Array.isArray(course?.preview_lessons) ? course.preview_lessons : []
  const thumbnail = course ? getCourseThumbnail(course) : ''
  const bookingQuery = new URLSearchParams({
    courseId: course?.id || '',
    subject,
    courseTitle: title,
  }).toString()
  const parentBookingPath = teacherId ? `/teachers/${teacherId}/book?${bookingQuery}` : '/teachers'
  const primaryPath = !user ? '/login' : user.role === 'parent' ? parentBookingPath : '/dashboard'
  const primaryLabel = !user ? 'Sign in to Enroll' : user.role === 'parent' ? 'Enroll in Course' : 'Open Dashboard'

  if (isLoading) {
    return (
      <div className="pt-24">
        <section className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
          <PublicCardsSkeleton count={3} imageHeight="h-56" />
        </section>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-ivory pt-24">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose/10 text-rose">
            <AlertCircle size={28} />
          </div>
          <h1 className="font-display text-3xl font-black text-ink">Course not found</h1>
          <p className="mt-2 text-sm text-bark">{error?.message || 'This course is not available right now.'}</p>
          <Link to="/courses" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald px-5 py-3 text-sm font-bold text-white hover:bg-emerald/90">
            <ArrowLeft size={16} />
            Back to courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-ivory pt-18">
      <section className="relative">
        <div className="absolute inset-0">
          <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/84 to-ink-soft/62" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <Link to="/courses" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-sand hover:text-white">
            <ArrowLeft size={16} />
            Back to courses
          </Link>
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-3">
              <span className="rounded-xl bg-emerald px-3 py-1 text-xs font-black uppercase tracking-wide text-white">{subject}</span>
              <span className="rounded-xl bg-white/92 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald">{course.is_free ? 'Free' : `$${course.price || 0}`}</span>
            </div>
            <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl">{title}</h1>
            {course.description ? <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-sand">{course.description}</p> : null}
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur">
                <BookOpen size={18} className="mb-2 text-emerald-pale" />
                <div className="font-display text-2xl font-black">{lessonCount}</div>
                <div className="text-xs font-semibold text-sand">Lessons</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur">
                <Users size={18} className="mb-2 text-teal" />
                <div className="font-display text-2xl font-black">Live</div>
                <div className="text-xs font-semibold text-sand">Support</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur">
                <Star size={18} className="mb-2 text-gold" />
                <div className="font-display text-2xl font-black capitalize">{course.level || 'Beginner'}</div>
                <div className="text-xs font-semibold text-sand">Level</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-parchment bg-white p-6">
            <h2 className="font-display text-2xl font-black text-ink">About this course</h2>
            <p className="mt-3 leading-7 text-bark">{course.description || 'This course is prepared by the instructor and published for student enrollment.'}</p>
          </div>

          <div className="rounded-2xl border-2 border-parchment bg-white p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-black text-ink">Preview lessons</h2>
              <span className="rounded-xl bg-ivory px-3 py-1 text-xs font-bold text-bark">{previewLessons.length} item{previewLessons.length === 1 ? '' : 's'}</span>
            </div>
            {previewLessons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-parchment bg-ivory/60 p-5 text-sm text-bark">
                Preview lessons will appear after the instructor marks lessons as preview.
              </div>
            ) : (
              <div className="divide-y divide-parchment/60">
                {previewLessons.map((lesson, index) => (
                  <div key={lesson.id || index} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${lesson.is_preview ? 'bg-emerald text-white' : 'bg-ivory text-bark'}`}>
                      {lesson.is_preview ? <Play size={17} /> : <Lock size={17} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-ink">{lesson.title || `Lesson ${index + 1}`}</div>
                      {lesson.description ? <div className="mt-1 line-clamp-2 text-sm text-bark">{lesson.description}</div> : null}
                      {lesson.duration_seconds ? <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-bark"><Clock3 size={12} /> {formatDuration(lesson.duration_seconds)}</div> : null}
                    </div>
                    {lesson.is_preview && lesson.content_url ? (
                      <a href={lesson.content_url} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald/10 px-4 py-2 text-sm font-bold text-emerald hover:bg-emerald hover:text-white">
                        Preview
                      </a>
                    ) : (
                      <span className="rounded-xl bg-ivory px-4 py-2 text-sm font-bold text-bark">Locked</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border-2 border-parchment bg-white p-6 shadow-[0_14px_40px_-18px_rgba(20,24,35,0.24)]">
            <div className="mb-5 flex items-center gap-4">
              {teacherAvatar ? (
                <img src={teacherAvatar} alt={teacherName} className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
                  <UserRound size={22} />
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate font-display text-xl font-black text-ink">{teacherName}</div>
                <div className="text-sm font-semibold text-bark">Instructor</div>
              </div>
            </div>
            <Link to={primaryPath} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald/20 hover:bg-emerald/90">
              {primaryLabel}
              <ArrowRight size={16} />
            </Link>
            {teacherId ? (
              <Link to={`/teachers/${teacherId}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-parchment bg-ivory px-5 py-3 text-sm font-bold text-ink-soft hover:border-emerald/30 hover:text-emerald">
                View instructor
              </Link>
            ) : null}
          </div>

          <div className="rounded-2xl border-2 border-parchment bg-white p-6">
            <div className="mb-4 flex items-center gap-2 font-display text-xl font-black text-ink">
              <School size={20} className="text-emerald" />
              Course access
            </div>
            <div className="space-y-3 text-sm text-bark">
              <div className="flex items-start gap-2"><BookOpen size={16} className="mt-0.5 text-emerald" /> Published instructor content and marked preview lessons.</div>
              <div className="flex items-start gap-2"><Users size={16} className="mt-0.5 text-emerald" /> Enrollment continues through the class booking flow.</div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
