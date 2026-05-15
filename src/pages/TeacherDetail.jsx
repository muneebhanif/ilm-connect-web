import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, apiFetch, getCourseThumbnail, normalizeTeacherProfileResponse } from '../lib/api'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star, CheckCircle, BookOpen, Clock, Globe, ArrowLeft,
  Calendar, Users, GraduationCap, ChevronLeft, ChevronRight,
  X, PlayCircle, Image as ImageIcon, Video, MessageSquare, DollarSign,
} from 'lucide-react'
import { useAuth } from '../lib/auth.jsx'
import { TeacherDetailSkeleton } from '../components/skeletons.jsx'

function StarRow({ rating, count, size = 16 }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-100'}
        />
      ))}
      <span className="text-sm text-gray-500 ml-1">{Number(rating).toFixed(1)} ({count} reviews)</span>
    </div>
  )
}

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
  const bio = teacher.bio || ''
  const hourlyRate = teacher.hourly_rate
  const avatar = teacher.avatar_url
  const stats = teacher.stats || {}
  const languages = teacher.languages || []
  const timezone = teacher.timezone || ''

  const portfolioMedia = useMemo(() => {
    const items = Array.isArray(teacher.portfolio_media) ? teacher.portfolio_media : []
    const videos = items.filter(item => item?.type === 'video')
    const images = items.filter(item => item?.type !== 'video')
    return [...videos, ...images]
  }, [teacher.portfolio_media])

  const activeViewerItem = portfolioMedia[viewerIndex] || null

  const openViewer = (index) => { setViewerIndex(index); setViewerOpen(true) }
  const goToPortfolioSlide = (index) => setPortfolioIndex((index + portfolioMedia.length) % portfolioMedia.length)
  const goToViewerSlide = (index) => setViewerIndex((index + portfolioMedia.length) % portfolioMedia.length)

  if (isLoading) return <TeacherDetailSkeleton />
  if (error) return (
    <div className="pt-20 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Failed to load teacher profile.</p>
        <Link to="/teachers" className="text-[#2e9e2e] font-semibold hover:underline flex items-center gap-2 justify-center">
          <ArrowLeft size={16} /> Back to Teachers
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f3f4f6] pt-16">

      {/* Hero Banner */}
      <section className="relative bg-[#2e9e2e] overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #4ed84e 0%, transparent 60%), radial-gradient(circle at 20% 80%, #0d480d 0%, transparent 50%)' }} />

        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 py-10 pb-12">
          <Link to="/teachers"
            className="inline-flex items-center gap-1.5 text-white/70 text-sm mb-8 hover:text-white transition-colors group">
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Teachers
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-7">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {avatar ? (
                <img src={avatar} alt={name}
                  className="w-28 h-28 rounded-2xl object-cover border-4 border-white/25 shadow-2xl" />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-white/15 border-4 border-white/25 flex items-center justify-center shadow-2xl">
                  <span className="font-bold text-5xl text-white">{name.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-3xl font-bold text-white tracking-tight">{name}</h1>
                <CheckCircle size={22} className="text-[#4de84d] flex-shrink-0" />
              </div>

              <StarRow rating={rating} count={reviews.length} />

              {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {subjects.map(s => (
                    <span key={s}
                      className="text-xs font-semibold text-white bg-white/15 border border-white/20 px-3 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {bio && (
                <p className="mt-4 text-white/80 text-sm leading-relaxed max-w-lg line-clamp-3">{bio}</p>
              )}
            </div>

            {/* Price card */}
            {hourlyRate && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0 bg-white/15 backdrop-blur border border-white/20 rounded-2xl px-8 py-6 text-center shadow-xl">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <DollarSign size={22} className="text-white" />
                </div>
                <div className="text-4xl font-bold text-white">${hourlyRate}</div>
                <div className="text-white/60 text-xs mt-1 font-medium">per hour</div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 space-y-6">

        {/* Row 1: About + Book sidebar */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* About card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#e2f5e2] flex items-center justify-center">
                <Users size={18} className="text-[#2e9e2e]" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">About</h2>
            </div>

            <p className="text-gray-600 leading-relaxed text-sm mb-6">
              {bio || 'This teacher hasn\'t added a bio yet.'}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-100 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e2f5e2] flex items-center justify-center">
                  <Users size={18} className="text-[#2e9e2e]" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg leading-none">{stats.totalStudents ? `${stats.totalStudents}+` : '0'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Students</div>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-100 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fff8e8] flex items-center justify-center">
                  <Calendar size={18} className="text-yellow-500" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg leading-none">{stats.yearsExperience ? `${stats.yearsExperience}+` : '3+'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Years Experience</div>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-100 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e8f0ff] flex items-center justify-center">
                  <GraduationCap size={18} className="text-blue-500" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg leading-none">{subjects.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Subjects</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Book a Class card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e2f5e2] flex items-center justify-center">
                <Calendar size={18} className="text-[#2e9e2e]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Book a Class</h2>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Schedule a class with {name.split(' ')[0]} and start your learning journey.
                </p>
              </div>
            </div>

            {user ? (
              <Link to={`/teachers/${id}/book`}
                className="flex items-center justify-between gap-2 w-full px-5 py-3.5 bg-[#2e9e2e] text-white font-semibold rounded-xl hover:bg-[#1e7a1e] transition-colors shadow-md shadow-green-200 text-sm">
                Book a Class
                <ArrowLeft size={16} className="rotate-180" />
              </Link>
            ) : (
              <Link to="/login"
                className="flex items-center justify-between gap-2 w-full px-5 py-3.5 bg-[#2e9e2e] text-white font-semibold rounded-xl hover:bg-[#1e7a1e] transition-colors shadow-md shadow-green-200 text-sm">
                Sign in to Book
                <ArrowLeft size={16} className="rotate-180" />
              </Link>
            )}

            <div className="space-y-3 border-t border-gray-100 pt-2">
              {languages.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Globe size={14} />
                    <span>Languages</span>
                  </div>
                  <span className="text-gray-800 font-medium text-xs">{languages.join(', ')}</span>
                </div>
              )}
              {timezone && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={14} />
                    <span>Time Zone</span>
                  </div>
                  <span className="text-gray-800 font-medium text-xs">{timezone}</span>
                </div>
              )}
              {subjects.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <BookOpen size={14} />
                    <span>Subjects</span>
                  </div>
                  <span className="text-gray-800 font-medium text-xs">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Row 2: Languages + Subjects + Reviews */}
        <div className="grid sm:grid-cols-3 gap-6">

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#e2f5e2] flex items-center justify-center">
                <Globe size={17} className="text-[#2e9e2e]" />
              </div>
              <h3 className="font-bold text-gray-900">Languages</h3>
            </div>
            {languages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <span key={lang} className="text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                    {lang}
                  </span>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">Not specified</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#e8f0ff] flex items-center justify-center">
                <BookOpen size={17} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-900">Subjects</h3>
            </div>
            {subjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => (
                  <span key={s} className="text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                    {s}
                  </span>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No subjects listed</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#fff8e8] flex items-center justify-center">
                  <Star size={17} className="text-yellow-400 fill-yellow-400" />
                </div>
                <h3 className="font-bold text-gray-900">Reviews</h3>
              </div>
              {reviews.length > 0 && (
                <span className="text-xs font-semibold text-[#2e9e2e] flex items-center gap-1 cursor-pointer hover:underline">
                  View all <ArrowLeft size={12} className="rotate-180" />
                </span>
              )}
            </div>
            <StarRow rating={rating} count={reviews.length} size={14} />
            {reviews.length === 0 ? (
              <p className="text-xs text-gray-400 mt-3">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="mt-3 space-y-2">
                {reviews.slice(0, 2).map((r, i) => (
                  <div key={r.id || i} className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                    <span className="font-semibold text-gray-800">{r.reviewer_name || 'Anonymous'}: </span>
                    {r.comment ? r.comment.slice(0, 80) + (r.comment.length > 80 ? '…' : '') : '—'}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Portfolio */}
        {portfolioMedia.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Portfolio</h2>
                <p className="text-xs text-gray-500 mt-0.5">Videos appear first. Click to open fullscreen viewer.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => goToPortfolioSlide(portfolioIndex - 1)}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:border-[#2e9e2e] hover:text-[#2e9e2e] transition-colors">
                  <ChevronLeft size={17} />
                </button>
                <button onClick={() => goToPortfolioSlide(portfolioIndex + 1)}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:border-[#2e9e2e] hover:text-[#2e9e2e] transition-colors">
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${portfolioIndex * 100}%)` }}>
                {portfolioMedia.map((item, index) => (
                  <button key={item.id || index} type="button" onClick={() => openViewer(index)}
                    className="relative min-w-full overflow-hidden text-left">
                    {item.type === 'video' ? (
                      <div className="relative flex h-80 items-center justify-center bg-gradient-to-br from-gray-900 via-[#0f2e0f] to-gray-900">
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                          <PlayCircle size={40} className="text-[#4de84d]" />
                        </div>
                        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                          <Video size={13} /> Video
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-80">
                        <img src={item.url} alt={`Portfolio ${index + 1}`} className="h-full w-full object-cover" />
                        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                          <ImageIcon size={13} /> Image
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-400">{portfolioIndex + 1} / {portfolioMedia.length}</span>
              <div className="flex gap-1.5">
                {portfolioMedia.map((_, index) => (
                  <button key={index} onClick={() => setPortfolioIndex(index)}
                    className={`h-2 rounded-full transition-all ${index === portfolioIndex ? 'w-6 bg-[#2e9e2e]' : 'w-2 bg-gray-200'}`} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Courses by {name.split(' ')[0]}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.slice(0, 4).map(course => (
                <div key={course.id} className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50 hover:border-[#2e9e2e]/30 transition-colors">
                  <img src={getCourseThumbnail(course)} alt={course.title} className="h-32 w-full object-cover" />
                  <div className="p-4">
                    <div className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">{course.title}</div>
                    <div className="text-xs text-gray-500 mb-3">{course.subject || 'General'}</div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2e9e2e] text-sm">{course.is_free ? 'Free' : `$${course.price || 0}`}</span>
                      <Link to="/courses" className="text-xs text-gray-400 hover:text-[#2e9e2e] transition-colors">Browse more</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Full Reviews */}
        {reviews.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <MessageSquare size={18} className="text-[#2e9e2e]" />
              All Reviews ({reviews.length})
            </h2>
            <div className="space-y-4">
              {reviews.slice(0, 10).map((r, i) => (
                <div key={r.id || i} className="pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-[#e2f5e2] flex items-center justify-center text-xs font-bold text-[#2e9e2e]">
                      {(r.reviewer_name || 'A').charAt(0)}
                    </div>
                    <span className="font-semibold text-sm text-gray-900">{r.reviewer_name || 'Anonymous'}</span>
                    <div className="flex gap-0.5 ml-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} className={s <= (r.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-100'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-500 pl-9">{r.comment}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="h-8" />
      </div>

      {/* Fullscreen Viewer */}
      {viewerOpen && activeViewerItem && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <button onClick={() => setViewerOpen(false)}
            className="absolute right-5 top-5 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
            <X size={22} />
          </button>
          {portfolioMedia.length > 1 && <>
            <button onClick={() => goToViewerSlide(viewerIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
              <ChevronLeft size={22} />
            </button>
            <button onClick={() => goToViewerSlide(viewerIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
              <ChevronRight size={22} />
            </button>
          </>}
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            {activeViewerItem.type === 'video' ? (
              <video key={activeViewerItem.id || viewerIndex} src={activeViewerItem.url}
                controls playsInline autoPlay className="max-h-[80vh] w-full bg-black" />
            ) : (
              <img src={activeViewerItem.url} alt={`Portfolio ${viewerIndex + 1}`}
                className="max-h-[80vh] w-full object-contain bg-black" />
            )}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              {viewerIndex + 1} / {portfolioMedia.length}
            </div>
            {portfolioMedia.length > 1 && (
              <div className="flex gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur">
                {portfolioMedia.map((_, index) => (
                  <button key={index} onClick={() => setViewerIndex(index)}
                    className={`h-2 rounded-full transition-all ${index === viewerIndex ? 'w-6 bg-[#4de84d]' : 'w-2 bg-white/40'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
