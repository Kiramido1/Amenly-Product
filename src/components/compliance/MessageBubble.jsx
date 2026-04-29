import { memo } from 'react'
import { motion } from 'framer-motion'

/**
 * Chat message bubble with markdown-like bold support.
 * role: 'system' | 'user'
 */
const MessageBubble = ({ message }) => {
  const isSystem = message.role === 'system' || message.role === 'ai'

  // Simple bold text parser: **text** → <strong>
  const renderText = (text) => {
    if (!text) return null
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white/95">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      layout
      className={`flex items-end gap-3 mb-5 ${isSystem ? 'justify-start' : 'justify-end'}`}
    >
      {/* System Avatar — App Logo */}
      {isSystem && (
        <div className="w-10 h-10 rounded-xl bg-[#144272]/15 border border-[#144272]/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm shadow-[#144272]/10">
          <img src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png" alt="Amenly" className="w-[34px] h-[34px] object-contain drop-shadow-md" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-5 py-3.5 text-[15px] leading-relaxed break-words overflow-wrap-anywhere ${
          isSystem
            ? 'bg-white/[0.02] border border-white/[0.04] text-white/80 rounded-2xl rounded-bl-md shadow-sm'
            : 'bg-gradient-to-br from-[#144272] to-[#0A2647] text-white/95 rounded-2xl rounded-br-md shadow-md shadow-[#144272]/8 border border-[#144272]/20'
        }`}
      >
        {isSystem && message.category && (
          <span className="inline-block text-[10px] text-[#2C74B3]/80 font-semibold uppercase tracking-wider mb-1.5 bg-[#2C74B3]/[0.08] px-2.5 py-0.5 rounded-full border border-[#2C74B3]/15">
            {message.category}
          </span>
        )}
        <div>{renderText(message.text)}</div>
      </div>

      {/* User Avatar */}
      {!isSystem && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#144272] to-[#0A2647] border border-[#144272]/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white/90 shadow-sm">
          {message.userInitial || 'U'}
        </div>
      )}
    </motion.div>
  )
}

export default memo(MessageBubble)
