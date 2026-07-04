import { memo } from 'react'
import { motion } from 'framer-motion'
import { useFrameworks } from '../../hooks/useFrameworks'

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

const iconByCategory = {
  cybersecurity: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  data_protection: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  default: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
}

const FrameworkSelector = ({ onSelect, selected, onBack }) => {
  const { frameworks, isLoading, error, refetch } = useFrameworks()
  const cards = frameworks.map((framework, index) => ({
    id: framework.id,
    label: framework.name,
    description: framework.description || `${framework.framework_type || 'Compliance'} framework`,
    longDesc: [framework.category?.replaceAll('_', ' '), framework.region, framework.industry].filter(Boolean).join(' • '),
    iconPath: iconByCategory[framework.category] || iconByCategory.default,
    color: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'emerald' : 'violet',
    badge: framework.is_mandatory ? 'Required' : framework.version || '',
    raw: framework,
  }))

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
          {isLoading && (
            <div className="col-span-full flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-white/10 border-t-[#2C74B3] rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && cards.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <h3 className="text-white font-semibold mb-2">No frameworks assigned</h3>
              <p className="text-white/40 text-sm mb-5">
                {error
                  ? 'Unable to load frameworks from the API.'
                  : 'Add frameworks from the Admin Panel, then refresh. Make sure you are signed in to the same organization.'}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2C74B3]/15 border border-[#2C74B3]/30 text-[#2C74B3] hover:bg-[#2C74B3]/25 transition-colors text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh
              </button>
            </div>
          )}

          {!isLoading && cards.map((fw, i) => {
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
                onClick={() => onSelect(fw.raw)}
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
