import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createAssessment, listAssessments, startAssessmentSession } from '../../api/assessments'
import { useWebSocket } from '../../hooks/useWebSocket'
import MessageBubble from './MessageBubble'

const TypingIndicator = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }} className="flex items-end gap-3 mb-5"
  >
    <div className="w-10 h-10 rounded-xl bg-[#144272]/15 border border-[#144272]/20 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm shadow-[#144272]/10">
      <img src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png" alt="Amenly" className="w-[34px] h-[34px] object-contain drop-shadow-md" />
    </div>
    <div className="bg-white/[0.025] border border-white/[0.05] rounded-2xl rounded-bl-md px-4 py-3">
      <div className="flex items-center gap-1.5" aria-label="The auditor is typing">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-[#2C74B3]/50"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.15, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'easeInOut' }} />
        ))}
      </div>
    </div>
  </motion.div>
))
TypingIndicator.displayName = 'TypingIndicator'

const normalize = (m, userInitial) => ({
  id: m.id || `${m.sender || m.sender_type}-${m.timestamp || m.created_at || Date.now()}-${Math.random()}`,
  role: m.sender === 'user' || m.sender_type === 'user' ? 'user' : 'system',
  text: m.content || m.message_text || '',
  metadata: m.metadata || m.message_metadata || null,
  category: (m.metadata || m.message_metadata || {})?.control_id ? 'Control question' : undefined,
  userInitial,
})

const ChatBox = ({ session, framework, onComplete, onBack }) => {
  const [assessmentSession, setAssessmentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, done: 0, total: 0 })

  const bottomRef = useRef(null)
  const initializedRef = useRef(false)

  const frameworkId = framework?.id || framework
  const frameworkName = framework?.name || framework?.label || 'selected framework'
  const userInitial = session.companyName?.[0]?.toUpperCase() || 'U'

  // Pull live progress from the latest AI turn's metadata (the AI drives).
  const applyProgressFrom = useCallback((normalized) => {
    for (let i = normalized.length - 1; i >= 0; i--) {
      const meta = normalized[i].metadata
      if (meta && typeof meta.percent === 'number') {
        setProgress({ percent: meta.percent, done: meta.controls_done ?? 0, total: meta.controls_total ?? 0 })
        break
      }
    }
  }, [])

  const appendMessages = useCallback((incoming, replace = false) => {
    const normalized = incoming.map((m) => normalize(m, userInitial))
    setMessages((prev) => {
      if (replace) return normalized
      const seen = new Set(prev.map((m) => m.id))
      return [...prev, ...normalized.filter((m) => !seen.has(m.id))]
    })
    applyProgressFrom(normalized)
  }, [userInitial, applyProgressFrom])

  const handleWsError = useCallback((m) => setError(m || 'Realtime connection failed'), [])
  const handleComplete = useCallback((meta) => {
    if (meta && typeof meta.percent === 'number') {
      setProgress({ percent: 100, done: meta.controls_total ?? 0, total: meta.controls_total ?? 0 })
    }
    setIsComplete(true)
    onComplete?.()
  }, [onComplete])

  const { isConnected, isConnecting, connect, sendMessage } = useWebSocket(
    assessmentSession?.id, appendMessages, setIsTyping, undefined, handleWsError, handleComplete,
  )

  useEffect(() => {
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    return () => clearTimeout(t)
  }, [messages, isTyping])

  useEffect(() => {
    if (!assessmentSession?.id || isConnected || isConnecting) return
    connect()
  }, [assessmentSession?.id, connect, isConnected, isConnecting])

  // Start the session (the WebSocket then opens the interview and the AI leads).
  useEffect(() => {
    if (initializedRef.current || !frameworkId) return
    initializedRef.current = true

    const init = async () => {
      setIsInitializing(true); setError(null)
      try {
        const list = await listAssessments()
        let assessment = (list.data?.assessments || []).find((a) => a.framework_id === frameworkId)
        if (!assessment) {
          const created = await createAssessment({ name: `${frameworkName} Assessment`, frameworkId })
          assessment = created.data?.assessment
        }
        if (!assessment?.id) throw new Error('No assessment is available for this framework.')

        const started = await startAssessmentSession(assessment.id)
        const startedSession = started.data?.session
        if (!startedSession?.id) throw new Error('Assessment session could not be started.')
        setAssessmentSession(startedSession)
        // Messages (history + the AI's opening question) arrive over the WebSocket.
      } catch (err) {
        setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to start the interview')
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  }, [frameworkId, frameworkName])

  const canType = isConnected && !isInitializing && !isComplete && !isTyping

  const handleSubmit = useCallback((e) => {
    e?.preventDefault()
    const text = inputValue.trim()
    if (!text || !canType || !assessmentSession?.id) return
    setInputValue(''); setError(null)
    // The AI evaluates this answer and asks the next question / a follow-up.
    sendMessage(text)
  }, [inputValue, canType, assessmentSession?.id, sendMessage])

  const sanitize = (v) => v.replace(/[<>]/g, '')

  return (
    <div className="flex flex-col h-full">
      {/* Header + progress */}
      <div className="px-4 sm:px-6 py-3 border-b border-white/[0.03] bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button onClick={onBack} className="text-white/30 hover:text-white/70 transition-colors" aria-label="Back">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            <span className="text-xs text-white/40 font-medium truncate">AI Compliance Interview · {frameworkName}</span>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
              isComplete ? 'text-emerald-400 bg-emerald-500/[0.08] border-emerald-500/15'
              : isConnected ? 'text-[#5F9BD8] bg-[#2C74B3]/[0.1] border-[#2C74B3]/20'
              : 'text-amber-400 bg-amber-500/[0.08] border-amber-500/15'}`}>
              {isComplete ? 'Completed' : isConnected ? 'AI live' : isConnecting ? 'Connecting' : 'Offline'}
            </span>
          </div>
          <span className="text-xs text-white/30 font-medium tabular-nums whitespace-nowrap">
            {progress.total ? `${progress.done}/${progress.total} controls · ${progress.percent}%` : `${progress.percent}%`}
          </span>
        </div>
        <div className="relative h-1 bg-white/[0.03] rounded-full overflow-hidden">
          <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#2C74B3] to-[#144272] rounded-full"
            initial={{ width: 0 }} animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 space-y-1 scrollbar-chat"
        role="log" aria-label="Interview messages" aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {(isTyping || isInitializing) && <TypingIndicator key="typing" />}
        </AnimatePresence>

        {isComplete && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mx-11 mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm text-emerald-200/90">Interview complete — your responses have been recorded and scored for the compliance report.</p>
          </motion.div>
        )}

        {error && (
          <div className="mx-11 mb-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-200/80">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.03] bg-[#040404]/80 backdrop-blur-xl px-4 sm:px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative min-w-0">
            <input type="text" value={inputValue} onChange={(e) => setInputValue(sanitize(e.target.value))}
              disabled={!canType}
              placeholder={
                isComplete ? 'Interview complete'
                : isInitializing ? 'Starting your interview…'
                : isTyping ? 'The auditor is thinking…'
                : isConnected ? 'Answer the auditor’s question…'
                : 'Connecting…'}
              className="w-full bg-white/[0.015] border border-white/[0.05] rounded-xl px-5 py-3.5 pr-12 text-[15px] text-white placeholder:text-white/15 outline-none focus:border-[#2C74B3]/25 focus:bg-white/[0.02] focus:shadow-[0_0_20px_rgba(44,116,179,0.04)] disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              aria-label="Your answer" maxLength={1500} />
            {inputValue && (
              <button type="button" onClick={() => setInputValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center transition-colors" aria-label="Clear">
                <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <motion.button type="submit" disabled={!canType || !inputValue.trim()}
            whileHover={!canType || !inputValue.trim() ? {} : { scale: 1.05 }}
            whileTap={!canType || !inputValue.trim() ? {} : { scale: 0.95 }}
            className="w-11 h-11 rounded-full bg-white text-black hover:bg-[#e2e2e2] disabled:bg-white/[0.05] disabled:text-white/20 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] disabled:shadow-none"
            aria-label="Send">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </motion.button>
        </form>
      </div>
    </div>
  )
}

export default memo(ChatBox)
