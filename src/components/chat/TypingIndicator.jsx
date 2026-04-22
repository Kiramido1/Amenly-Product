import { motion } from 'framer-motion'

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    className="flex items-end gap-3 mb-4"
  >
    {/* Avatar */}
    <div className="w-8 h-8 rounded-full bg-[#2C74B3]/20 border border-[#2C74B3]/40 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-[#2C74B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>

    {/* Bubble */}
    <div className="bg-[#0D1B2E] border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex items-center gap-1.5">
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#2C74B3]"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay }}
          />
        ))}
      </div>
      <p className="text-[10px] text-white/30 mt-1 tracking-wide">Amenly AI is typing...</p>
    </div>
  </motion.div>
)

export default TypingIndicator
