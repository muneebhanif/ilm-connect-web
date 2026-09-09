function createGeometricSvgDataUri(startColor, midColor, endColor, accentColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${startColor}" />
        <stop offset="50%" stop-color="${midColor}" />
        <stop offset="100%" stop-color="${endColor}" />
      </linearGradient>
      <pattern id="pat" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M24 6 L30 18 L42 24 L30 30 L24 42 L18 30 L6 24 L18 18 Z" fill="none" stroke="${accentColor}" stroke-width="1.2" />
        <rect x="15" y="15" width="18" height="18" fill="none" stroke="${accentColor}" stroke-width="0.8" transform="rotate(45 24 24)" />
        <circle cx="24" cy="24" r="3.5" fill="${accentColor}" fill-opacity="0.3" stroke="${accentColor}" stroke-width="0.8" />
      </pattern>
      <radialGradient id="glow" cx="85%" cy="20%" r="60%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25" />
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" />
    <rect width="100%" height="100%" fill="url(#glow)" />
    <rect width="100%" height="100%" fill="url(#pat)" opacity="0.25" />
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const SUBJECT_ART = {
  quran: createGeometricSvgDataUri('#064e3b', '#047857', '#0f766e', '#fbbf24'),
  tajweed: createGeometricSvgDataUri('#064e3b', '#059669', '#0d9488', '#f59e0b'),
  arabic: createGeometricSvgDataUri('#0c2461', '#1e3799', '#0a3d62', '#38bdf8'),
  islamic: createGeometricSvgDataUri('#3b0764', '#6b21a8', '#86198f', '#f472b6'),
  hifz: createGeometricSvgDataUri('#0f172a', '#1e293b', '#78350f', '#f59e0b'),
}

const API_URL = (import.meta.env.VITE_API_URL || 'https://backend-ilm.vercel.app').replace(/\/$/, '')

function pickSubjectArt(input = '') {
  const text = String(input).toLowerCase()
  if (text.includes('tajweed')) return SUBJECT_ART.tajweed
  if (text.includes('arabic')) return SUBJECT_ART.arabic
  if (text.includes('hifz') || text.includes('memor')) return SUBJECT_ART.hifz
  if (text.includes('quran')) return SUBJECT_ART.quran
  return SUBJECT_ART.islamic
}

export const api = {
  profile: (id) => `${API_URL}/api/profile/${id}`,
  teachers: () => `${API_URL}/api/teachers`,
  teacherById: (id) => `${API_URL}/api/teachers/${id}`,
  teacherProfile: (id) => `${API_URL}/api/teachers/${id}/profile`,
  courses: () => `${API_URL}/api/courses`,
  courseById: (id) => `${API_URL}/api/courses/${id}`,
  courseLessons: (id, teacherId) => `${API_URL}/api/courses/${id}/lessons?teacher_id=${encodeURIComponent(teacherId)}`,
  reviewsForTeacher: (id) => `${API_URL}/api/reviews/teacher/${id}`,
  health: () => `${API_URL}/api/health`,
  login: () => `${API_URL}/api/login`,
  signupParent: () => `${API_URL}/api/signup/parent`,
  signupTeacher: () => `${API_URL}/api/signup/teacher`,
  signupStudent: () => `${API_URL}/api/signup/student`,
  verifyEmail: () => `${API_URL}/api/verify-email`,
  resendVerification: () => `${API_URL}/api/resend-verification`,
  verifySession: () => `${API_URL}/api/verify-session`,
  refreshToken: () => `${API_URL}/api/refresh-token`,
  parentProfile: (id) => `${API_URL}/api/parent/${id}/profile`,
  updateParentProfile: (id) => `${API_URL}/api/parent/${id}/profile`,
  parentChildren: (id) => `${API_URL}/api/parent/${id}/children`,
  parentClasses: (id) => `${API_URL}/api/parent/${id}/classes`,
  childProfile: (id) => `${API_URL}/api/parent/child/${id}`,
  addChild: (id) => `${API_URL}/api/parent/${id}/children`,
  linkStudent: (id) => `${API_URL}/api/parent/${id}/link-student`,
  deleteChild: (pid, cid) => `${API_URL}/api/parent/${pid}/children/${cid}`,
  teacherSchedule: (id) => `${API_URL}/api/teachers/${id}/schedule`,
  teacherStudents: (id) => `${API_URL}/api/teachers/${id}/students`,
  teacherNotifications: (id) => `${API_URL}/api/teachers/${id}/notifications`,
  teacherMissedClasses: (id) => `${API_URL}/api/teachers/${id}/missed-classes`,
  teacherRescheduleSession: (teacherId, sessionId) => `${API_URL}/api/teachers/${teacherId}/sessions/${sessionId}/reschedule`,
  teacherCourses: (id) => `${API_URL}/api/courses/teacher/${id}`,
  updateTeacher: (id) => `${API_URL}/api/teachers/${id}`,
  teacherDocuments: (id) => `${API_URL}/api/upload/teacher/${id}/documents`,
  uploadTeacherDocument: (id) => `${API_URL}/api/upload/teacher/${id}/document`,
  replaceTeacherDocument: (id, docType) => `${API_URL}/api/upload/teacher/${id}/document/${encodeURIComponent(docType)}`,
  uploadCourseThumbnail: (teacherId, courseId) => `${API_URL}/api/upload/teacher/${teacherId}/course/${courseId}/thumbnail`,
  uploadTeacherPortfolioMedia: (id) => `${API_URL}/api/upload/teacher/${id}/portfolio-media`,
  deleteTeacherPortfolioMedia: (teacherId, mediaId) => `${API_URL}/api/upload/teacher/${teacherId}/portfolio-media/${mediaId}`,
  uploadClassRecording: (id) => `${API_URL}/api/upload/teacher/${id}/recording`,
  teacherRecordings: (id) => `${API_URL}/api/upload/teacher/${id}/recordings`,
  updateClassRecording: (teacherId, recordingId) => `${API_URL}/api/upload/teacher/${teacherId}/recording/${recordingId}`,
  deleteClassRecording: (teacherId, recordingId) => `${API_URL}/api/upload/teacher/${teacherId}/recording/${recordingId}`,
  studentProfile: (id) => `${API_URL}/api/student/${id}/profile`,
  studentClasses: (id) => `${API_URL}/api/student/${id}/classes`,
  studentRecordings: (id) => `${API_URL}/api/student/${id}/recordings`,
  recordingAccess: (id) => `${API_URL}/api/upload/recording/${id}/access`,
  bookings: () => `${API_URL}/api/bookings`,
  paymentCreateIntent: () => `${API_URL}/api/payments/create-intent`,
  paymentVerify: () => `${API_URL}/api/payments/verify`,
  classWindow: (id) => `${API_URL}/api/bookings/class-session/${id}/window`,
  startClass: (id) => `${API_URL}/api/bookings/class-session/${id}/start`,
  endClass: (id) => `${API_URL}/api/bookings/class-session/${id}/end`,
  conversations: () => `${API_URL}/api/messages/conversations`,
  conversation: (id) => `${API_URL}/api/messages/conversation/${id}`,
  sendMessage: () => `${API_URL}/api/messages/send`,
  markRead: (id) => `${API_URL}/api/messages/read/${id}`,
  unreadCount: () => `${API_URL}/api/messages/unread-count`,
  createReview: () => `${API_URL}/api/reviews`,
  forgotPassword: () => `${API_URL}/api/forgot-password`,
  agoraToken: (sessionId, userId, role, agoraUid) => `${API_URL}/api/agora?channel=${encodeURIComponent(sessionId)}&uid=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}${typeof agoraUid === 'number' ? `&agoraUid=${encodeURIComponent(String(agoraUid))}` : ''}`,
  classSession: (id) => `${API_URL}/api/bookings/class-session/${id}/window`,
  teacherConnectStatus: () => `${API_URL}/api/payments/teacher/connect-status`,
  teacherConnectOnboarding: () => `${API_URL}/api/payments/teacher/connect-onboarding`,
  teacherManualPayoutInfo: () => `${API_URL}/api/payments/teacher/manual-payout-info`,
  teacherDashboardLink: () => `${API_URL}/api/payments/teacher/dashboard-link`,
  uploadProfileImage: (id) => `${API_URL}/api/upload/${id}/profile-image`,
  createCourse: () => `${API_URL}/api/courses`,
  updateCourse: (id) => `${API_URL}/api/courses/${id}`,
  deleteCourse: (id) => `${API_URL}/api/courses/${id}`,
  createLesson: (courseId) => `${API_URL}/api/courses/${courseId}/lessons`,
  uploadLesson: (courseId) => `${API_URL}/api/courses/${courseId}/lessons/upload`,
  deleteLesson: (courseId, lessonId) => `${API_URL}/api/courses/${courseId}/lessons/${lessonId}`,
}

export function getCourseThumbnail(course = {}) {
  return course.thumbnail_url || pickSubjectArt(course.subject || course.title)
}

export function getTeacherCoverImage(teacher = {}) {
  if (teacher.cover_photo_url || teacher.cover_image || teacher.cover_url) {
    return teacher.cover_photo_url || teacher.cover_image || teacher.cover_url
  }
  const primarySubject = Array.isArray(teacher.subjects) && teacher.subjects.length > 0
    ? teacher.subjects[0]
    : teacher.subject || teacher.title
  return pickSubjectArt(primarySubject)
}

export function normalizeTeacher(teacher = {}) {
  const profile = teacher.profiles || {}
  return {
    ...teacher,
    full_name: teacher.full_name || profile.full_name || teacher.name || 'Teacher',
    email: teacher.email || profile.email || '',
    avatar_url: teacher.avatar_url || profile.avatar_url || '',
    review_count: teacher.review_count || 0,
    rating: Number(teacher.rating || teacher.average_rating || 0),
    languages: Array.isArray(teacher.languages) ? teacher.languages : [],
    subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
  }
}

export function normalizeTeacherProfileResponse(payload = {}, teacherId) {
  if (payload?.profile) {
    return {
      id: teacherId,
      ...payload.profile,
      stats: payload.stats || {},
      full_name: payload.profile.full_name || 'Teacher',
      avatar_url: payload.profile.avatar_url || '',
      rating: Number(payload.profile.rating || 0),
      review_count: payload.profile.review_count || 0,
    }
  }

  return normalizeTeacher(payload?.teacher || payload)
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const error = new Error(body?.error || `API Error: ${res.status}`)
    error.code = body?.code
    error.status = res.status
    throw error
  }
  return res.json()
}

export function authFetch(url, token, options = {}) {
  return apiFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
}
