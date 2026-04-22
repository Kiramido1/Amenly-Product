import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ChatEngine from '../components/chat/ChatEngine'

const AICompliancePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Background effects matching main site */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => {
          const size = Math.random() * 2 + 1
          const delay = Math.random() * 3
          const duration = Math.random() * 2 + 2
          return (
            <div
              key={i}
              className="absolute rounded-full neon-dot"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            />
          )
        })}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amenly-light/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-amenly-medium/6 rounded-full blur-[100px]" />
      </div>

      {/* ── Top nav bar ─────────────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl flex-shrink-0">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.img
            src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
            alt="Amenly"
            className="h-9 w-auto"
            style={{ filter: 'drop-shadow(0 0 20px rgba(44,116,179,0.4))' }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
          <span className="text-white font-bold text-lg tracking-tight">Amenly</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-green-400 font-semibold tracking-wide">AI Online</span>
          </motion.div>

          <Link
            to="/dashboard"
            className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white border border-white/10 hover:border-[#2C74B3]/40 rounded-full transition-all hover:bg-white/5"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── Sidebar (desktop only) ──────────────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden lg:flex flex-col w-80 border-r border-white/[0.06] bg-black/40 backdrop-blur-xl flex-shrink-0 p-6"
        >
          {/* Title */}
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#2C74B3]/10 border border-[#2C74B3]/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(44,116,179,0.15)]">
              <svg className="w-6 h-6 text-[#2C74B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg mb-1">Compliance Assessment</h2>
            <p className="text-white/40 text-xs leading-relaxed">
              Quick security posture check — takes about 5 minutes
            </p>
          </div>

          {/* Steps list */}
          <div className="space-y-1.5 mb-8">
            {[
              { label: 'Getting Started',      icon: '👋', desc: 'Who you are' },
              { label: 'About Your Company',   icon: '🏢', desc: 'What you do' },
              { label: 'Pick a Framework',     icon: '📋', desc: 'ISO, NIST, or GDPR' },
              { label: 'Quick Questions',      icon: '🔍', desc: '5 targeted questions' },
              { label: 'Your Results',         icon: '📊', desc: 'Score and next steps' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/[0.05] group"
              >
                <span className="text-base mt-0.5 group-hover:scale-110 transition-transform">{s.icon}</span>
                <div>
                  <p className="text-xs text-white/70 font-semibold group-hover:text-white transition-colors">{s.label}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Info box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-auto p-4 rounded-xl bg-[#2C74B3]/[0.06] border border-[#2C74B3]/10 backdrop-blur-sm"
          >
            <div className="flex items-start gap-2 mb-2">
              <svg className="w-4 h-4 text-[#2C74B3] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Everything stays on your device. We don't send your answers anywhere unless you choose to generate a report.
              </p>
            </div>
          </motion.div>
        </motion.aside>

        {/* ── Chat panel ──────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chat header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="px-6 py-4 border-b border-white/[0.06] bg-black/40 backdrop-blur-xl flex items-center gap-3 flex-shrink-0"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#2C74B3]/15 border border-[#2C74B3]/30 flex items-center justify-center shadow-[0_0_20px_rgba(44,116,179,0.2)]">
                <svg className="w-5 h-5 text-[#2C74B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-black shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Amenly Assistant</p>
              <p className="text-[11px] text-white/40">Security Compliance Advisor</p>
            </div>
          </motion.div>

          {/* Chat engine fills remaining height */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatEngine />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AICompliancePage
