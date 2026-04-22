import { motion } from 'framer-motion'

/**
 * Single chat message bubble.
 * role: 'ai' | 'user'
 */
const ChatMessage = ({ message }) => {
  const isAI = message.role === 'ai'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex items-end gap-3 mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      {/* AI Avatar */}
      {isAI && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <img
            src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
            alt="Amenly"
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 0 8px rgba(44,116,179,0.3))' }}
          />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[70%] px-5 py-4 text-base leading-relaxed ${
          isAI
            ? 'bg-white/[0.03] border border-white/[0.06] text-white/90 rounded-2xl rounded-bl-md'
            : 'bg-gradient-to-br from-[#2C74B3] to-[#205295] text-white rounded-2xl rounded-br-md shadow-lg shadow-[#2C74B3]/10'
        }`}
      >
        {message.text}
      </div>

      {/* User Avatar */}
      {!isAI && (
        <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
          {message.userInitial || 'U'}
        </div>
      )}
    </motion.div>
  )
}

export default ChatMessage
