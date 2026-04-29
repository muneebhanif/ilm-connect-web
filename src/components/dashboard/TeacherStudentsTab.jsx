import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Calendar, CheckCircle2, Users, Search, Filter, ChevronRight, Mail, Phone, User, BookOpen, Clock, StickyNote } from 'lucide-react'
import { ActionButton, EmptyState, GridList, SectionCard, StatCard, StatusPill, TextInput } from '../dashboard-ui.jsx'
import { SectionRowsSkeleton } from '../skeletons.jsx'
import {
  ATTENDANCE_STATUS_OPTIONS,
  buildAttendanceEntryKey,
  formatCompactDateLabel,
  getAttendanceStatusLabel,
  getAttendanceStatusTone,
  getStudentId,
  getStudentName,
  isToday,
  normalizeStudentRecord,
  readStudentManagerState,
} from './teacherStudents.js'

export default function TeacherStudentsTab({
  userId,
  students = [],
  schedule = [],
  studentsLoading = false,
  scheduleLoading = false,
  onOpenMessages,
  onOpenSchedule,
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentFilter, setStudentFilter] = useState('all')
  const [studentAttendanceState, setStudentAttendanceState] = useState({})
  const [studentNotes, setStudentNotes] = useState({})
  const [studentStateHydrated, setStudentStateHydrated] = useState(false)

  const studentStorageKey = `ilm-teacher-students:${userId || 'anonymous'}`

  const studentDirectory = useMemo(
    () => students.map((student, index) => normalizeStudentRecord(student, schedule, studentAttendanceState, index)),
    [students, schedule, studentAttendanceState],
  )

  const todayAttendanceRows = useMemo(() => {
    const todaysSessions = schedule.filter((session) => {
      const status = String(session.status || '').toLowerCase()
      return status !== 'cancelled' && isToday(session.session_date)
    })

    if (todaysSessions.length > 0) {
      return todaysSessions.map((session, index) => {
        const sessionStudentId = String(getStudentId(session.students || {}, session.student_id || `session-student-${index}`))
        const matchedStudent = studentDirectory.find((student) => {
          const sameId = student.id === sessionStudentId
          const sameName = student.name.toLowerCase() === getStudentName(session.students || {}, '').toLowerCase()
          return sameId || sameName
        })
        const studentId = matchedStudent?.id || sessionStudentId
        const attendanceKey = buildAttendanceEntryKey(session.id, studentId, `session-student-${index}`)
        const status = studentAttendanceState?.[attendanceKey]?.status || 'unmarked'

        return {
          key: `${session.id || index}-${studentId}`,
          sessionId: session.id,
          studentId,
          attendanceKey,
          studentName: matchedStudent?.name || getStudentName(session.students || {}, 'Student'),
          courseTitle: session.courses?.title || matchedStudent?.course || 'Course pending',
          sessionLabel: formatCompactDateLabel(session.session_date),
          durationMinutes: session.duration_minutes || 60,
          status,
        }
      })
    }

    return studentDirectory.slice(0, 8).map((student) => {
      const attendanceKey = buildAttendanceEntryKey(null, student.id)
      return {
        key: student.id,
        sessionId: null,
        studentId: student.id,
        attendanceKey,
        studentName: student.name,
        courseTitle: student.course,
        sessionLabel: student.nextClass,
        durationMinutes: null,
        status: studentAttendanceState?.[attendanceKey]?.status || student.latestStatus,
      }
    })
  }, [schedule, studentAttendanceState, studentDirectory])

  const studentsNeedingAttention = useMemo(
    () => studentDirectory.filter((student) => student.attendancePercentage < 75 || student.latestStatus === 'absent' || student.latestStatus === 'late'),
    [studentDirectory],
  )

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()
    return studentDirectory.filter((student) => {
      const matchesQuery = !query || [student.name, student.course, student.email, student.guardianName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))

      const matchesFilter =
        studentFilter === 'all'
        || (studentFilter === 'needs-attention' && (student.attendancePercentage < 75 || student.latestStatus === 'absent' || student.latestStatus === 'late'))
        || (studentFilter === 'unmarked' && student.latestStatus === 'unmarked')
        || student.latestStatus === studentFilter

      return matchesQuery && matchesFilter
    })
  }, [studentDirectory, studentFilter, studentSearch])

  const selectedStudent = studentDirectory.find((student) => student.id === selectedStudentId) || filteredStudents[0] || studentDirectory[0] || null
  const markedAttendanceCount = todayAttendanceRows.filter((row) => row.status !== 'unmarked').length
  const absentTodayCount = todayAttendanceRows.filter((row) => row.status === 'absent').length
  const attendanceCoverage = todayAttendanceRows.length > 0 ? Math.round((markedAttendanceCount / todayAttendanceRows.length) * 100) : 0
  const activeStudentCourses = new Set(studentDirectory.map((student) => student.course).filter(Boolean)).size

  useEffect(() => {
    const savedState = readStudentManagerState(studentStorageKey)
    setStudentAttendanceState(savedState.attendance)
    setStudentNotes(savedState.notes)
    setStudentStateHydrated(true)
  }, [studentStorageKey])

  useEffect(() => {
    if (!studentStateHydrated || typeof window === 'undefined') return
    window.localStorage.setItem(studentStorageKey, JSON.stringify({ attendance: studentAttendanceState, notes: studentNotes }))
  }, [studentAttendanceState, studentNotes, studentStateHydrated, studentStorageKey])

  useEffect(() => {
    if (studentDirectory.length === 0) {
      setSelectedStudentId(null)
      return
    }
    if (!selectedStudentId || !studentDirectory.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(studentDirectory[0].id)
    }
  }, [selectedStudentId, studentDirectory])

  const updateAttendanceByKey = (attendanceKey, status) => {
    setStudentAttendanceState((current) => {
      const next = { ...current }
      if (!attendanceKey || status === 'unmarked') {
        delete next[attendanceKey]
        return next
      }
      next[attendanceKey] = { status, updatedAt: new Date().toISOString() }
      return next
    })
  }

  const updateStudentAttendance = (studentId, status) => {
    updateAttendanceByKey(buildAttendanceEntryKey(null, studentId), status)
  }

  const markAllStudentsPresent = () => {
    const now = new Date().toISOString()
    setStudentAttendanceState((current) => {
      const next = { ...current }
      todayAttendanceRows.forEach((row) => {
        next[row.attendanceKey] = { status: 'present', updatedAt: now }
      })
      return next
    })
  }

  const clearAttendanceMarks = () => {
    setStudentAttendanceState((current) => {
      const next = { ...current }
      todayAttendanceRows.forEach((row) => {
        delete next[row.attendanceKey]
      })
      return next
    })
  }

  const updateStudentNote = (studentId, note) => {
    setStudentNotes((current) => ({ ...current, [studentId]: note }))
  }

  const getAttendanceBtnClass = (rowStatus, optionId, optionTone) => {
    const isActive = rowStatus === optionId
    if (!isActive) {
      return 'rounded-xl border border-parchment bg-white px-3 py-2 text-sm font-semibold text-ink-soft hover:border-emerald/30 hover:text-emerald hover:shadow-sm transition-all'
    }
    const toneMap = {
      emerald: 'bg-emerald text-white shadow-sm shadow-emerald/20',
      gold: 'bg-gold text-white shadow-sm shadow-gold/20',
      rose: 'bg-rose text-white shadow-sm shadow-rose/20',
      teal: 'bg-teal text-white shadow-sm shadow-teal/20',
    }
    return `rounded-xl px-3 py-2 text-sm font-semibold transition-all ${toneMap[optionTone] || toneMap.emerald}`
  }

  const getQuickActionBtnClass = (latestStatus, optionId, optionTone) => {
    const isActive = latestStatus === optionId
    if (!isActive) {
      return 'rounded-xl border border-parchment bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft hover:border-emerald/30 hover:text-emerald hover:shadow-sm transition-all'
    }
    const toneMap = {
      emerald: 'bg-emerald text-white shadow-sm shadow-emerald/20',
      gold: 'bg-gold text-white shadow-sm shadow-gold/20',
      rose: 'bg-rose text-white shadow-sm shadow-rose/20',
      teal: 'bg-teal text-white shadow-sm shadow-teal/20',
    }
    return `rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${toneMap[optionTone] || toneMap.emerald}`
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <GridList cols="md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total students" value={studentDirectory.length} tone="gold" />
        <StatCard icon={Calendar} label="Today roster" value={todayAttendanceRows.length} tone="emerald" hint={todayAttendanceRows.length > 0 ? `${markedAttendanceCount} marked` : 'No sessions today'} />
        <StatCard icon={CheckCircle2} label="Attendance coverage" value={`${attendanceCoverage}%`} tone="teal" hint={`${absentTodayCount} absent today`} />
        <StatCard icon={AlertTriangle} label="Need follow-up" value={studentsNeedingAttention.length} tone="rose" hint={`${activeStudentCourses} active course${activeStudentCourses === 1 ? '' : 's'}`} />
      </GridList>

      {/* Top row: Attendance + Attention */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Attendance Register */}
        <SectionCard
          title="Attendance register"
          subtitle="Mark students as present, late, absent, or excused. Each class row saves its own attendance state."
          action={
            <div className="flex flex-wrap gap-2">
              <button
                onClick={markAllStudentsPresent}
                disabled={todayAttendanceRows.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald/20 bg-emerald/8 px-3.5 py-2 text-sm font-semibold text-emerald transition hover:bg-emerald/15 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={15} />
                Mark all present
              </button>
              <button
                onClick={clearAttendanceMarks}
                disabled={markedAttendanceCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-parchment bg-white px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:border-rose/20 hover:text-rose disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear marks
              </button>
            </div>
          }
        >
          {studentsLoading || scheduleLoading ? (
            <SectionRowsSkeleton rows={4} itemClassName="h-28" />
          ) : todayAttendanceRows.length === 0 ? (
            <EmptyState icon={Users} title="No students yet" text="Students appear here once classes are booked or enrollments are created." />
          ) : (
            <div className="space-y-3">
              {todayAttendanceRows.map((row) => (
                <div
                  key={row.key}
                  className="group rounded-2xl border border-parchment/60 bg-white p-5 transition hover:border-emerald/20 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <StatusPill tone={getAttendanceStatusTone(row.status)}>
                          {getAttendanceStatusLabel(row.status)}
                        </StatusPill>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-bark/60">
                          <Clock size={11} />
                          {row.sessionLabel}
                        </span>
                      </div>
                      <div className="mt-2.5 text-lg font-bold text-ink">{row.studentName}</div>
                      <div className="mt-0.5 text-sm font-medium text-bark">{row.courseTitle}</div>
                      {row.durationMinutes && (
                        <div className="mt-1 text-xs text-bark/70">{row.durationMinutes} min class</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:max-w-[340px] lg:justify-end">
                      {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => updateAttendanceByKey(row.attendanceKey, option.id)}
                          className={getAttendanceBtnClass(row.status, option.id, option.tone)}
                        >
                          {option.label}
                        </button>
                      ))}
                      <button
                        onClick={() => updateAttendanceByKey(row.attendanceKey, 'unmarked')}
                        className="rounded-xl border border-parchment bg-white px-3 py-2 text-sm font-semibold text-ink-soft transition hover:border-rose/20 hover:text-rose hover:shadow-sm"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Students needing attention */}
        <SectionCard title="Students needing attention" subtitle="Keep an eye on low attendance or recently missed learners.">
          {studentsLoading ? (
            <SectionRowsSkeleton rows={4} itemClassName="h-20" />
          ) : studentsNeedingAttention.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All students look healthy" text="No attendance risks right now. Keep marking classes to stay on top of engagement." />
          ) : (
            <div className="space-y-2.5">
              {studentsNeedingAttention.slice(0, 6).map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`group w-full rounded-2xl border p-4 text-left transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-emerald bg-emerald/5 shadow-sm'
                      : 'border-parchment/60 bg-white hover:border-emerald/20 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-ink">{student.name}</div>
                        <ChevronRight size={14} className="text-bark/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="mt-0.5 text-sm text-bark">{student.course}</div>
                      <div className="mt-1 text-xs text-bark/70">Next class: {student.nextClass}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={student.attendanceTone}>{student.attendanceLabel}</StatusPill>
                      <StatusPill tone={student.latestStatusTone}>{student.latestStatusLabel}</StatusPill>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Bottom row: Directory + Details */}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        {/* Student Directory */}
        <SectionCard title="Student directory" subtitle="Search by student, course, guardian, or contact details.">
          <div className="mb-5 grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bark/40" />
              <TextInput
                label="Search"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students, courses, emails..."
                className="pl-10"
              />
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink-soft">Filter</span>
              <div className="relative">
                <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bark/40" />
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border-2 border-parchment bg-ivory pl-10 pr-9 py-3 text-sm text-ink focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/10 transition"
                >
                  <option value="all">All students</option>
                  <option value="needs-attention">Need attention</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excused</option>
                  <option value="unmarked">Unmarked</option>
                </select>
                <ChevronRight size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-bark/40 pointer-events-none" />
              </div>
            </label>
          </div>

          {studentsLoading ? (
            <SectionRowsSkeleton rows={5} itemClassName="h-24" />
          ) : filteredStudents.length === 0 ? (
            <EmptyState icon={Users} title="No matches found" text="Try a different name, course, or attendance filter." />
          ) : (
            <div className="space-y-2.5">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`group w-full rounded-2xl border p-4 text-left transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-emerald bg-emerald/5 shadow-sm'
                      : 'border-parchment/60 bg-white hover:border-emerald/20 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="font-bold text-ink">{student.name}</div>
                        {student.guardianName && (
                          <span className="text-xs text-bark/70 bg-ivory px-2 py-0.5 rounded-full border border-parchment/50">
                            Guardian: {student.guardianName}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm font-medium text-bark">{student.course}</div>
                      <div className="mt-1 text-xs text-bark/70">Next class: {student.nextClass}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <StatusPill tone={student.attendanceTone}>{student.attendanceLabel}</StatusPill>
                      <StatusPill tone={student.latestStatusTone}>{student.latestStatusLabel}</StatusPill>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Student Details */}
        <SectionCard
          title={selectedStudent ? selectedStudent.name : 'Student details'}
          subtitle={selectedStudent ? 'Attendance, notes, and quick teacher actions.' : 'Select a student to start managing their profile.'}
        >
          {!selectedStudent ? (
            <EmptyState icon={Users} title="Select a student" text="Pick a student from the directory to update attendance and follow-up notes." />
          ) : (
            <div className="space-y-5">
              {/* Header card */}
              <div className="rounded-2xl bg-gradient-to-br from-ivory via-white to-emerald/5 border border-parchment/60 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-ink">{selectedStudent.name}</div>
                        <div className="text-sm text-bark">{selectedStudent.course}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusPill tone={selectedStudent.attendanceTone}>{selectedStudent.attendanceLabel}</StatusPill>
                      <StatusPill tone={selectedStudent.latestStatusTone}>{selectedStudent.latestStatusLabel}</StatusPill>
                    </div>
                  </div>
                  <div className="rounded-xl border border-parchment/60 bg-white px-4 py-3 text-sm text-bark shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-bark/60 mb-1">
                      <BookOpen size={12} />
                      Upcoming classes
                    </div>
                    <span className="text-2xl font-bold text-ink">{selectedStudent.upcomingSessions}</span>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-parchment/60 bg-ivory/40 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-bark/60 mb-2">
                    <Mail size={12} />
                    Contact
                  </div>
                  <div className="text-sm font-medium text-ink">{selectedStudent.email || 'Email not provided'}</div>
                  <div className="mt-1 text-sm text-bark">{selectedStudent.phone || 'Phone not provided'}</div>
                </div>
                <div className="rounded-xl border border-parchment/60 bg-ivory/40 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-bark/60 mb-2">
                    <Users size={12} />
                    Guardian
                  </div>
                  <div className="text-sm font-medium text-ink">{selectedStudent.guardianName || 'Guardian not listed'}</div>
                  <div className="mt-1 text-sm text-bark">Next class: {selectedStudent.nextClass}</div>
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-soft">
                  <CheckCircle2 size={14} />
                  Quick attendance actions
                </div>
                <div className="flex flex-wrap gap-2">
                  {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateStudentAttendance(selectedStudent.id, option.id)}
                      className={getQuickActionBtnClass(selectedStudent.latestStatus, option.id, option.tone)}
                    >
                      {option.label}
                    </button>
                  ))}
                  <button
                    onClick={() => updateStudentAttendance(selectedStudent.id, 'unmarked')}
                    className="rounded-xl border border-parchment bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-rose/20 hover:text-rose hover:shadow-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-soft">
                  <StickyNote size={14} />
                  Teacher notes
                </div>
                <TextInput
                  as="textarea"
                  rows="5"
                  value={studentNotes[selectedStudent.id] || ''}
                  onChange={(e) => updateStudentNote(selectedStudent.id, e.target.value)}
                  placeholder="Add progress notes, follow-up reminders, or behavior observations..."
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-1">
                <ActionButton onClick={onOpenMessages}>Open messages</ActionButton>
                <button
                  onClick={onOpenSchedule}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-parchment bg-white px-5 py-3 text-sm font-semibold text-ink-soft transition hover:border-emerald/30 hover:text-emerald hover:shadow-sm"
                >
                  <Calendar size={15} />
                  View schedule
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}