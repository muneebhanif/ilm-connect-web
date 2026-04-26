import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/auth.jsx'
import { api, apiFetch, authFetch, normalizeTeacherProfileResponse } from '../lib/api.js'
import { happyMomArt, learningLiveClassArt } from '../lib/artwork'
import { DashboardShell, SectionCard, EmptyState, StatusPill, ActionButton } from '../components/dashboard-ui.jsx'
import { BookingPageSkeleton } from '../components/skeletons.jsx'

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

function getPackageUnitPrice(teacher, packageType) {
  const hourlyRate = Number(teacher.hourly_rate || 0)

  if (packageType === 'weekly') {
    const customWeekly = Number(teacher.weekly_package_price || 0)
    return customWeekly > 0 ? customWeekly : hourlyRate * 4 * 0.9
  }

  if (packageType === 'monthly') {
    const customMonthly = Number(teacher.monthly_package_price || 0)
    return customMonthly > 0 ? customMonthly : hourlyRate * 12 * 0.8
  }

  return hourlyRate
}

function extractSlotsForDay(availability, dayName) {
  if (!availability || typeof availability !== 'object') return []
  const key = Object.keys(availability).find((item) => item.toLowerCase() === dayName.toLowerCase())
  const dayData = key ? availability[key] : null
  if (!dayData) return []
  if (Array.isArray(dayData)) return dayData
  if (dayData.start && dayData.end) {
    const start = Number(String(dayData.start).split(':')[0])
    const end = Number(String(dayData.end).split(':')[0])
    return Array.from({ length: Math.max(end - start, 0) }, (_, index) => `${String(start + index).padStart(2, '0')}:00`)
  }
  return []
}

function mapBookingErrorMessage(message = '') {
  const normalized = String(message || '').toLowerCase().trim()

  if (!normalized) return 'Something went wrong while preparing your booking.'
  if (normalized.includes('select at least one child')) return 'Select at least one child before continuing.'
  if (normalized.includes('choose a subject')) return 'Choose a subject before continuing.'
  if (normalized.includes('choose a date')) return 'Choose a date before continuing.'
  if (normalized.includes('choose a time')) return 'Choose an available time slot before continuing.'
  if (normalized.includes('teacher is already booked')) return 'That slot has already been booked. Please choose another time.'
  if (normalized.includes('selected slot is not available')) return 'That time slot is no longer available. Please pick another one.'
  if (normalized.includes('teacher is not verified')) return 'This teacher cannot accept bookings yet.'
  if (normalized.includes('payment has not been completed')) return 'Payment is not complete yet. Please finish payment first.'
  if (normalized.includes('payment verification failed')) return 'Your payment could not be verified. Please try again.'
  if (normalized.includes('invalid payment amount')) return 'The booking amount is invalid. Refresh the page and try again.'
  if (normalized.includes('minimum payment amount')) return 'The amount is too small to process. Please adjust the booking.'
  if (normalized.includes('teacher not found')) return 'This teacher profile could not be found.'
  if (normalized.includes('invalid session') || normalized.includes('no token')) return 'Your session expired. Please sign in again.'
  if (normalized.includes('networkerror') || normalized.includes('failed to fetch')) return 'Network error. Check your connection and try again.'

  return message
}

function PaymentStep({ clientSecret, bookingLabel, onPaid, isSubmitting }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setError('')

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (submitError) {
      const message = submitError.message || 'Payment could not be completed.'
      setError(message)
      toast.error(mapBookingErrorMessage(message))
      return
    }

    if (paymentIntent?.id) {
      toast.success('Payment completed. Finalizing booking...')
      onPaid(paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-[24px] border border-parchment/50 bg-ivory/55 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-soft"><CreditCard size={16} /> Secure payment</div>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error ? <div className="text-sm text-rose">{error}</div> : null}
      <ActionButton type="submit" icon={ShieldCheck} disabled={!stripe || isSubmitting}>Pay and confirm {bookingLabel}</ActionButton>
    </form>
  )
}

export default function BookTeacher() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [selectedChildIds, setSelectedChildIds] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedPackage, setSelectedPackage] = useState('single')
  const [paymentData, setPaymentData] = useState(null)
  const [feedback, setFeedback] = useState('')
  const queryErrorToastRef = useRef({ teacher: '', children: '' })

  const teacherQuery = useQuery({
    queryKey: ['teacherBookingProfile', id],
    queryFn: () => apiFetch(api.teacherProfile(id)),
    enabled: !!id,
  })

  const childrenQuery = useQuery({
    queryKey: ['parentChildrenBooking', user?.id],
    queryFn: () => authFetch(api.parentChildren(user.id), token),
    enabled: !!user?.id && !!token,
  })

  const teacher = normalizeTeacherProfileResponse(teacherQuery.data || {}, id)
  const children = childrenQuery.data?.children || []
  const timezone = teacher.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const dates = useMemo(() => {
    const start = DateTime.now().setZone(timezone).startOf('day')
    return Array.from({ length: 14 }, (_, index) => start.plus({ days: index }))
  }, [timezone])

  const subjectOptions = useMemo(() => {
    const items = Array.isArray(teacher.subjects) ? teacher.subjects.filter(Boolean) : []
    return items.length ? items : ['Quran', 'Arabic']
  }, [teacher.subjects])

  const selectedDateTime = selectedDate ? DateTime.fromISO(selectedDate, { zone: timezone }) : null
  const availableSlots = selectedDateTime ? extractSlotsForDay(teacher.availability, selectedDateTime.toFormat('cccc')) : []
  const unitPrice = getPackageUnitPrice(teacher, selectedPackage)
  const totalAmount = Number((unitPrice * Math.max(selectedChildIds.length, 1)).toFixed(2))
  const bookingLabel = `$${totalAmount.toFixed(2)}`

  useEffect(() => {
    setPaymentData(null)
  }, [selectedChildIds, selectedSubject, selectedDate, selectedTime, selectedPackage])

  useEffect(() => {
    if (teacherQuery.error) {
      const message = mapBookingErrorMessage(teacherQuery.error?.message || 'Failed to load teacher profile.')
      if (queryErrorToastRef.current.teacher !== message) {
        queryErrorToastRef.current.teacher = message
        toast.error(message)
      }
    }
  }, [teacherQuery.error])

  useEffect(() => {
    if (childrenQuery.error) {
      const message = mapBookingErrorMessage(childrenQuery.error?.message || 'Failed to load children for booking.')
      if (queryErrorToastRef.current.children !== message) {
        queryErrorToastRef.current.children = message
        toast.error(message)
      }
    }
  }, [childrenQuery.error])

  const bookingMutation = useMutation({
    mutationFn: (paymentIntentId) => authFetch(api.bookings(), token, {
      method: 'POST',
      body: JSON.stringify({
        teacherId: teacher.id,
        studentIds: selectedChildIds,
        subject: selectedSubject,
        sessionDate: DateTime.fromISO(`${selectedDate}T${selectedTime}`, { zone: timezone }).toUTC().toISO(),
        durationMinutes: 60,
        packageType: selectedPackage,
        teacherTimezone: timezone,
        paymentIntentId,
      }),
    }),
    onSuccess: () => {
      toast.success('Class booked successfully!')
      navigate('/dashboard/parent')
    },
    onError: (err) => toast.error(mapBookingErrorMessage(err?.message || 'Failed to create booking.')),
  })

  const paymentIntentMutation = useMutation({
    mutationFn: () => authFetch(api.paymentCreateIntent(), token, {
      method: 'POST',
      body: JSON.stringify({
        amount: totalAmount,
        currency: 'usd',
        teacherId: teacher.id,
        packageType: selectedPackage,
        subject: selectedSubject,
        numStudents: selectedChildIds.length,
      }),
    }),
    onSuccess: (data) => {
      setPaymentData(data)
      toast.success('Payment form is ready.')
    },
    onError: (err) => toast.error(mapBookingErrorMessage(err?.message || 'Failed to prepare payment. Please try again.')),
  })

  const verifyAndBookMutation = useMutation({
    mutationFn: async (paymentIntentId) => {
      const verification = await authFetch(api.paymentVerify(), token, {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId }),
      })
      if (!verification?.verified) throw new Error('Payment verification failed.')
      return bookingMutation.mutateAsync(paymentIntentId)
    },
    onError: (err) => toast.error(mapBookingErrorMessage(err?.message || 'Payment verification failed.')),
  })

  const isBusy = paymentIntentMutation.isPending || verifyAndBookMutation.isPending || bookingMutation.isPending

  const validateSelection = () => {
    if (selectedChildIds.length === 0) return 'Select at least one child.'
    if (!selectedSubject) return 'Choose a subject.'
    if (!selectedDate) return 'Choose a date.'
    if (!selectedTime) return 'Choose a time slot.'
    return ''
  }

  const startBooking = async () => {
    const validation = validateSelection()
    setFeedback(validation)
    if (validation) {
      toast.error(mapBookingErrorMessage(validation))
      return
    }

    if (isBusy) return

    try {
      if (totalAmount <= 0) {
        toast.loading('Creating free booking...', { id: 'booking-submit' })
        await bookingMutation.mutateAsync(null)
        toast.dismiss('booking-submit')
        return
      }

      toast.loading('Preparing secure payment...', { id: 'booking-submit' })
      await paymentIntentMutation.mutateAsync()
      toast.dismiss('booking-submit')
    } catch (error) {
      toast.dismiss('booking-submit')
    }
  }

  if (teacherQuery.isLoading || childrenQuery.isLoading) {
    return <BookingPageSkeleton />
  }

  const teacherOrChildrenFailed = teacherQuery.isError || childrenQuery.isError

  if (teacherOrChildrenFailed) {
    return (
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-pale/25 via-ivory to-ivory" />
        <div className="relative">
          <DashboardShell
            badge="Live booking"
            title="Booking unavailable"
            description="We could not load the teacher or child booking details right now."
            actions={<Link to={`/teachers/${id}`} className="inline-flex items-center gap-2 rounded-2xl border border-parchment bg-white/92 px-5 py-3 text-sm font-semibold text-ink-soft hover:border-emerald/30 hover:text-emerald"><ArrowLeft size={16} /> Back to profile</Link>}
          >
            <SectionCard title="Try again">
              <div className="rounded-[24px] border border-rose/20 bg-rose/5 px-5 py-4 text-sm text-rose">
                Booking data could not be loaded. Retry the failed request below.
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => teacherQuery.refetch()} className="rounded-xl border border-parchment/60 bg-white px-4 py-2 font-semibold text-ink-soft hover:border-emerald/30 hover:text-emerald">Retry teacher profile</button>
                <button onClick={() => childrenQuery.refetch()} className="rounded-xl border border-parchment/60 bg-white px-4 py-2 font-semibold text-ink-soft hover:border-emerald/30 hover:text-emerald">Retry children</button>
              </div>
            </SectionCard>
          </DashboardShell>
        </div>
      </div>
    )
  }

  if (!teacher?.id) {
    return <div className="pt-24"><EmptyState title="Teacher not found" text="The booking record could not be prepared." /></div>
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-pale/25 via-ivory to-ivory" />
      <img src={learningLiveClassArt} alt="Booking illustration" className="pointer-events-none absolute right-8 top-24 hidden w-[22rem] opacity-12 xl:block" />
      <div className="pointer-events-none absolute left-8 bottom-10 hidden w-24 xl:block animate-breathe art-breathing opacity-90" style={{ animationDelay: '1.2s' }}>
        <img src={happyMomArt} alt="Parent illustration" className="h-full w-full object-contain" />
      </div>
      <div className="relative">
        <DashboardShell
          badge="Live booking"
          title={`Book ${teacher.full_name || 'teacher'}`}
          description="Select children, subject, date, and time to complete your booking."
          actions={<Link to={`/teachers/${id}`} className="inline-flex items-center gap-2 rounded-2xl border border-parchment bg-white/92 px-5 py-3 text-sm font-semibold text-ink-soft hover:border-emerald/30 hover:text-emerald"><ArrowLeft size={16} /> Back to profile</Link>}
        >
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Booking setup">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-parchment/50 bg-ivory/55 p-5">
              <div className="flex items-center gap-4">
                {teacher.avatar_url ? <img src={teacher.avatar_url} alt={teacher.full_name} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/10 text-emerald"><UserRound size={24} /></div>}
                <div>
                  <div className="font-display text-2xl font-bold text-ink">{teacher.full_name}</div>
                  <div className="text-sm text-bark">{(teacher.subjects || []).join(', ') || 'Islamic studies'} • {timezone}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-ink-soft">Choose children</div>
              {children.length === 0 ? (
                <EmptyState title="No children found" text="Add a child profile first so booking works correctly." action={<Link to="/dashboard/parent" className="text-sm font-semibold text-emerald">Open parent dashboard</Link>} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {children.map((child) => {
                    const active = selectedChildIds.includes(child.id)
                    return (
                      <button key={child.id} onClick={() => { setFeedback(''); setSelectedChildIds((prev) => active ? prev.filter((item) => item !== child.id) : [...prev, child.id]) }} className={`rounded-2xl border p-4 text-left ${active ? 'border-emerald bg-emerald/6' : 'border-parchment/50 bg-white'}`}>
                        <div className="font-semibold text-ink">{child.name || child.full_name}</div>
                        <div className="mt-1 text-xs text-bark">Age {child.age || '—'}</div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-3 text-sm font-semibold text-ink-soft">Subject</div>
                <div className="flex flex-wrap gap-2">
                  {subjectOptions.map((subject) => (
                    <button key={subject} onClick={() => { setFeedback(''); setSelectedSubject(subject) }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${selectedSubject === subject ? 'bg-emerald text-white' : 'border border-parchment/50 bg-white text-ink-soft'}`}>
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-3 text-sm font-semibold text-ink-soft">Package</div>
                <div className="grid gap-2">
                  {[
                    { id: 'single', label: 'Single class', note: 'One live session', price: Number(teacher.hourly_rate || 0) },
                    { id: 'weekly', label: 'Weekly bundle', note: '4 sessions', price: getPackageUnitPrice(teacher, 'weekly') },
                    { id: 'monthly', label: 'Monthly plan', note: '12 sessions', price: getPackageUnitPrice(teacher, 'monthly') },
                  ].map((pkg) => (
                    <button key={pkg.id} onClick={() => { setFeedback(''); setSelectedPackage(pkg.id) }} className={`rounded-2xl border p-4 text-left ${selectedPackage === pkg.id ? 'border-emerald bg-emerald/6' : 'border-parchment/50 bg-white'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-ink">{pkg.label}</div>
                          <div className="mt-1 text-xs text-bark">{pkg.note}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald">${Number(pkg.price || 0).toFixed(2)}</div>
                          <div className="text-[11px] text-bark">per child</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-ink-soft">Date</div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {dates.map((date) => (
                  <button key={date.toISODate()} onClick={() => { setFeedback(''); setSelectedDate(date.toISODate()); setSelectedTime('') }} className={`rounded-2xl border p-4 text-left ${selectedDate === date.toISODate() ? 'border-emerald bg-emerald/6' : 'border-parchment/50 bg-white'}`}>
                    <div className="font-semibold text-ink">{date.toFormat('ccc, dd LLL')}</div>
                    <div className="mt-1 text-xs text-bark">{date.toRelativeCalendar() || date.toFormat('DD')}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-ink-soft">Available time slots</div>
              {availableSlots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-parchment bg-ivory/55 p-4 text-sm text-bark">No slots available for the selected day.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot) => (
                    <button key={slot} onClick={() => { setFeedback(''); setSelectedTime(slot) }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${selectedTime === slot ? 'bg-emerald text-white' : 'border border-parchment/50 bg-white text-ink-soft'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {feedback ? <div className="text-sm text-rose">{feedback}</div> : null}
          </div>
        </SectionCard>

        <SectionCard title="Booking summary" subtitle="Review your booking details and complete payment.">
          <div className="space-y-5">
            <div className="rounded-[24px] bg-ivory/55 p-5">
              <div className="flex items-center justify-between text-sm"><span className="text-bark">Teacher</span><span className="font-semibold text-ink">{teacher.full_name}</span></div>
              <div className="mt-3 flex items-center justify-between text-sm"><span className="text-bark">Students</span><span className="font-semibold text-ink">{selectedChildIds.length || 0}</span></div>
              <div className="mt-3 flex items-center justify-between text-sm"><span className="text-bark">Subject</span><span className="font-semibold text-ink">{selectedSubject || '—'}</span></div>
              <div className="mt-3 flex items-center justify-between text-sm"><span className="text-bark">Date & time</span><span className="font-semibold text-ink">{selectedDate && selectedTime ? `${selectedDate} ${selectedTime}` : '—'}</span></div>
              <div className="mt-3 flex items-center justify-between text-sm"><span className="text-bark">Package</span><span className="font-semibold capitalize text-ink">{selectedPackage}</span></div>
              <div className="mt-4 border-t border-parchment/50 pt-4 flex items-center justify-between"><span className="font-semibold text-ink">Total</span><span className="font-display text-3xl font-bold text-emerald">{bookingLabel}</span></div>
            </div>

            <div className="space-y-3 text-sm text-bark">
              <div className="flex items-start gap-2"><Calendar size={16} className="mt-0.5 text-emerald" /> Scheduling respects the teacher's timezone.</div>
              <div className="flex items-start gap-2"><ShieldCheck size={16} className="mt-0.5 text-emerald" /> Payments are securely processed and verified before confirming.</div>
              {paymentData ? <div className="flex items-start gap-2"><Sparkles size={16} className="mt-0.5 text-emerald" /> If you change date, time, subject, package, or children, payment will refresh automatically.</div> : null}
            </div>

            {!paymentData ? (
              <ActionButton onClick={startBooking} icon={CheckCircle2} disabled={isBusy || children.length === 0 || teacherOrChildrenFailed}>
                {isBusy ? 'Preparing...' : totalAmount > 0 ? 'Continue to payment' : 'Confirm free booking'}
              </ActionButton>
            ) : stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret: paymentData.clientSecret, appearance: { theme: 'stripe' } }}>
                <PaymentStep clientSecret={paymentData.clientSecret} bookingLabel={bookingLabel} onPaid={(paymentIntentId) => verifyAndBookMutation.mutate(paymentIntentId)} isSubmitting={verifyAndBookMutation.isPending} />
              </Elements>
            ) : (
              <div className="rounded-2xl border border-rose/20 bg-rose/5 p-4 text-sm text-rose">Payment processing is temporarily unavailable. Please try again later or contact support.</div>
            )}

            {(paymentIntentMutation.error || verifyAndBookMutation.error || bookingMutation.error) ? (
              <div className="text-sm text-rose">{mapBookingErrorMessage(paymentIntentMutation.error?.message || verifyAndBookMutation.error?.message || bookingMutation.error?.message)}</div>
            ) : null}


          </div>
        </SectionCard>
          </div>
        </DashboardShell>
      </div>
    </div>
  )
}
