import { motion } from 'framer-motion'

/**
 * Renders a grid of selectable option buttons.
 */
const OptionButtons = ({ options, onSelect, selected, columns = 2 }) => {
  const colorMap = {
    green:  'border-emerald-500/20 hover:border-emerald-400/40 hover:bg-emerald-500/5 text-emerald-400',
    yellow: 'border-amber-500/20 hover:border-amber-400/40 hover:bg-amber-500/5 text-amber-400',
    red:    'border-rose-500/20 hover:border-rose-400/40 hover:bg-rose-500/5 text-rose-400',
    blue:   'border-[#2C74B3]/20 hover:border-[#2C74B3]/40 hover:bg-[#2C74B3]/5 text-[#2C74B3]',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`grid gap-2.5 mt-4 mb-6 ${
        columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1'
      }`}
    >
      {options.map((opt, i) => {
        const isSelected = selected === opt.id
        const colorClass = colorMap[opt.color] || colorMap.blue

        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${isSelected
                ? 'border-[#2C74B3]/50 bg-[#2C74B3]/10 text-white shadow-lg shadow-[#2C74B3]/10'
                : `border-white/[0.06] bg-white/[0.02] text-white/70 ${colorClass}`
              }`}
          >
            {opt.iconPath && (
              <div className="flex-shrink-0 text-current">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={opt.iconPath} />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{opt.label}</p>
              {opt.description && (
                <p className="text-xs text-white/30 mt-0.5 truncate">{opt.description}</p>
              )}
            </div>
            {isSelected && (
              <motion.svg
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="w-4 h-4 text-[#2C74B3] ml-auto flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </motion.svg>
            )}
          </motion.button>
        )
      })}
    </motion.div>
  )
}

export default OptionButtons
