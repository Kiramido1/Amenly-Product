import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  STEPS, SECURITY_QUESTIONS, YES_NO_OPTIONS, FRAMEWORKS,
} from '../../data/chatFlowData'
import MessageBubble from './MessageBubble'

const TypingIndicator = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}
    className="flex items-end gap-3 mb-5"
  >
    <div className="w-10 h-10 rounded-xl bg-[#144272]/15 border border-[#144272]/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm shadow-[#144272]/10">
      <img src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png" alt="Amenly" className="w-[34px] h-[34px] object-contain drop-shadow-md" />
    </div>
    <div className="bg-white/[0.025] border border-white/[0.05] rounded-2xl rounded-bl-md px-4 py-3">
      <div className="flex items-center gap-1.5" aria-label="Generating response">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#2C74B3]/50"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.15, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  </motion.div>
))
TypingIndicator.displayName = 'TypingIndicator'

const QuickReplyButton = memo(({ option, onClick, index }) => {
  const colorMap = {
    green:  'border-emerald-500/20 hover:border-emerald-400/40 hover:bg-emerald-500/[0.06] text-emerald-400',
    yellow: 'border-amber-500/20 hover:border-amber-400/40 hover:bg-amber-500/[0.06] text-amber-400',
    red:    'border-rose-500/20 hover:border-rose-400/40 hover:bg-rose-500/[0.06] text-rose-400',
  }

  const dotColorMap = {
    green: 'bg-emerald-400',
    yellow: 'bg-amber-400',
    red: 'bg-rose-400',
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(option)}
      className={`px-6 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 cursor-pointer ${colorMap[option.color] || 'border-white/[0.06] text-white/50 hover:border-[#144272]/30 hover:bg-white/[0.03]'}`}
      aria-label={`Answer: ${option.label}`}
    >
      <span className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full ${dotColorMap[option.color] || 'bg-white/40'}`} />
        {option.label}
      </span>
    </motion.button>
  )
})
QuickReplyButton.displayName = 'QuickReplyButton'

const ChatBox = ({ session, framework, onAnswer, onComplete, onBack }) => {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputDisabled, setInputDisabled] = useState(true)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const initialized = useRef(false)

  const frameworkData = FRAMEWORKS.find(f => f.id === framework)
  const questions = SECURITY_QUESTIONS[framework] || []

  // Auto-scroll
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    return () => clearTimeout(timer)
  }, [messages, isTyping, showQuickReplies])

  // Send system message with typing delay
  const sendSystem = useCallback((text, opts = {}) => {
    return new Promise((resolve) => {
      const { delay = 800, category } = opts
      setIsTyping(true)
      setInputDisabled(true)
      setShowQuickReplies(false)
      setTimeout(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          role: 'system',
          text,
          category,
        }])
        resolve()
      }, delay)
    })
  }, [])

  // Send user message
  const sendUser = useCallback((text) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role: 'user',
      text,
      userInitial: session.companyName?.[0]?.toUpperCase() || 'C',
    }])
  }, [session.companyName])

  // Ask a question
  const askQuestion = useCallback(async (index) => {
    const q = questions[index]
    if (!q) return
    await sendSystem(
      `**(${index + 1}/${questions.length})** ${q.question}`,
      { delay: 700, category: q.category }
    )
    setShowQuickReplies(true)
    setInputDisabled(true)
  }, [questions, sendSystem])

  // Initialize chat
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initChat = async () => {
      await sendSystem(
        `Welcome, **${session.companyName}**. We'll now evaluate your compliance posture against **${frameworkData?.label || framework}**.`,
        { delay: 600 }
      )
      await sendSystem(
        `There are ${questions.length} structured questions ahead. Please answer each one honestly for the most accurate compliance assessment. You can use the quick-reply buttons or type your response.`,
        { delay: 800 }
      )
      await askQuestion(0)
    }

    initChat()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle quick reply
  const handleQuickReply = useCallback(async (option) => {
    setShowQuickReplies(false)
    sendUser(option.label)

    // Record answer
    const q = questions[questionIndex]
    if (q) {
      onAnswer(q.id, option.id)
    }

    const nextIndex = questionIndex + 1
    if (nextIndex < questions.length) {
      setQuestionIndex(nextIndex)
      await askQuestion(nextIndex)
    } else {
      // All done
      await sendSystem('Assessment complete. Analyzing your responses now...', { delay: 600 })
      await sendSystem('Your compliance report is ready. Review the results panel for your detailed score and recommendations.', { delay: 1200 })
      setIsComplete(true)
      setInputDisabled(true)
      onComplete()
    }
  }, [questionIndex, questions, sendUser, askQuestion, onAnswer, onComplete, sendSystem])

  // Handle text input (allow typed yes/no/partial)
  const handleSubmit = useCallback((e) => {
    e?.preventDefault()
    const val = inputValue.trim().toLowerCase()
    if (!val || inputDisabled) return
    setInputValue('')

    // Match typed answers to quick replies
    const match = YES_NO_OPTIONS.find(o =>
      o.label.toLowerCase() === val || o.id === val
    )
    if (match) {
      handleQuickReply(match)
    }
  }, [inputValue, inputDisabled, handleQuickReply])

  const sanitize = (val) => val.replace(/[<>]/g, '')

  return (
    <div className="flex flex-col h-full">
      {/* Question progress */}
      <div className="px-4 sm:px-6 py-3 border-b border-white/[0.03] bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button onClick={onBack} className="text-white/30 hover:text-white/70 transition-colors duration-200" aria-label="Go back to framework selection">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <span className="text-xs text-white/25 font-medium">
              Question {Math.min(questionIndex + 1, questions.length)} of {questions.length}
            </span>
            {questions[questionIndex]?.category && !isComplete && (
              <span className="text-[10px] text-[#2C74B3]/80 font-semibold bg-[#2C74B3]/[0.08] px-2.5 py-0.5 rounded-full border border-[#2C74B3]/15">
                {questions[questionIndex].category}
              </span>
            )}
          </div>
          <span className="text-xs text-white/15 font-medium tabular-nums">
            {Math.round(((isComplete ? questions.length : questionIndex) / questions.length) * 100)}%
          </span>
        </div>
        <div className="relative h-1 bg-white/[0.03] rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#2C74B3] to-[#144272] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((isComplete ? questions.length : questionIndex) / questions.length) * 100}%` }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 space-y-1 scrollbar-chat"
        role="log"
        aria-label="Assessment messages"
        aria-live="polite"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>

        {/* Quick reply buttons */}
        <AnimatePresence mode="wait">
          {showQuickReplies && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap gap-2 ml-11 mt-2"
            >
              {YES_NO_OPTIONS.map((opt, i) => (
                <QuickReplyButton
                  key={opt.id}
                  option={opt}
                  onClick={handleQuickReply}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-white/[0.03] bg-[#040404]/80 backdrop-blur-xl px-4 sm:px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(sanitize(e.target.value))}
              disabled={inputDisabled && !showQuickReplies}
              placeholder={
                isComplete
                  ? 'Assessment complete'
                  : showQuickReplies
                  ? 'Type yes, no, or partially...'
                  : 'Waiting for question...'
              }
              className="w-full bg-white/[0.015] border border-white/[0.05] rounded-xl px-5 py-3.5 pr-12 text-[15px] text-white placeholder:text-white/15 outline-none focus:border-[#2C74B3]/25 focus:bg-white/[0.02] focus:shadow-[0_0_20px_rgba(44,116,179,0.04)] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300"
              aria-label="Type your answer"
              maxLength={200}
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center transition-colors duration-200"
                aria-label="Clear input"
              >
                <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={(inputDisabled && !showQuickReplies) || !inputValue.trim()}
            whileHover={(inputDisabled && !showQuickReplies) || !inputValue.trim() ? {} : { scale: 1.05 }}
            whileTap={(inputDisabled && !showQuickReplies) || !inputValue.trim() ? {} : { scale: 0.95 }}
            className="w-11 h-11 rounded-full bg-white text-black hover:bg-[#e2e2e2] disabled:bg-white/[0.05] disabled:text-white/20 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 flex-shrink-0 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] disabled:shadow-none"
            aria-label="Send answer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>
        </form>
      </div>
    </div>
  )
}

export default memo(ChatBox)
