import { memo } from 'react'
import { motion } from 'framer-motion'
import { FRAMEWORKS } from '../../data/chatFlowData'

const colorMap = {
  blue: {
    border: 'border-[#2C74B3]/15 hover:border-[#2C74B3]/40',
    bg: 'bg-[#2C74B3]/[0.03] hover:bg-[#2C74B3]/[0.06]',
    icon: 'text-[#2C74B3]',
    badge: 'bg-[#2C74B3]/10 text-[#2C74B3]/90 border-[#2C74B3]/20',
    selected: 'border-[#2C74B3]/50 bg-[#2C74B3]/[0.08] shadow-lg shadow-[#2C74B3]/10',
  },
  emerald: {
    border: 'border-emerald-500/15 hover:border-emerald-500/40',
    bg: 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]',
    icon: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400/90 border-emerald-500/20',
    selected: 'border-emerald-500/50 bg-emerald-500/[0.08] shadow-lg shadow-emerald-500/10',
  },
  violet: {
    border: 'border-violet-500/15 hover:border-violet-500/40',
    bg: 'bg-violet-500/[0.03] hover:bg-violet-500/[0.06]',
    icon: 'text-violet-400',
    badge: 'bg-violet-500/10 text-violet-400/90 border-violet-500/20',
    selected: 'border-violet-500/50 bg-violet-500/[0.08] shadow-lg shadow-violet-500/10',
  },
}

const FrameworkSelector = ({ onSelect, selected, onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
    >
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#144272]/[0.08] border border-[#144272]/15 mb-4">
            <span className="text-[11px] text-[#2C74B3]/80 font-semibold tracking-wider uppercase">Step 2 of 4</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Choose your compliance framework
          </h2>
          <p className="text-white/35 text-sm">Select the standard you want to assess against</p>
        </motion.div>

        {/* Framework cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="radiogroup" aria-label="Compliance framework selection">
          {FRAMEWORKS.map((fw, i) => {
            const colors = colorMap[fw.color] || colorMap.blue
            const isSelected = selected === fw.id

            return (
              <motion.button
                key={fw.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(fw)}
                className={`relative flex flex-col items-start p-6 rounded-2xl border text-left transition-all duration-400 cursor-pointer group ${
                  isSelected ? colors.selected : `${colors.border} ${colors.bg}`
                }`}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${fw.label}: ${fw.description}`}
                id={`framework-${fw.id}`}
              >
                {/* Badge */}
                {fw.badge && (
                  <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${colors.badge}`}>
                    {fw.badge}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-400 ${isSelected ? 'border-white/[0.1]' : ''}`}>
                  <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={fw.iconPath} />
                  </svg>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-white/90 mb-1">{fw.label}</h3>
                <p className="text-xs text-white/35 leading-relaxed mb-3">{fw.description}</p>
                <p className="text-[11px] text-white/20 leading-relaxed">{fw.longDesc}</p>

                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                    className="absolute bottom-3 right-3"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${colors.icon} bg-white/[0.06]`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Back button */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            onClick={onBack}
            className="mt-8 text-xs text-white/25 hover:text-white/50 transition-colors duration-300 flex items-center gap-1.5 mx-auto"
            aria-label="Go back to previous step"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default memo(FrameworkSelector)
