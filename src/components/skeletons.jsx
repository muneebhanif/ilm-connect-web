export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-shimmer rounded-2xl ${className}`} />
}

export function SectionRowsSkeleton({ rows = 3, itemClassName = 'h-24' }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded-[24px] border border-parchment/50 bg-ivory/55 p-4">
          <SkeletonBlock className={`w-full ${itemClassName}`} />
        </div>
      ))}
    </div>
  )
}

export function PublicCardsSkeleton({ count = 6, imageHeight = 'h-40' }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-[28px] border border-parchment/60 bg-white shadow-sm">
          <SkeletonBlock className={`w-full ${imageHeight} rounded-none`} />
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-16 w-16 rounded-[20px]" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-5 w-2/3" />
                <SkeletonBlock className="h-4 w-1/2" />
              </div>
            </div>
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <div className="grid grid-cols-3 gap-2">
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-16" />
            </div>
            <div className="flex items-center justify-between pt-3">
              <SkeletonBlock className="h-5 w-20" />
              <SkeletonBlock className="h-11 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TeacherDetailSkeleton() {
  return (
    <div className="pt-18">
      <section className="relative overflow-hidden bg-emerald-deep/95 py-16">
        <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
          <SkeletonBlock className="mb-8 h-4 w-32 bg-white/10" />
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <SkeletonBlock className="h-24 w-24 rounded-2xl bg-white/10" />
            <div className="flex-1 space-y-4">
              <SkeletonBlock className="h-10 w-56 bg-white/10" />
              <SkeletonBlock className="h-4 w-40 bg-white/10" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-8 w-20 bg-white/10" />
                <SkeletonBlock className="h-8 w-24 bg-white/10" />
                <SkeletonBlock className="h-8 w-20 bg-white/10" />
              </div>
            </div>
            <SkeletonBlock className="h-20 w-32 rounded-2xl bg-white/10" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="rounded-2xl border border-parchment/50 bg-white p-6 space-y-4">
              <SkeletonBlock className="h-7 w-32" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-11/12" />
              <SkeletonBlock className="h-4 w-10/12" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => <SkeletonBlock key={index} className="h-32 rounded-2xl border border-parchment/50 bg-white" />)}
            </div>
            <div className="rounded-2xl border border-parchment/50 bg-white p-6">
              <SkeletonBlock className="mb-5 h-7 w-48" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border border-parchment/50 bg-ivory p-4 space-y-3">
                    <SkeletonBlock className="h-28 rounded-xl" />
                    <SkeletonBlock className="h-5 w-3/4" />
                    <SkeletonBlock className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-2xl border border-parchment/50 bg-white p-6 space-y-4">
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-4 w-4/5" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export function MessageCenterSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-parchment/50 bg-ivory/60 p-4 space-y-2">
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-3 w-5/6" />
          </div>
        ))}
      </div>
      <div className="rounded-[24px] border border-parchment/50 bg-ivory/55 p-4">
        <div className="mb-4 border-b border-parchment/40 pb-4 space-y-2">
          <SkeletonBlock className="h-7 w-36" />
          <SkeletonBlock className="h-4 w-28" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <SkeletonBlock className={`h-16 ${index % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <SkeletonBlock className="h-[52px] flex-1" />
          <SkeletonBlock className="h-[52px] w-[52px]" />
        </div>
      </div>
    </div>
  )
}

export function BookingPageSkeleton() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,107,88,0.08),_transparent_35%),linear-gradient(180deg,#faf7f2_0%,#f5efe7_100%)] pt-20">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 space-y-8">
        <div className="rounded-[32px] border border-parchment/60 bg-white/85 p-8 shadow-sm space-y-4">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-12 w-72" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-parchment/60 bg-white p-6 space-y-5 shadow-sm">
            {Array.from({ length: 6 }, (_, index) => <SkeletonBlock key={index} className={`w-full ${index < 2 ? 'h-24' : 'h-16'}`} />)}
          </div>
          <div className="rounded-[28px] border border-parchment/60 bg-white p-6 space-y-5 shadow-sm">
            <SkeletonBlock className="h-40 w-full" />
            <SkeletonBlock className="h-14 w-full" />
            <SkeletonBlock className="h-14 w-full" />
            <SkeletonBlock className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,107,88,0.06),_transparent_30%),linear-gradient(180deg,#faf7f2_0%,#f5efe7_100%)] pt-18">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 space-y-8">
        <div className="flex flex-col gap-4 rounded-[30px] border border-parchment/60 bg-white/85 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-10 w-64" />
          </div>
          <div className="flex gap-3">
            <SkeletonBlock className="h-11 w-28" />
            <SkeletonBlock className="h-11 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 rounded-[30px] border border-parchment/60 bg-white p-6 shadow-sm">
            <SkeletonBlock className="h-12 w-3/4" />
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-5/6" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="rounded-[24px] border border-parchment/50 bg-ivory/50 p-4 space-y-4">
                  <SkeletonBlock className="h-28 w-full" />
                  <SkeletonBlock className="h-5 w-2/3" />
                  <SkeletonBlock className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[30px] border border-parchment/60 bg-white p-6 shadow-sm space-y-4">
            <SkeletonBlock className="h-8 w-40" />
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonBlock key={index} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthButtonSkeleton() {
  return <SkeletonBlock className="h-5 w-24 rounded-lg bg-white/30" />
}
