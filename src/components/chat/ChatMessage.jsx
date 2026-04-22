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
        <div className="w-9 h-9 rounded-full bg-[#2C74B3]/15 border border-[#2C74B3]/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(44,116,179,0.2)]">
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
            ? 'glass-card rounded-bl-sm text-white/90'
            : 'bg-gradient-to-br from-[#2C74B3] to-[#205295] text-white rounded-br-sm shadow-[0_0_25px_rgba(44,116,179,0.3)]'
        }`}
      >
        {message.text}
      </div>

      {/* User Avatar */}
      {!isAI && (
        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white backdrop-blur-sm">
          {message.userInitial || 'U'}
        </div>
      )}
    </motion.div>
  )
}

export default ChatMessage
