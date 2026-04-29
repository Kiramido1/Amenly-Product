import { memo, useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { summaryStats, frameworkScores } from '../../data/mockCompliance'

const AnimatedCounter = ({ target, duration = 1.8, suffix = '' }) => {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return <span>{count}{suffix}</span>
}

const cards = [
  { label: 'Compliance Score', value: summaryStats.overallCompliance, suffix: '%', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', accent: '#2C74B3', hasRing: true, glow: true },
  { label: 'Risk Average', value: summaryStats.riskAverage, suffix: '/100', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', accent: summaryStats.riskAverage <= 35 ? '#10b981' : summaryStats.riskAverage <= 60 ? '#94A3B8' : '#ef4444', hasRing: false, glow: false },
  { label: 'Total Assets', value: summaryStats.totalAssets, suffix: '', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', accent: '#2C74B3', hasRing: false, glow: false },
  { label: 'Critical Assets', value: summaryStats.criticalAssets, suffix: '', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', accent: '#ef4444', hasRing: false, glow: true, pulse: true },
]

const StatsCards = () => (
  <div className="space-y-4">
    {/* Main stat cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="group relative"
          whileHover={{ y: -4 }}
        >
          {/* Glow effect on hover */}
          {card.glow && (
            <motion.div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at center, ${card.accent}20, transparent 70%)`,
                filter: 'blur(20px)',
              }}
            />
          )}
          
          {/* Pulse effect for critical */}
          {card.pulse && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{
                background: `radial-gradient(circle at center, ${card.accent}15, transparent 70%)`,
                filter: 'blur(15px)',
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          <div 
            className="relative p-4 sm:p-5 rounded-xl bg-black/60 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-500" 
            style={{ 
              boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.05), 0 4px 24px -4px rgba(0,0,0,0.6)` 
            }}
          >
            {/* Top accent line */}
            <div 
              className="absolute top-0 left-4 right-4 h-[2px] rounded-full" 
              style={{ 
                background: `linear-gradient(90deg, transparent, ${card.accent}60, transparent)` 
              }} 
            />

            <div className="flex items-start justify-between mb-3">
              <motion.div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center backdrop-blur-sm" 
                style={{ 
                  backgroundColor: `${card.accent}15`, 
                  border: `1px solid ${card.accent}30`,
                  boxShadow: `0 0 20px ${card.accent}20`,
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <svg className="w-5 h-5" style={{ color: card.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                </svg>
              </motion.div>
              
              {card.hasRing && (
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                    <motion.circle 
                      cx="18" 
                      cy="18" 
                      r="15" 
                      fill="none" 
                      stroke={card.accent} 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeDasharray={`${card.value * 0.942} 100`} 
                      initial={{ strokeDasharray: '0 100' }} 
                      animate={{ strokeDasharray: `${card.value * 0.942} 100` }} 
                      transition={{ duration: 1.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }} 
                      style={{ filter: `drop-shadow(0 0 4px ${card.accent}60)` }} 
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: card.accent }}>{card.value}%</span>
                </div>
              )}
            </div>

            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-none mb-1">
              <AnimatedCounter target={card.value} suffix={card.suffix} />
            </div>
            <p className="text-[10px] sm:text-[11px] text-white/40 font-medium uppercase tracking-wider">{card.label}</p>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Framework compliance row */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {frameworkScores.map((fw, i) => (
        <motion.div 
          key={fw.id} 
          className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-300"
          whileHover={{ y: -2 }}
        >
          <motion.div 
            className="w-8 h-8 rounded-md flex items-center justify-center backdrop-blur-sm flex-shrink-0" 
            style={{
              backgroundColor: fw.score >= 85 ? 'rgba(44,116,179,0.15)' : fw.score >= 70 ? 'rgba(32,82,149,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${fw.score >= 85 ? 'rgba(44,116,179,0.3)' : fw.score >= 70 ? 'rgba(32,82,149,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <svg 
              className="w-4 h-4" 
              style={{ color: fw.score >= 85 ? '#2C74B3' : fw.score >= 70 ? '#205295' : '#ef4444' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={fw.icon} />
            </svg>
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-white/70 truncate">{fw.label}</span>
              <span 
                className="text-[11px] font-bold" 
                style={{ color: fw.score >= 85 ? '#2C74B3' : fw.score >= 70 ? '#205295' : '#ef4444' }}
              >
                {fw.score}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  backgroundColor: fw.score >= 85 ? '#2C74B3' : fw.score >= 70 ? '#205295' : '#ef4444',
                  boxShadow: `0 0 10px ${fw.score >= 85 ? 'rgba(44,116,179,0.4)' : fw.score >= 70 ? 'rgba(32,82,149,0.4)' : 'rgba(239,68,68,0.4)'}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${fw.score}%` }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </div>
)

export default memo(StatsCards)
