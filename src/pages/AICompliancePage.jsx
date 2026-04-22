import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ChatEngine from '../components/chat/ChatEngine'

const AICompliancePage = () => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #0A2647 0%, #080E1A 50%, #050810 100%)' }}
    >
      {/* ── Top nav bar ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/6 bg-[#080E1A]/80 backdrop-blur-sm flex-shrink-0">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
            alt="Amenly"
            className="h-8 w-auto"
          />
          <span className="text-white font-semibold text-base tracking-tight">Amenly</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-green-400 font-medium tracking-wide">AI Online</span>
          </div>

          <Link
            to="/dashboard"
            className="px-4 py-1.5 text-xs text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-full transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar (desktop only) ──────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-72 border-r border-white/6 bg-[#060C18] flex-shrink-0 p-6">
          {/* Title */}
          <div className="mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#2C74B3]/15 border border-[#2C74B3]/30 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-[#2C74B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-base">AI Compliance Chat</h2>
            <p className="text-white/40 text-xs mt-1 leading-relaxed">
              Guided assessment powered by Amenly's compliance engine.
            </p>
          </div>

          {/* Steps list */}
          <div className="space-y-1 mb-8">
            {[
              { label: 'Welcome & Identity',      icon: '👋', desc: 'Name and role' },
              { label: 'Company Information',      icon: '🏢', desc: 'Industry & size' },
              { label: 'Framework Selection',      icon: '📋', desc: 'ISO, NIST, GDPR...' },
              { label: 'Security Assessment',      icon: '🔍', desc: 'Targeted questions' },
              { label: 'Risk Summary',             icon: '📊', desc: 'Score & report' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/3 transition-colors">
                <span className="text-sm mt-0.5">{s.icon}</span>
                <div>
                  <p className="text-xs text-white/70 font-medium">{s.label}</p>
                  <p className="text-[11px] text-white/30">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="mt-auto p-4 rounded-xl bg-[#2C74B3]/8 border border-[#2C74B3]/15">
            <p className="text-[11px] text-white/50 leading-relaxed">
              Your responses are stored locally and never sent to external servers without your consent.
            </p>
          </div>
        </aside>

        {/* ── Chat panel ──────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="px-6 py-4 border-b border-white/6 bg-[#080E1A]/60 flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#2C74B3]/20 border border-[#2C74B3]/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2C74B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#080E1A]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Amenly AI</p>
              <p className="text-[11px] text-white/40">Cybersecurity Compliance Consultant</p>
            </div>
          </div>

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
