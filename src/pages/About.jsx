import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Globe, Shield, Smartphone, Heart, ArrowRight } from 'lucide-react'

const ABOUT_HERO_PHOTO = 'https://images.unsplash.com/photo-1513072064285-240f87fa81e8?w=1600&q=80&auto=format&fit=crop'
const ABOUT_MISSION_PHOTO = 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&q=80&auto=format&fit=crop'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] } }),
}
const values = [
  { icon: Heart, title: 'Faith-Centered', desc: 'Every feature is designed with Islamic values and adab at its core.' },
  { icon: Globe, title: 'Globally Accessible', desc: 'Learn from anywhere in the world with teachers from diverse backgrounds.' },
  { icon: Shield, title: 'Safe & Secure', desc: 'End-to-end verification, moderated content, and secure payments.' },
  { icon: Smartphone, title: 'Mobile-First', desc: 'Built for the way you live — learn on your phone, anytime.' },
]

export default function About() {
  return (
    <div className="relative overflow-hidden pt-18">
      <div className="relative">
      <section className="relative py-24 overflow-hidden">
        <img src={ABOUT_HERO_PHOTO} alt="Islamic architecture" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-ivory/92 via-ivory/88 to-emerald-pale/72" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border-2 border-gold/20 rounded-full mb-4">
            <span className="text-gold-muted text-xs font-extrabold tracking-wide uppercase">Our Story</span>
          </motion.div>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="font-display text-4xl sm:text-6xl font-black text-ink tracking-tight mb-6">
            Reimagining <span className="text-emerald">Islamic</span> Education
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-ink-soft text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            IlmConnect began with a very human problem: parents and students were doing their best to
            find trustworthy Islamic teachers, but the journey felt messy, tiring, and disconnected.
            Everything lived in scattered chats, video links, and manual follow-ups. We wanted to build
            one calm, reliable place where learning could feel easier, warmer, and more purposeful.
          </motion.p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp}>
              <span className="text-emerald text-xs font-bold tracking-[0.2em] uppercase">Our Mission</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight mt-3 mb-6">
                Making Quality Islamic Education <span className="text-gold">Accessible</span> to Every Family
              </h2>
              <div className="space-y-4 text-ink-soft leading-relaxed">
                <p>We believe every Muslim, regardless of location or background, deserves access to qualified Quran teachers and structured Islamic learning.</p>
                <p>IlmConnect brings together verified educators with families and students in a purpose-built platform — live video classes, course libraries, in-app messaging, progress tracking, and secure payments — all in one place.</p>
                <p>No more juggling between meeting apps, messaging platforms, and manual records. One platform. One ummah. Unlimited learning.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative">
              <div className="relative bg-emerald-deep rounded-3xl p-10 overflow-hidden">
                <img src={ABOUT_MISSION_PHOTO} alt="Islamic study setting" className="absolute inset-0 h-full w-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-emerald-deep/82" />
                <div className="quote-panel relative text-center rounded-[28px] px-6 py-8">
                  <p dir="rtl" lang="ar" className="arabic-quote text-4xl mb-4">طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ</p>
                  <div className="w-16 h-0.5 bg-gold/40 mx-auto mb-4" />
                  <p className="text-parchment/90 text-sm italic leading-relaxed font-semibold">"Seeking knowledge is an obligation upon every Muslim."</p>
                  <p className="text-parchment/70 text-xs mt-2 font-semibold">— Prophet Muhammad ﷺ (Ibn Majah)</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white border-y-2 border-parchment">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border-2 border-gold/20 rounded-full mb-4">
              <span className="text-gold-muted text-xs font-extrabold tracking-wide uppercase">Our Values</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-ink tracking-tight">Built on Principles</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <motion.div key={v.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={i}
                className="bg-ivory rounded-2xl p-6 border-2 border-parchment text-center hover:border-emerald/20 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-emerald/10 border-2 border-emerald/20 border-b-4 flex items-center justify-center mx-auto mb-4"><v.icon size={26} className="text-emerald" /></div>
                <h3 className="font-display font-extrabold text-ink mb-2">{v.title}</h3>
                <p className="text-bark text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <span className="text-emerald text-xs font-bold tracking-[0.2em] uppercase">The Team</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-3 mb-12 tracking-tight">Who's Behind IlmConnect</h2>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { initials: 'MM', name: 'Muhammad Muneeb Hanif', role: 'Founder & Product Lead' },
              { initials: 'SM', name: 'Sayyam Mehboob', role: 'Team Member' },
              { initials: 'HM', name: 'Haroon Mushtaq', role: 'Team Member' },
            ].map((member, index) => (
              <motion.div
                key={member.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={index + 1}
                className="bg-white rounded-2xl p-8 border border-parchment/60 shadow-lg shadow-ink/3"
              >
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald/10 to-teal/10 flex items-center justify-center mx-auto mb-4 border-2 border-emerald/10 text-3xl font-black text-emerald">
                  {member.initials}
                </div>
                <h3 className="font-display font-bold text-ink text-xl">{member.name}</h3>
                <p className="text-bark text-sm mt-1">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-emerald-deep relative overflow-hidden">
        <div className="absolute inset-0 lingo-dots opacity-10" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-6">Ready to Start Learning?</h2>
          <p className="text-emerald-light/80 text-lg mb-8 font-semibold">Join thousands of families using IlmConnect for Islamic education.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-deep font-extrabold rounded-2xl border-b-4 border-parchment hover:brightness-95 active:border-b-0 active:mt-1 transition-all text-lg shadow-xl">
            Get Started <ArrowRight size={20} />
          </Link>
        </div>
      </section>
      </div>
    </div>
  )
}
