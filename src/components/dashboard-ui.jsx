import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export function DashboardShell({ badge, title, description, actions, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory to-ivory-dark/40 pt-20">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border-2 border-parchment bg-white p-8 shadow-sm"
        >
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {badge ? (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-emerald/20 bg-emerald/8 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-emerald">
                  <Sparkles size={13} />
                  {badge}
                </div>
              ) : null}
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
              {description ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-bark">{description}</p> : null}
            </div>
            {actions ? <div className="relative flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </motion.div>
        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </div>
  )
}

export function DashboardTabs({ tabs, active, onChange }) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-2 rounded-2xl border-2 border-parchment bg-white p-2 shadow-sm">
        {tabs.map((tab) => {
          const selected = active === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold whitespace-nowrap transition-all ${selected ? 'bg-emerald text-white border-b-4 border-emerald-deep shadow-md' : 'text-ink-soft hover:bg-ivory hover:text-emerald'}`}
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
  const toneMap = {
    emerald: 'bg-emerald/10 text-emerald border-emerald/20',
    gold: 'bg-gold/10 text-gold border-gold/20',
    teal: 'bg-teal/10 text-teal border-teal/20',
    ink: 'bg-ink/8 text-ink border-ink/10',
    rose: 'bg-rose/10 text-rose border-rose/20',
  }

  return (
    <div className="rounded-2xl border-2 border-parchment bg-white p-5 shadow-sm hover:-translate-y-0.5 transition-transform">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-b-4 ${toneMap[tone] || toneMap.emerald}`}>
        <Icon size={20} />
      </div>
      <div className="text-sm font-semibold text-bark">{label}</div>
      <div className="mt-1 font-display text-3xl font-extrabold text-ink">{value}</div>
      {hint ? <div className="mt-1 text-xs text-bark/80">{hint}</div> : null}
    </div>
  )
}

export function SectionCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border-2 border-parchment bg-white p-6 shadow-sm ${className}`}>
      {(title || subtitle || action) ? (
        <div className="mb-5 flex flex-col gap-4 border-b-2 border-parchment/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? <h2 className="font-display text-2xl font-extrabold text-ink">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-bark">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function StatusPill({ children, tone = 'gold' }) {
  const toneMap = {
    emerald: 'bg-emerald/10 text-emerald border border-emerald/20',
    gold: 'bg-gold/10 text-gold-muted border border-gold/20',
    rose: 'bg-rose/10 text-rose border border-rose/20',
    ink: 'bg-ink/8 text-ink border border-ink/10',
    teal: 'bg-teal/10 text-teal border border-teal/20',
  }
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneMap[tone] || toneMap.gold}`}>{children}</span>
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-parchment bg-ivory/70 px-6 py-12 text-center">
      {Icon ? <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-b-4 border-parchment bg-white shadow-sm"><Icon size={24} className="text-bark" /></div> : null}
      <h3 className="font-display text-2xl font-extrabold text-ink">{title}</h3>
      {text ? <p className="mt-2 max-w-md text-sm leading-relaxed text-bark">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function ActionButton({ children, tone = 'emerald', icon: Icon, ...props }) {
  const toneMap = {
    emerald: 'bg-emerald text-white hover:bg-emerald-deep border-b-4 border-emerald-deep active:border-b-0 active:mt-1 shadow-md',
    light: 'bg-white text-ink-soft border-2 border-parchment border-b-4 hover:border-emerald/30 hover:text-emerald active:border-b-2 active:mt-0.5',
    gold: 'bg-gold text-white hover:brightness-95 border-b-4 border-gold-muted active:border-b-0 active:mt-1 shadow-md',
    rose: 'bg-rose text-white hover:brightness-95 border-b-4 border-rose/70 active:border-b-0 active:mt-1 shadow-md',
  }
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${toneMap[tone] || toneMap.emerald} ${props.className || ''}`}
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
      {label ? <span className="mb-2 block text-sm font-bold text-ink-soft">{label}</span> : null}
      <Comp
        {...props}
        className={`w-full rounded-xl border-2 border-parchment bg-ivory px-4 py-3 text-sm text-ink placeholder:text-sand focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/10 ${className}`}
      />
    </label>
  )
}

export function GridList({ children, cols = 'md:grid-cols-2 xl:grid-cols-3' }) {
  return <div className={`grid gap-4 ${cols}`}>{children}</div>
}
