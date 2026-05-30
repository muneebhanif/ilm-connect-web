import { ArrowRight, Sparkles } from 'lucide-react'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

const toneStyles = {
  emerald: {
    icon: 'border-emerald/20 bg-emerald/10 text-emerald shadow-emerald/10',
    stat: 'from-emerald/12 via-white to-emerald/5',
    pill: 'border-emerald/20 bg-emerald/10 text-emerald',
    button: 'bg-emerald text-white hover:bg-emerald-deep border-emerald-deep shadow-emerald/20',
  },
  gold: {
    icon: 'border-gold/30 bg-gold/12 text-gold-muted shadow-gold/10',
    stat: 'from-gold/14 via-white to-gold/6',
    pill: 'border-gold/25 bg-gold/12 text-gold-muted',
    button: 'bg-gold text-ink hover:brightness-95 border-gold-muted shadow-gold/20',
  },
  teal: {
    icon: 'border-teal/20 bg-teal/10 text-teal shadow-teal/10',
    stat: 'from-teal/12 via-white to-teal/5',
    pill: 'border-teal/20 bg-teal/10 text-teal',
    button: 'bg-teal text-white hover:bg-teal-deep border-teal-deep shadow-teal/20',
  },
  ink: {
    icon: 'border-ink/10 bg-ink/8 text-ink shadow-ink/10',
    stat: 'from-ink/8 via-white to-ivory',
    pill: 'border-ink/10 bg-ink/8 text-ink',
    button: 'bg-ink text-white hover:bg-ink-soft border-black/30 shadow-ink/20',
  },
  rose: {
    icon: 'border-rose/20 bg-rose/10 text-rose shadow-rose/10',
    stat: 'from-rose/12 via-white to-rose/5',
    pill: 'border-rose/20 bg-rose/10 text-rose',
    button: 'bg-rose text-white hover:bg-rose-deep border-rose-deep shadow-rose/20',
  },
  light: {
    button: 'bg-white text-ink-soft hover:text-emerald border-parchment hover:border-emerald/30 shadow-black/5',
  },
}

export function DashboardShell({ badge, title, description, actions, children }) {
  return (
    <div className="dashboard-page min-h-screen pt-20">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <section className="dashboard-hero p-7 sm:p-8 lg:p-10">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {badge ? (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.24em] text-emerald">
                  <Sparkles size={13} />
                  {badge}
                </div>
              ) : null}
              <h1 className="font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">{title}</h1>
              {description ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-bark">{description}</p> : null}
            </div>
            {actions ? <div className="relative flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>
        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </div>
  )
}

export function DashboardTabs({ tabs, active, onChange }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex min-w-full gap-2 rounded-[22px] border border-parchment/70 bg-white/82 p-2 shadow-[0_18px_45px_rgba(60,60,60,0.06)] backdrop-blur">
        {tabs.map((tab) => {
          const selected = active === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cx(
                'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold whitespace-nowrap transition-all focus:outline-none focus:ring-4 focus:ring-emerald/12',
                selected
                  ? 'bg-ink text-white shadow-[0_14px_32px_rgba(60,60,60,0.18)]'
                  : 'text-ink-soft hover:bg-ivory hover:text-emerald'
              )}
            >
              {Icon ? <Icon size={16} /> : null}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'emerald' }) {
  const toneStyle = toneStyles[tone] || toneStyles.emerald

  return (
    <article className={cx('dashboard-stat-card group bg-gradient-to-br p-5', toneStyle.stat)}>
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-bark/75">{label}</div>
          <div className="mt-2 font-display text-3xl font-black leading-none tracking-tight text-ink sm:text-4xl">{value}</div>
          {hint ? <div className="mt-2 text-xs font-semibold leading-relaxed text-bark/85">{hint}</div> : null}
        </div>
        {Icon ? (
          <div className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105', toneStyle.icon)}>
            <Icon size={20} />
          </div>
        ) : null}
      </div>
    </article>
  )
}

export function SectionCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={cx('dashboard-panel p-5 sm:p-6', className)}>
      {(title || subtitle || action) ? (
        <div className="mb-5 flex flex-col gap-4 border-b border-parchment/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="font-display text-2xl font-black tracking-tight text-ink">{title}</h2> : null}
            {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-bark">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function StatusPill({ children, tone = 'gold' }) {
  const toneStyle = toneStyles[tone] || toneStyles.gold
  return (
    <span className={cx('inline-flex items-center rounded-full border px-3 py-1 text-xs font-black leading-none tracking-[0.02em]', toneStyle.pill)}>
      {children}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-dashed border-parchment bg-gradient-to-br from-ivory/90 via-white/75 to-emerald/6 px-6 py-12 text-center">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold/12 blur-2xl" />
      {Icon ? <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-parchment bg-white shadow-sm"><Icon size={24} className="text-bark" /></div> : null}
      <h3 className="relative font-display text-2xl font-black tracking-tight text-ink">{title}</h3>
      {text ? <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-bark">{text}</p> : null}
      {action ? <div className="relative mt-5">{action}</div> : null}
    </div>
  )
}

export function ActionButton({ children, tone = 'emerald', icon: Icon, className = '', type = 'button', ...props }) {
  const toneStyle = toneStyles[tone] || toneStyles.emerald
  return (
    <button
      {...props}
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl border-b-4 px-5 py-3 text-sm font-black transition-all focus:outline-none focus:ring-4 focus:ring-emerald/12 active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-50',
        toneStyle.button,
        className
      )}
    >
      {children}
      {Icon ? <Icon size={16} /> : <ArrowRight size={16} />}
    </button>
  )
}

export function TextInput({ label, as = 'input', className = '', ...props }) {
  const Comp = as
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-black text-ink-soft">{label}</span> : null}
      <Comp
        {...props}
        className={cx(
          'w-full rounded-2xl border border-parchment/80 bg-white/80 px-4 py-3 text-sm font-semibold text-ink placeholder:text-sand shadow-inner shadow-black/[0.015] transition focus:border-emerald focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald/10',
          className
        )}
      />
    </label>
  )
}

export function GridList({ children, cols = 'md:grid-cols-2 xl:grid-cols-3' }) {
  return <div className={cx('grid gap-4', cols)}>{children}</div>
}

export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="dashboard-page px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <section className="dashboard-hero p-5 sm:p-6 lg:p-7">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald/15 bg-white/65 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
              Dashboard
            </div>
            <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">{title}</h1>
            {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bark sm:text-base">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div>}
        </div>
      </section>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  )
}
