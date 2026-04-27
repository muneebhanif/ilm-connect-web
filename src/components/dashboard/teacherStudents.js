export const ATTENDANCE_STATUS_OPTIONS = [
	{ id: 'present', label: 'Present', tone: 'emerald' },
	{ id: 'late', label: 'Late', tone: 'gold' },
	{ id: 'absent', label: 'Absent', tone: 'rose' },
	{ id: 'excused', label: 'Excused', tone: 'teal' },
]

export function formatCompactDateLabel(value) {
	const parsed = new Date(value || '')
	if (Number.isNaN(parsed.getTime())) return 'Not scheduled'
	return parsed.toLocaleString([], {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

export function getStudentId(student = {}, fallback = '') {
	return student.id || student.student_id || student.user_id || student.profile_id || fallback
}

export function getStudentName(student = {}, fallback = 'Student') {
	return student.name || student.full_name || student.student_name || student.students?.name || fallback
}

export function getStudentEmail(student = {}) {
	return student.email || student.student_email || student.students?.email || student.profile?.email || ''
}

export function getStudentPhone(student = {}) {
	return student.phone || student.student_phone || student.students?.phone || student.profile?.phone || ''
}

export function getStudentGuardianName(student = {}) {
	return student.guardian_name || student.parent_name || student.guardian?.name || student.parent?.full_name || ''
}

export function getStudentAttendancePercentage(student = {}) {
	const raw = student.attendance_summary?.percentage ?? student.attendance_percentage ?? student.attendancePercent ?? 0
	const numeric = Number.parseFloat(String(raw).replace(/[^\d.]/g, ''))
	return Number.isFinite(numeric) ? numeric : 0
}

export function formatStudentAttendance(student = {}) {
	if (student.attendance) return student.attendance
	const percentage = getStudentAttendancePercentage(student)
	const summary = student.attendance_summary || {}
	const present = Number(summary.present ?? summary.present_count ?? summary.attended ?? 0)
	const total = Number(summary.total ?? summary.total_classes ?? summary.total_sessions ?? summary.booked ?? 0)
	if (total > 0) return `${Math.round(percentage)}% (${present}/${total})`
	if (percentage > 0) return `${Math.round(percentage)}%`
	return 'Not tracked yet'
}

export function getAttendanceToneFromPercentage(percentage = 0) {
	if (percentage >= 75) return 'emerald'
	if (percentage >= 50) return 'gold'
	return 'rose'
}

export function getAttendanceStatusTone(status = 'unmarked') {
	const option = ATTENDANCE_STATUS_OPTIONS.find((item) => item.id === status)
	if (option) return option.tone
	return 'ink'
}

export function getAttendanceStatusLabel(status = 'unmarked') {
	const option = ATTENDANCE_STATUS_OPTIONS.find((item) => item.id === status)
	if (option) return option.label
	return 'Unmarked'
}

export function buildAttendanceEntryKey(sessionId, studentId, fallback = '') {
	const safeStudentId = studentId || fallback || 'unknown'
	return sessionId ? `session:${sessionId}:student:${safeStudentId}` : `student:${safeStudentId}`
}

function normalizeLegacyAttendanceKey(key) {
	if (String(key).startsWith('session:') || String(key).startsWith('student:')) return key
	return buildAttendanceEntryKey(null, key)
}

export function readStudentManagerState(storageKey) {
	if (typeof window === 'undefined') return { attendance: {}, notes: {} }
	try {
		const raw = window.localStorage.getItem(storageKey)
		if (!raw) return { attendance: {}, notes: {} }
		const parsed = JSON.parse(raw)
		const attendance = parsed?.attendance && typeof parsed.attendance === 'object' ? parsed.attendance : {}
		const normalizedAttendance = Object.entries(attendance).reduce((acc, [key, value]) => {
			acc[normalizeLegacyAttendanceKey(key)] = value
			return acc
		}, {})

		return {
			attendance: normalizedAttendance,
			notes: parsed?.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
		}
	} catch {
		return { attendance: {}, notes: {} }
	}
}

export function isToday(value) {
	const parsed = new Date(value || '')
	if (Number.isNaN(parsed.getTime())) return false
	const now = new Date()
	return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth() && parsed.getDate() === now.getDate()
}

function getLatestAttendanceStatus(studentId, attendanceState = {}) {
	const exactStudentKey = buildAttendanceEntryKey(null, studentId)
	const relatedEntries = Object.entries(attendanceState)
		.filter(([key]) => key === exactStudentKey || key.endsWith(`student:${studentId}`))
		.map(([, value]) => value)
		.filter(Boolean)

	if (relatedEntries.length === 0) return 'unmarked'

	return relatedEntries
		.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0]?.status || 'unmarked'
}

export function getSessionTimeValue(value) {
	const parsed = new Date(value || '').getTime()
	return Number.isFinite(parsed) ? parsed : 0
}

export function getSessionEndTimeValue(session = {}) {
	const startsAt = getSessionTimeValue(session.session_date)
	if (!startsAt) return 0
	return startsAt + Number(session.duration_minutes || 60) * 60 * 1000
}

export function formatSessionDateLabel(value) {
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

export function normalizeStudentRecord(student = {}, schedule = [], attendanceState = {}, fallbackIndex = 0) {
	const id = String(getStudentId(student, `student-${fallbackIndex}`))
	const name = getStudentName(student)
	const matchingSessions = schedule.filter((session) => {
		const sessionStudentId = String(getStudentId(session.students || {}, session.student_id || ''))
		const sessionStudentName = getStudentName(session.students || {}, '')
		return sessionStudentId === id || (sessionStudentName && sessionStudentName.toLowerCase() === name.toLowerCase())
	})
	const nextSession = matchingSessions
		.filter((session) => {
			const status = String(session.status || '').toLowerCase()
			return status !== 'completed' && status !== 'cancelled' && getSessionEndTimeValue(session) >= Date.now()
		})
		.sort((a, b) => getSessionTimeValue(a.session_date) - getSessionTimeValue(b.session_date))[0]
	const attendancePercentage = getStudentAttendancePercentage(student)
	const latestStatus = getLatestAttendanceStatus(id, attendanceState)

	return {
		...student,
		id,
		name,
		email: getStudentEmail(student),
		phone: getStudentPhone(student),
		guardianName: getStudentGuardianName(student),
		course: student.course || student.course_title || student.current_course || nextSession?.courses?.title || 'Course pending',
		nextClass: student.nextClass || (nextSession ? formatSessionDateLabel(nextSession.session_date) : 'Not scheduled'),
		attendancePercentage,
		attendanceLabel: formatStudentAttendance(student),
		attendanceTone: getAttendanceToneFromPercentage(attendancePercentage),
		latestStatus,
		latestStatusLabel: getAttendanceStatusLabel(latestStatus),
		latestStatusTone: getAttendanceStatusTone(latestStatus),
		upcomingSessions: matchingSessions.filter((session) => getSessionEndTimeValue(session) >= Date.now()).length,
	}
}
