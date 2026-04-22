import { motion } from 'framer-motion'

/**
 * Single chat message bubble.
 * role: 'ai' | 'user'
 */
const ChatMessage = ({ message }) => {
  const isAI = message.role === 'ai'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex items-end gap-3 mb-4 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      {/* AI Avatar */}
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-[#2C74B3]/20 border border-[#2C74B3]/40 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#2C74B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? 'bg-[#0D1B2E] border border-white/8 text-white/90 rounded-bl-sm'
            : 'bg-[#2C74B3] text-white rounded-br-sm'
        }`}
      >
        {message.text}
      </div>

      {/* User Avatar */}
      {!isAI && (
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white">
          {message.userInitial || 'U'}
        </div>
      )}
    </motion.div>
  )
}

export default ChatMessage
