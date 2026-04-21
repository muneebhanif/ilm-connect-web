import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, apiFetch, getCourseThumbnail, normalizeTeacherProfileResponse } from '../lib/api'
import { teacherSpotlightArt } from '../lib/artwork'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, CheckCircle, BookOpen, Clock, MapPin, ArrowLeft, MessageCircle, Calendar, Users, GraduationCap, ChevronLeft, ChevronRight, X, PlayCircle, Image as ImageIcon, Video } from 'lucide-react'
import { useAuth } from '../lib/auth.jsx'
import { TeacherDetailSkeleton } from '../components/skeletons.jsx'

export default function TeacherDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [portfolioIndex, setPortfolioIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => apiFetch(api.teacherProfile(id)),
    enabled: !!id,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => apiFetch(api.reviewsForTeacher(id)),
    enabled: !!id,
  })

  const { data: coursesData } = useQuery({
    queryKey: ['teacherCoursesPublic', id],
    queryFn: () => apiFetch(api.teacherCourses(id)),
    enabled: !!id,
  })

  const teacher = normalizeTeacherProfileResponse(data, id)
  const reviews = teacher.reviews || reviewsData?.reviews || reviewsData || []
  const courses = coursesData?.courses || coursesData || []
  const name = teacher.full_name || teacher.name || 'Teacher'
  const rating = teacher.average_rating || teacher.rating || 0
  const subjects = teacher.subjects || []
  const bio = teacher.bio || 'This teacher hasn\'t added a bio yet.'
  const hourlyRate = teacher.hourly_rate
  const avatar = teacher.avatar_url
  const stats = teacher.stats || {}
  const portfolioMedia = useMemo(() => {
    const items = Array.isArray(teacher.portfolio_media) ? teacher.portfolio_media : []
    const videos = items.filter((item) => item?.type === 'video')
    const images = items.filter((item) => item?.type !== 'video')
    return [...videos, ...images]
  }, [teacher.portfolio_media])

  const activePortfolioItem = portfolioMedia[portfolioIndex] || null
  const activeViewerItem = portfolioMedia[viewerIndex] || null

  const openViewer = (index) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const goToPortfolioSlide = (index) => {
    if (!portfolioMedia.length) return
    const next = (index + portfolioMedia.length) % portfolioMedia.length
    setPortfolioIndex(next)
  }

  const goToViewerSlide = (index) => {
    if (!portfolioMedia.length) return
    const next = (index + portfolioMedia.length) % portfolioMedia.length
    setViewerIndex(next)
  }

  if (isLoading) return <TeacherDetailSkeleton />
  if (error) return (
    <div className="pt-18 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-bark mb-4">Failed to load teacher profile.</p>
        <Link to="/teachers" className="text-emerald font-semibold hover:underline flex items-center gap-2 justify-center"><ArrowLeft size={16} /> Back to Teachers</Link>
      </div>
    </div>
  )

  return (
    <div className="relative overflow-hidden pt-18">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-pale/25 via-ivory to-ivory" />
      <div className="relative">
      {/* Header */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-deep via-emerald to-emerald-deep" />
        <img src={teacherSpotlightArt} alt="Teacher illustration" className="absolute right-0 top-0 hidden h-full w-[28rem] object-contain opacity-25 lg:block" />
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
          <Link to="/teachers" className="inline-flex items-center gap-2 text-parchment/70 text-sm mb-8 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Teachers
          </Link>
          <div className="flex flex-col md:flex-row items-start gap-6">
            {avatar ? (
              <img src={avatar} alt={name} className="w-24 h-24 rounded-2xl object-cover border-3 border-white/20 shadow-xl" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/10 border-3 border-white/20 flex items-center justify-center">
                <span className="font-display font-bold text-4xl text-white">{name.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold text-white">{name}</h1>
                <CheckCircle size={22} className="text-teal" />
              </div>
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className={i <= Math.round(rating) ? 'text-gold fill-gold' : 'text-white/20'} />)}
                <span className="text-parchment/80 text-sm ml-2">{rating.toFixed(1)} ({reviews.length} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => (
                  <span key={s} className="text-xs font-semibold text-white bg-white/10 px-3 py-1 rounded-lg">{s}</span>
                ))}
              </div>
            </div>
            {hourlyRate ? (
              <div className="bg-white/10 backdrop-blur rounded-2xl px-6 py-4 text-center border border-white/10">
                <div className="font-display font-bold text-3xl text-white">${hourlyRate}</div>
                <div className="text-parchment/60 text-xs">per hour</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-2xl p-6 border border-parchment/50">
              <h2 className="font-display font-bold text-xl text-ink mb-4">About</h2>
              <p className="text-ink-soft leading-relaxed">{bio}</p>
            </div>

            {portfolioMedia.length > 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-parchment/50">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display font-bold text-xl text-ink">Portfolio</h2>
                    <p className="mt-1 text-sm text-bark">Videos appear first. Use the arrows or dots to slide through the gallery.</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <button onClick={() => goToPortfolioSlide(portfolioIndex - 1)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-parchment/60 bg-ivory text-ink-soft transition hover:border-emerald/30 hover:text-emerald">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => goToPortfolioSlide(portfolioIndex + 1)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-parchment/60 bg-ivory text-ink-soft transition hover:border-emerald/30 hover:text-emerald">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-parchment/60 bg-ivory/50">
                  <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${portfolioIndex * 100}%)` }}>
                    {portfolioMedia.map((item, index) => (
                      <button
                        key={item.id || index}
                        type="button"
                        onClick={() => openViewer(index)}
                        className="relative min-w-full overflow-hidden text-left"
                      >
                        {item.type === 'video' ? (
                          <div className="relative flex h-[360px] items-center justify-center bg-gradient-to-br from-ink via-emerald-deep to-ink">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,234,212,0.22),transparent_45%)]" />
                            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                              <PlayCircle size={44} className="text-teal" />
                            </div>
                            <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                              <Video size={16} /> Video
                            </div>
                            <div className="absolute bottom-5 right-5 rounded-full bg-white/12 px-4 py-2 text-sm text-white/90 backdrop-blur">
                              Click to open viewer
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-[360px] bg-ink/5">
                            <img src={item.url} alt={`${name} portfolio ${index + 1}`} className="h-full w-full object-cover" />
                            <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                              <ImageIcon size={16} /> Image
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-ivory px-4 py-2 text-sm text-bark">
                    <span className="font-semibold text-ink">{portfolioIndex + 1}</span>
                    <span>/</span>
                    <span>{portfolioMedia.length}</span>
                    <span>•</span>
                    <span className="capitalize">{activePortfolioItem?.type || 'media'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {portfolioMedia.map((item, index) => (
                      <button
                        key={`dot-${item.id || index}`}
                        type="button"
                        aria-label={`Open portfolio item ${index + 1}`}
                        onClick={() => setPortfolioIndex(index)}
                        className={`h-2.5 rounded-full transition-all ${index === portfolioIndex ? 'w-8 bg-emerald' : 'w-2.5 bg-parchment'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-parchment/50">
                <Users size={18} className="text-emerald mb-3" />
                <div className="font-display text-2xl font-bold text-ink">{stats.totalStudents || 0}</div>
                <div className="text-sm text-bark">Students taught</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-parchment/50">
                <Calendar size={18} className="text-gold mb-3" />
                <div className="font-display text-2xl font-bold text-ink">{stats.upcomingClasses || 0}</div>
                <div className="text-sm text-bark">Upcoming classes</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-parchment/50">
                <GraduationCap size={18} className="text-teal mb-3" />
                <div className="font-display text-2xl font-bold text-ink">{courses.length}</div>
                <div className="text-sm text-bark">Published courses</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-parchment/50">
              <h2 className="font-display font-bold text-xl text-ink mb-4">Courses by {name}</h2>
              {courses.length === 0 ? (
                <p className="text-bark text-sm">No public courses yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {courses.slice(0, 4).map((course) => (
                    <div key={course.id} className="overflow-hidden rounded-2xl border border-parchment/50 bg-ivory">
                      <img src={getCourseThumbnail(course)} alt={course.title} className="h-32 w-full object-cover" />
                      <div className="p-4">
                        <div className="mb-1 line-clamp-1 font-semibold text-ink">{course.title}</div>
                        <div className="mb-3 text-xs text-bark">{course.subject || 'General'}</div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-emerald">{course.is_free ? 'Free' : `$${course.price || 0}`}</span>
                          <Link to="/courses" className="font-medium text-ink-soft hover:text-emerald">Browse more</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6 border border-parchment/50">
              <h2 className="font-display font-bold text-xl text-ink mb-4 flex items-center gap-2">
                <MessageCircle size={20} className="text-emerald" /> Reviews ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <p className="text-bark text-sm">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 10).map((r, i) => (
                    <div key={r.id || i} className="pb-4 border-b border-parchment/30 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-ink">{r.reviewer_name || 'Anonymous'}</span>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= (r.rating || 0) ? 'text-gold fill-gold' : 'text-parchment'} />)}</div>
                      </div>
                      {r.comment && <p className="text-bark text-sm">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-parchment/50 space-y-4">
              {user ? (
                <Link to={`/teachers/${id}/book`}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald text-white font-semibold rounded-xl hover:bg-emerald-deep transition-colors shadow-lg shadow-emerald/20">
                  <Calendar size={18} /> Book a Class
                </Link>
              ) : (
                <Link to="/login"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald text-white font-semibold rounded-xl hover:bg-emerald-deep transition-colors shadow-lg shadow-emerald/20">
                  <Calendar size={18} /> Sign in to Book
                </Link>
              )}
              <div className="pt-4 border-t border-parchment/30 space-y-3 text-sm">
                {teacher.languages?.length > 0 && (
                  <div className="flex items-start gap-2"><MapPin size={16} className="text-bark mt-0.5 flex-shrink-0" /><span className="text-ink-soft">Languages: {teacher.languages.join(', ')}</span></div>
                )}
                {teacher.timezone && (
                  <div className="flex items-start gap-2"><Clock size={16} className="text-bark mt-0.5 flex-shrink-0" /><span className="text-ink-soft">{teacher.timezone}</span></div>
                )}
                <div className="flex items-start gap-2"><BookOpen size={16} className="text-bark mt-0.5 flex-shrink-0" /><span className="text-ink-soft">{subjects.length} subject{subjects.length !== 1 && 's'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {viewerOpen && activeViewerItem ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setViewerOpen(false)}
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={22} />
          </button>

          {portfolioMedia.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => goToViewerSlide(viewerIndex - 1)}
                className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:inline-flex"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => goToViewerSlide(viewerIndex + 1)}
                className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:inline-flex"
              >
                <ChevronRight size={22} />
              </button>
            </>
          ) : null}

          <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-2xl">
            {activeViewerItem.type === 'video' ? (
              <video
                key={activeViewerItem.id || viewerIndex}
                src={activeViewerItem.url}
                controls
                playsInline
                autoPlay
                className="max-h-[78vh] w-full bg-black"
              />
            ) : (
              <img
                src={activeViewerItem.url}
                alt={`${name} portfolio ${viewerIndex + 1}`}
                className="max-h-[78vh] w-full object-contain bg-black"
              />
            )}
          </div>

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              {viewerIndex + 1} / {portfolioMedia.length} • <span className="capitalize">{activeViewerItem.type}</span>
            </div>
            {portfolioMedia.length > 1 ? (
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur">
                {portfolioMedia.map((item, index) => (
                  <button
                    key={`viewer-dot-${item.id || index}`}
                    type="button"
                    onClick={() => setViewerIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${index === viewerIndex ? 'w-8 bg-teal' : 'w-2.5 bg-white/40'}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      </div>
    </div>
  )
}
