import { memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StatusIcon from './StatusIcon'

const insights = [
  { 
    type: 'critical', 
    iconType: 'warning',
    message: '5 high-risk assets detected in Finance network',
    color: '#ef4444'
  },
  { 
    type: 'warning', 
    iconType: 'trendDown',
    message: 'Compliance dropped 3% due to missing GDPR controls',
    color: '#94A3B8'
  },
  { 
    type: 'info', 
    iconType: 'calendar',
    message: 'Next audit in 3 days – 2 requirements incomplete',
    color: '#2C74B3'
  },
  { 
    type: 'success', 
    iconType: 'check',
    message: '12 vulnerabilities patched in the last 24 hours',
    color: '#10b981'
  },
  { 
    type: 'warning', 
    iconType: 'search',
    message: 'AI detected unusual login pattern from VPN Gateway',
    color: '#94A3B8'
  },
  { 
    type: 'info', 
    iconType: 'lightning',
    message: 'Real-time threat intelligence updated: 3 new CVEs',
    color: '#06b6d4'
  },
]

const AIInsightBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const current = insights[currentIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden"
    >
      {/* Gradient background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent, ${current.color}15, transparent)`
        }}
      />
      
      {/* Animated border */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage: `linear-gradient(90deg, transparent, ${current.color}40, transparent)`,
          backgroundSize: '200% 100%',
        }}
      />

      <div className="relative px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 bg-black/40 backdrop-blur-xl border-y border-white/5">
        {/* AI Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amenly-light/10 to-amenly-medium/10 border border-amenly-light/20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <svg className="w-4 h-4 text-amenly-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </motion.div>
          <span className="text-[10px] font-bold text-amenly-light tracking-wider uppercase">AI Insight</span>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <StatusIcon 
                type={current.iconType} 
                color={current.color} 
                className="w-5 h-5 flex-shrink-0"
              />
              <p className="text-sm text-white/80 font-medium truncate">{current.message}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {insights.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: i === currentIndex ? '24px' : '6px',
                backgroundColor: i === currentIndex ? current.color : 'rgba(255,255,255,0.2)',
              }}
              animate={{
                width: i === currentIndex ? '24px' : '6px',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default memo(AIInsightBar)
