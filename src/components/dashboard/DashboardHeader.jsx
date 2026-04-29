import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDashboard } from '../../context/DashboardContext'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'secure', label: 'Secure' },
  { key: 'warning', label: 'Warning' },
  { key: 'critical', label: 'Critical' },
]

const DashboardHeader = () => {
  const { filterStatus, setFilter } = useDashboard()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative z-30 bg-black/80 backdrop-blur-2xl border-b border-white/5"
    >
      {/* Subtle glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="relative flex-shrink-0">
            <motion.div 
              className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" 
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <img src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png" alt="Amenly" className="h-7 sm:h-9 w-auto relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-base sm:text-lg tracking-tight leading-none">Amenly</span>
            <span className="text-blue-400/60 text-[8px] sm:text-[9px] font-medium tracking-[0.2em] uppercase">AI-Powered Compliance Platform</span>
          </div>
        </Link>

        {/* Filters */}
        <div className="hidden md:flex items-center gap-1 bg-black/60 rounded-xl p-1 border border-white/10 backdrop-blur-sm">
          {FILTERS.map((f) => (
            <motion.button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300 relative ${
                filterStatus === f.key
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filterStatus === f.key && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30"
                  style={{
                    boxShadow: '0 0 20px rgba(59,130,246,0.2)',
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          {/* LIVE Indicator */}
          <motion.div 
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm"
            animate={{
              boxShadow: [
                '0 0 10px rgba(16,185,129,0.2)',
                '0 0 20px rgba(16,185,129,0.4)',
                '0 0 10px rgba(16,185,129,0.2)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Live</span>
          </motion.div>
          
          {/* Assessment Button */}
          <Link 
            to="/ai-compliance" 
            className="group flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 text-white/70 hover:text-white text-[11px] font-medium backdrop-blur-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="hidden sm:inline">Assessment</span>
          </Link>
        </div>
      </div>
      
      {/* Bottom glow line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
    </motion.header>
  )
}

export default memo(DashboardHeader)
