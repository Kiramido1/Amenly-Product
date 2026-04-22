import { motion } from 'framer-motion'

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
    className="flex items-end gap-3 mb-6"
  >
    {/* Avatar */}
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
      <img
        src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
        alt="Amenly"
        className="w-full h-full object-contain"
        style={{ filter: 'drop-shadow(0 0 8px rgba(44,116,179,0.3))' }}
      />
    </div>

    {/* Bubble */}
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#2C74B3]/60"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </div>
  </motion.div>
)

export default TypingIndicator
