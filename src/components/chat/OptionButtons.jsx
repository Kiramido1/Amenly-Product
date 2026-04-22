import { motion } from 'framer-motion'

/**
 * Renders a grid of selectable option buttons.
 * options: [{ id, label, description?, icon?, color? }]
 * onSelect: (option) => void
 * selected: id of selected option (optional, for single-select highlight)
 * columns: grid columns (default 2)
 */
const OptionButtons = ({ options, onSelect, selected, columns = 2 }) => {
  const colorMap = {
    green:  'border-green-500/30 hover:border-green-400/60 hover:bg-green-500/8 text-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]',
    yellow: 'border-yellow-500/30 hover:border-yellow-400/60 hover:bg-yellow-500/8 text-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]',
    red:    'border-red-500/30 hover:border-red-400/60 hover:bg-red-500/8 text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    blue:   'border-[#2C74B3]/30 hover:border-[#2C74B3]/70 hover:bg-[#2C74B3]/8 text-[#2C74B3] hover:shadow-[0_0_20px_rgba(44,116,179,0.2)]',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`grid gap-2.5 mt-3 mb-4 ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}
    >
      {options.map((opt, i) => {
        const isSelected = selected === opt.id
        const colorClass = colorMap[opt.color] || colorMap.blue

        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left text-sm
              transition-all duration-200 cursor-pointer backdrop-blur-sm
              ${isSelected
                ? 'border-[#2C74B3] bg-[#2C74B3]/15 text-white shadow-[0_0_25px_rgba(44,116,179,0.3)]'
                : `border-white/[0.08] bg-white/[0.02] text-white/70 ${colorClass}`
              }`}
          >
            {opt.icon && <span className="text-lg flex-shrink-0">{opt.icon}</span>}
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{opt.label}</p>
              {opt.description && (
                <p className="text-[11px] text-white/40 mt-0.5 truncate">{opt.description}</p>
              )}
            </div>
            {isSelected && (
              <svg className="w-4 h-4 text-[#2C74B3] ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </motion.button>
        )
      })}
    </motion.div>
  )
}

export default OptionButtons
