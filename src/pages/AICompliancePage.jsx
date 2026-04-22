import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ChatEngine from '../components/chat/ChatEngine'

const AICompliancePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Subtle glow effects - very minimal */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2C74B3]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#205295]/[0.02] rounded-full blur-[100px] pointer-events-none" />

      {/* Top navigation */}
      <header className="relative z-20 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.img
              src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
              alt="Amenly"
              className="h-8 w-auto"
              style={{ filter: 'drop-shadow(0 0 12px rgba(44,116,179,0.3))' }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            />
            <span className="text-white font-bold text-lg tracking-tight">Amenly</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">Online</span>
            </div>

            <Link
              to="/dashboard"
              className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-all duration-200"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-stretch overflow-hidden">
        <div className="w-full flex gap-0 h-full">
          
          {/* Left sidebar - Steps overview */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="hidden lg:block w-64 flex-shrink-0 border-r border-white/[0.04] bg-black/20"
          >
            <div className="h-full overflow-y-auto p-6 space-y-6">
              {/* Header */}
              <div>
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="w-1 h-1 rounded-full bg-[#2C74B3]" />
                  <span className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold">Assessment</span>
                </div>
                <h2 className="text-white font-bold text-lg mb-2">Security Check</h2>
                <p className="text-white/40 text-xs leading-relaxed">
                  5-minute compliance assessment
                </p>
              </div>

              {/* Progress steps */}
              <div className="space-y-2">
                {[
                  { label: 'Identity', desc: 'Name and role', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  { label: 'Company', desc: 'Industry and size', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                  { label: 'Framework', desc: 'ISO, NIST, GDPR', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { label: 'Questions', desc: '5 quick checks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                  { label: 'Results', desc: 'Your score', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    className="group relative"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-white/[0.02] cursor-default">
                      <div className="relative flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center transition-all duration-200 group-hover:border-[#2C74B3]/30 group-hover:bg-[#2C74B3]/5">
                          <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-[#2C74B3] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/70 group-hover:text-white transition-colors duration-200">{step.label}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Privacy note */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-start gap-2.5">
                  <svg className="w-3.5 h-3.5 text-[#2C74B3] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    All data stays on your device. Nothing is sent to our servers unless you request a report.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.aside>

          {/* Chat area */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1 flex flex-col min-w-0 h-full"
          >
            <div className="flex-1 flex flex-col bg-white/[0.02] backdrop-blur-xl border-l border-white/[0.04] overflow-hidden">
              <ChatEngine />
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  )
}

export default AICompliancePage
