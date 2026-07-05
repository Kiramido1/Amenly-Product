import { memo } from 'react'
import { motion } from 'framer-motion'

/**
 * Audit-console chat bubble. The AI is the auditor (left); the member answers
 * (right). **bold** is supported inline.
 */
const MessageBubble = ({ message }) => {
  const isSystem = message.role === 'system' || message.role === 'ai'

  const renderText = (text) => {
    if (!text) return null
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      layout
      className={`flex items-start gap-3.5 mb-6 ${isSystem ? 'justify-start' : 'justify-end'}`}
    >
      {/* Auditor avatar */}
      {isSystem && (
        <div className="mt-0.5 w-9 h-9 rounded-[11px] bg-[#0E1116] ring-1 ring-inset ring-[#2C74B3]/25 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png" alt="Amenly Auditor" className="w-[30px] h-[30px] object-contain" />
        </div>
      )}

      <div className={`max-w-[76%] min-w-0 ${isSystem ? '' : 'flex flex-col items-end'}`}>
        {/* Auditor identity + audit tag on the AI side */}
        {isSystem && (
          <div className="flex items-center gap-2 mb-1.5 pl-1">
            <span className="font-display text-[11px] font-semibold tracking-wide text-white/55">Amenly Auditor</span>
            {message.category && (
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#5F9BD8] bg-[#2C74B3]/[0.1] border border-[#2C74B3]/20 px-1.5 py-[3px] rounded-md leading-none">
                {message.category}
              </span>
            )}
          </div>
        )}

        <div
          className={`py-3 text-[14.5px] leading-[1.65] break-words [overflow-wrap:anywhere] transition-colors ${
            isSystem
              ? 'bg-[#0D1015] border border-white/[0.06] text-white/82 rounded-2xl rounded-tl-md'
              : 'bg-gradient-to-br from-[#205295] to-[#123a63] text-white rounded-2xl rounded-tr-md border border-white/[0.08] shadow-[0_2px_20px_-8px_rgba(44,116,179,0.5)]'
          }`}
          style={{ paddingLeft: '1.05rem', paddingRight: '1.05rem' }}
        >
          {renderText(message.text)}
        </div>
      </div>

      {/* Member avatar */}
      {!isSystem && (
        <div className="mt-0.5 w-9 h-9 rounded-[11px] bg-[#14171C] border border-white/[0.08] flex items-center justify-center flex-shrink-0 font-display text-[13px] font-semibold text-white/85">
          {message.userInitial || 'U'}
        </div>
      )}
    </motion.div>
  )
}

export default memo(MessageBubble)
