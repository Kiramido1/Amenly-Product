import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ChatEngine from '../components/chat/ChatEngine'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'

const AICompliancePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amenly-dark/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amenly-darkest/5 via-transparent to-transparent" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(44,116,179,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(44,116,179,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Skip to main content - Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
          bg-[#144272] text-white px-4 py-2 rounded-lg z-[100] focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Top navigation */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-20 bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-white/5 overflow-hidden"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between overflow-hidden">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg bg-gradient-to-r from-amenly-light/20 to-amenly-dark/20 border border-amenly-light/30 flex items-center justify-center
              focus:outline-none focus:ring-2 focus:ring-amenly-light/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 hover:from-amenly-light/30 hover:to-amenly-dark/30"
            aria-label="Open progress menu"
            aria-expanded={sidebarOpen}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group relative min-w-0 flex-shrink-0">
            <motion.div 
              className="relative flex-shrink-0"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <motion.div 
                className="absolute inset-0 bg-amenly-light/15 blur-xl rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <motion.img
                src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
                alt="Amenly Security AI Logo"
                className="h-7 sm:h-9 w-auto relative z-10"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              />
            </motion.div>
            <motion.div 
              className="flex flex-col min-w-0"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <span className="text-white font-bold text-base sm:text-lg tracking-tight leading-none truncate">Amenly</span>
              <motion.span 
                className="text-amenly-light/70 text-[8px] sm:text-[9px] font-medium tracking-widest uppercase truncate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                AI-Powered Compliance Platform
              </motion.span>
            </motion.div>
          </Link>

          {/* Right Section */}
          <motion.div 
            className="flex items-center gap-2 sm:gap-4 flex-shrink-0"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Status Indicator */}
            <motion.div 
              className="hidden sm:flex items-center gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <div className="relative">
                <motion.div 
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  animate={{ 
                    boxShadow: [
                      '0 0 0 0 rgba(16, 185, 129, 0.7)',
                      '0 0 0 6px rgba(16, 185, 129, 0)',
                    ]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut'
                  }}
                />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <motion.span 
                className="text-[10px] sm:text-[11px] text-emerald-300 font-semibold tracking-wide"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ACTIVE
              </motion.span>
            </motion.div>

            {/* Dashboard Button */}
            <Link
              to="/dashboard"
              className="group relative px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white/70 
                rounded-lg overflow-hidden transition-all duration-300 hover:text-white hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-amenly-light/50 focus:ring-offset-2 focus:ring-offset-black"
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-amenly-light/0 via-amenly-light/10 to-amenly-darkest/0"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              <div className="absolute inset-0 border border-white/[0.08] group-hover:border-amenly-light/30 
                rounded-lg transition-colors duration-300" />
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                <motion.svg 
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </motion.svg>
                <span className="hidden sm:inline">Dashboard</span>
              </span>
            </Link>
          </motion.div>
        </div>
        
        {/* Bottom gradient line with animation */}
        <motion.div 
          className="h-[1px] bg-gradient-to-r from-transparent via-[#144272]/50 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto flex gap-0 flex-1 overflow-hidden">
          
          {/* Mobile Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
            )}
          </AnimatePresence>

          {/* Left sidebar - Steps overview */}
          <motion.aside
            initial={false}
            animate={{ 
              x: sidebarOpen ? 0 : '-100%',
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:relative inset-y-0 left-0 w-80 lg:w-80 flex-shrink-0 bg-[#0a0a0a]/95 lg:bg-black/40 backdrop-blur-xl z-50 lg:z-auto border-r border-white/5 overflow-hidden"
            style={{ top: '73px' }}
          >
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 
                flex items-center justify-center transition-colors z-10
                focus:outline-none focus:ring-2 focus:ring-[#144272]"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="h-full overflow-y-auto overflow-x-hidden p-8 space-y-8 scrollbar-chat">
              {/* Header */}
              <div className="pr-2">
                <div className="inline-flex items-center gap-2 mb-4">
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-amenly-light flex-shrink-0"
                    animate={{ 
                      boxShadow: [
                        '0 0 0 0 rgba(44, 116, 179, 0.7)',
                        '0 0 0 4px rgba(44, 116, 179, 0)',
                      ]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeOut'
                    }}
                  />
                  <span className="text-[11px] text-white/50 uppercase tracking-[0.15em] font-semibold whitespace-nowrap">Assessment</span>
                </div>
                <h2 className="text-white font-bold text-2xl mb-3 tracking-tight break-words">Security Check</h2>
                <p className="text-white/50 text-sm leading-relaxed break-words">
                  Complete 5-step compliance assessment
                </p>
              </div>

              {/* Progress steps */}
              <div className="space-y-3 pr-2">
                {[
                  { label: 'Identity', desc: 'Name and role', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'Company', desc: 'Industry and size', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                  { label: 'Framework', desc: 'ISO, NIST, GDPR', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                  { label: 'Questions', desc: '5 quick checks', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'Results', desc: 'Your score', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    className="group relative"
                  >
                    <div className="flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 hover:bg-white/[0.03] cursor-default border border-transparent hover:border-white/[0.05]">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] flex items-center justify-center transition-all duration-300 group-hover:border-[#144272]/40 group-hover:bg-[#144272]/10 group-hover:scale-110">
                          <svg className="w-5 h-5 text-white/50 group-hover:text-[#144272] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors duration-300 truncate">{step.label}</p>
                        <p className="text-xs text-white/40 mt-1 truncate">{step.desc}</p>
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
                className="px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.05] mr-2"
              >
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-4 h-4 text-[#144272] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm font-semibold text-white/80 whitespace-nowrap">Privacy First</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed break-words">
                  All data stays on your device. Nothing is sent to our servers unless you request a report.
                </p>
              </motion.div>
            </div>
            
            {/* Vertical separator line */}
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#144272]/60 to-transparent" />
          </motion.aside>

          {/* Chat area */}
          <motion.main
            id="main-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1 flex flex-col min-w-0 h-full"
          >
            <div className="flex-1 flex flex-col bg-[#0A0A0A]/20 backdrop-blur-xl overflow-hidden">
              <ErrorBoundary>
                <ChatEngine />
              </ErrorBoundary>
            </div>
          </motion.main>
        </div>

        {/* Footer */}
        <Footer />
      </div>

      {/* Screen reader live region for announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" id="sr-announcements" />
    </div>
  )
}

export default AICompliancePage
