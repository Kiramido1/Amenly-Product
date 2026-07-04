import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  completeAssessmentSession,
  createAssessment,
  getChatHistory,
  listAssessments,
  saveAssessmentAnswer,
  startAssessmentSession,
} from '../../api/assessments'
import { useWebSocket } from '../../hooks/useWebSocket'
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

const normalizeChatMessage = (message, userInitial) => ({
  id: message.id || `${message.sender || message.sender_type}-${message.timestamp || message.created_at || Date.now()}-${Math.random()}`,
  role: message.sender === 'user' || message.sender_type === 'user' ? 'user' : 'system',
  text: message.content || message.message_text || '',
  metadata: message.metadata || message.message_metadata || null,
  userInitial,
})

const buildQuestionMessage = (question, index, total) => ({
  id: `question-${question.id || index}-${Date.now()}`,
  role: 'system',
  text: `**(${index + 1}/${total})** ${question.question_text}`,
  category: question.control_code || question.control_title || 'Assigned control',
})

const ChatBox = ({ session, framework, onAnswer, onComplete, onBack }) => {
  const [assessmentSession, setAssessmentSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [messages, setMessages] = useState([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState(null)
  const [isComplete, setIsComplete] = useState(false)

  const bottomRef = useRef(null)
  const pendingNextQuestionRef = useRef(null)
  const initializedRef = useRef(false)

  const frameworkId = framework?.id || framework
  const frameworkName = framework?.name || framework?.label || 'selected framework'
  const userInitial = session.companyName?.[0]?.toUpperCase() || 'U'

  const questionProgress = questions.length
    ? Math.min(100, Math.round((currentQuestionIndex / questions.length) * 100))
    : 0

  const appendMessages = useCallback((incoming, replace = false) => {
    const normalized = incoming.map((message) => normalizeChatMessage(message, userInitial))

    setMessages((prev) => {
      if (replace) return normalized

      const seen = new Set(prev.map((message) => message.id))
      const next = normalized.filter((message) => !seen.has(message.id))
      return [...prev, ...next]
    })

    const last = normalized[normalized.length - 1]
    if (last?.role === 'system' && pendingNextQuestionRef.current !== null) {
      const nextIndex = pendingNextQuestionRef.current
      pendingNextQuestionRef.current = null
      const nextQuestion = questions[nextIndex]
      if (nextQuestion) {
        setMessages(prev => [...prev, buildQuestionMessage(nextQuestion, nextIndex, questions.length)])
        setCurrentQuestionIndex(nextIndex)
      }
    }
  }, [questions, userInitial])

  const handleWsError = useCallback((message) => {
    setError(message || 'Realtime chat connection failed')
  }, [])

  const {
    isConnected,
    isConnecting,
    connect,
    sendMessage,
  } = useWebSocket(
    assessmentSession?.id,
    appendMessages,
    setIsTyping,
    undefined,
    handleWsError,
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    return () => clearTimeout(timer)
  }, [messages, isTyping])

  useEffect(() => {
    if (!assessmentSession?.id || isConnected || isConnecting) return
    connect()
  }, [assessmentSession?.id, connect, isConnected, isConnecting])

  useEffect(() => {
    if (initializedRef.current || !frameworkId) return
    initializedRef.current = true

    const initializeAssessmentChat = async () => {
      setIsInitializing(true)
      setError(null)

      try {
        const assessmentsResponse = await listAssessments()
        const assessments = assessmentsResponse.data?.assessments || []
        let assessment = assessments.find(item => item.framework_id === frameworkId)

        if (!assessment) {
          const created = await createAssessment({
            name: `${frameworkName} Assessment`,
            frameworkId,
          })
          assessment = created.data?.assessment
        }

        if (!assessment?.id) {
          throw new Error('No assessment is available for this framework.')
        }

        const startResponse = await startAssessmentSession(assessment.id)
        const startedSession = startResponse.data?.session
        const loadedQuestions = startResponse.data?.questions || []

        if (!startedSession?.id) {
          throw new Error('Assessment session could not be started.')
        }

        setAssessmentSession(startedSession)
        setQuestions(loadedQuestions)

        const historyResponse = await getChatHistory(startedSession.id).catch(() => null)
        const historyMessages = historyResponse?.data?.messages || []

        if (historyMessages.length) {
          setMessages(historyMessages.map(message => normalizeChatMessage(message, userInitial)))
        } else {
          const initialMessages = [{
            id: `welcome-${Date.now()}`,
            role: 'system',
            text: startResponse.data?.greeting || `Welcome. I’ll run your **${frameworkName}** assessment using your assigned controls, framework context, and retrieved evidence.`,
          }]

          if (loadedQuestions[0]) {
            initialMessages.push(buildQuestionMessage(loadedQuestions[0], 0, loadedQuestions.length))
          }

          setMessages(initialMessages)
        }
      } catch (err) {
        const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to initialize assessment chat'
        setError(message)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeAssessmentChat()
  }, [frameworkId, frameworkName, userInitial])

  const currentQuestion = useMemo(
    () => questions[currentQuestionIndex] || null,
    [currentQuestionIndex, questions],
  )

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()
    const text = inputValue.trim()
    if (!text || isInitializing || isComplete || !assessmentSession?.id) return

    setInputValue('')
    setError(null)

    if (!isConnected) {
      setError('Realtime connection is not ready yet. Please wait a moment and try again.')
      return
    }

    sendMessage(text)

    if (currentQuestion) {
      saveAssessmentAnswer({
        sessionId: assessmentSession.id,
        questionId: currentQuestion.id,
        answerText: text,
      }).catch(() => {})
      onAnswer?.(currentQuestion.id, text)
    }

    const nextIndex = currentQuestionIndex + 1
    if (nextIndex < questions.length) {
      pendingNextQuestionRef.current = nextIndex
    } else if (questions.length > 0) {
      setIsComplete(true)
      completeAssessmentSession(assessmentSession.id).catch(() => {})
      onComplete?.()
    }
  }, [
    assessmentSession?.id,
    currentQuestion,
    currentQuestionIndex,
    inputValue,
    isComplete,
    isConnected,
    isInitializing,
    onAnswer,
    onComplete,
    questions.length,
    sendMessage,
  ])

  const sanitize = (val) => val.replace(/[<>]/g, '')

  return (
    <div className="flex flex-col h-full">
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
              {questions.length ? `Question ${Math.min(currentQuestionIndex + 1, questions.length)} of ${questions.length}` : 'RAG assessment interview'}
            </span>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isConnected
                ? 'text-emerald-400 bg-emerald-500/[0.08] border-emerald-500/15'
                : 'text-amber-400 bg-amber-500/[0.08] border-amber-500/15'
            }`}>
              {isConnected ? 'Live RAG' : isConnecting ? 'Connecting' : 'Offline'}
            </span>
          </div>
          <span className="text-xs text-white/15 font-medium tabular-nums">{questionProgress}%</span>
        </div>
        <div className="relative h-1 bg-white/[0.03] rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#2C74B3] to-[#144272] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${questionProgress}%` }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      </div>

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
          {(isTyping || isInitializing) && <TypingIndicator key="typing" />}
        </AnimatePresence>

        {error && (
          <div className="mx-11 mb-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-200/80">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/[0.03] bg-[#040404]/80 backdrop-blur-xl px-4 sm:px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative min-w-0">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(sanitize(e.target.value))}
              disabled={isInitializing || isComplete || !assessmentSession?.id}
              placeholder={
                isComplete
                  ? 'Assessment complete'
                  : isInitializing
                  ? 'Preparing assessment context...'
                  : isConnected
                  ? 'Answer the question or describe your infrastructure...'
                  : 'Connecting realtime chat...'
              }
              className="w-full bg-white/[0.015] border border-white/[0.05] rounded-xl px-5 py-3.5 pr-12 text-[15px] text-white placeholder:text-white/15 outline-none focus:border-[#2C74B3]/25 focus:bg-white/[0.02] focus:shadow-[0_0_20px_rgba(44,116,179,0.04)] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300"
              aria-label="Type your assessment response"
              maxLength={1000}
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
            disabled={isInitializing || isComplete || !inputValue.trim() || !assessmentSession?.id}
            whileHover={isInitializing || isComplete || !inputValue.trim() ? {} : { scale: 1.05 }}
            whileTap={isInitializing || isComplete || !inputValue.trim() ? {} : { scale: 0.95 }}
            className="w-11 h-11 rounded-full bg-white text-black hover:bg-[#e2e2e2] disabled:bg-white/[0.05] disabled:text-white/20 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 flex-shrink-0 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] disabled:shadow-none"
            aria-label="Send response"
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
