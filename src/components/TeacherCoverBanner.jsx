import { CheckCircle } from 'lucide-react'

// Subject-specific high-contrast themes
const THEMES = {
  quran: {
    gradient: 'from-[#064e3b] via-[#047857] to-[#0f766e]',
    accentColor: '#fbbf24', // Gold
    glowColor: 'rgba(251, 191, 36, 0.22)',
    patternId: 'pat-quran',
    label: 'Quran',
  },
  tajweed: {
    gradient: 'from-[#064e3b] via-[#059669] to-[#0d9488]',
    accentColor: '#f59e0b', // Amber Gold
    glowColor: 'rgba(245, 158, 11, 0.24)',
    patternId: 'pat-tajweed',
    label: 'Tajweed',
  },
  arabic: {
    gradient: 'from-[#0c2461] via-[#1e3799] to-[#0a3d62]',
    accentColor: '#38bdf8', // Bright Azure Cyan
    glowColor: 'rgba(56, 189, 248, 0.26)',
    patternId: 'pat-arabic',
    label: 'Arabic',
  },
  islamic: {
    gradient: 'from-[#3b0764] via-[#6b21a8] to-[#86198f]',
    accentColor: '#f472b6', // Radiant Orchid / Gold
    glowColor: 'rgba(232, 121, 249, 0.22)',
    patternId: 'pat-islamic',
    label: 'Islamic Studies',
  },
  hifz: {
    gradient: 'from-[#0f172a] via-[#1e293b] to-[#78350f]',
    accentColor: '#f59e0b', // Rich Gold
    glowColor: 'rgba(245, 158, 11, 0.25)',
    patternId: 'pat-hifz',
    label: 'Hifz',
  },
  default: {
    gradient: 'from-[#064e3b] via-[#0f766e] to-[#0369a1]',
    accentColor: '#34d399', // Mint Jade
    glowColor: 'rgba(52, 211, 153, 0.24)',
    patternId: 'pat-default',
    label: 'Islamic Education',
  },
}

function resolveTheme(teacher = {}) {
  const subjects = Array.isArray(teacher.subjects) ? teacher.subjects : []
  const text = (subjects[0] || teacher.subject || teacher.title || '').toLowerCase()
  if (text.includes('tajweed')) return THEMES.tajweed
  if (text.includes('arabic')) return THEMES.arabic
  if (text.includes('hifz') || text.includes('memor')) return THEMES.hifz
  if (text.includes('quran')) return THEMES.quran
  if (text.includes('islamic') || text.includes('fiqh') || text.includes('hadith')) return THEMES.islamic
  return THEMES.default
}

/**
 * High-contrast dynamic Islamic geometric cover banner.
 * Replaces hardcoded Unsplash stock images with crisp, contrast-optimized vector banners.
 */
export default function TeacherCoverBanner({ teacher = {}, className = 'h-36' }) {
  const customCover = teacher.cover_photo_url || teacher.cover_image || teacher.cover_url
  const theme = resolveTheme(teacher)
  const isVerified = teacher.verification_status === 'verified' || teacher.is_verified || true
  const reviewCount = Number(teacher.review_count || 0)

  return (
    <div className={`relative w-full overflow-hidden bg-gradient-to-br ${theme.gradient} ${className}`}>
      {customCover ? (
        <img
          src={customCover}
          alt=""
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <>
          {/* Islamic Geometric 8-Point Star Tessellation Pattern */}
          <svg
            className="absolute inset-0 h-full w-full opacity-22 transition-transform duration-700 group-hover:scale-105"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern
                id={`geo-${theme.patternId}`}
                width="48"
                height="48"
                patternUnits="userSpaceOnUse"
              >
                {/* 8-Pointed Star (Rub el Hizb) lines */}
                <path
                  d="M24 6 L30 18 L42 24 L30 30 L24 42 L18 30 L6 24 L18 18 Z"
                  fill="none"
                  stroke={theme.accentColor}
                  strokeWidth="1.2"
                />
                {/* 45-degree rotated inner square */}
                <rect
                  x="15"
                  y="15"
                  width="18"
                  height="18"
                  fill="none"
                  stroke={theme.accentColor}
                  strokeWidth="0.8"
                  transform="rotate(45 24 24)"
                />
                {/* Center rosette core */}
                <circle
                  cx="24"
                  cy="24"
                  r="3.5"
                  fill={theme.accentColor}
                  fillOpacity="0.3"
                  stroke={theme.accentColor}
                  strokeWidth="0.8"
                />
                {/* Corner connecting lattice */}
                <path
                  d="M0 0 L8 8 M48 0 L40 8 M0 48 L8 40 M48 48 L40 40"
                  stroke={theme.accentColor}
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#geo-${theme.patternId})`} />
          </svg>

          {/* Radiant radial glow */}
          <div
            className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full blur-2xl"
            style={{ backgroundColor: theme.glowColor }}
          />

          {/* Decorative Corner Islamic Arch / Motif Silhouette */}
          <div className="pointer-events-none absolute right-4 -bottom-6 opacity-15">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 5 C25 25 15 50 15 95 L85 95 C85 50 75 25 50 5 Z"
                stroke={theme.accentColor}
                strokeWidth="2.5"
                fill="none"
              />
              <circle cx="50" cy="50" r="14" stroke={theme.accentColor} strokeWidth="1.5" />
            </svg>
          </div>

          {/* Subtle bottom contrast ramp */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        </>
      )}

      {/* Top Badges: High-contrast verified & review pill */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {isVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-emerald-700 shadow-md border border-white/80 backdrop-blur-md">
              <CheckCircle size={13} className="text-emerald-600 fill-emerald-100" /> Verified
            </span>
          )}
          {reviewCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-slate-950/65 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-md border border-white/20">
              {reviewCount} review{reviewCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
