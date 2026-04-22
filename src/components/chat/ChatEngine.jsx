import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  STEPS, FRAMEWORKS, INDUSTRIES, COMPANY_SIZES,
  SECURITY_QUESTIONS, YES_NO_OPTIONS,
} from '../../data/chatFlowData'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import OptionButtons from './OptionButtons'
import SummaryCard from './SummaryCard'
import ProgressBar from './ProgressBar'

// ─── helpers ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'amenly_chat_session'

const stepIndex = {
  [STEPS.WELCOME]:            0,
  [STEPS.COMPANY_INFO]:       1,
  [STEPS.FRAMEWORK]:          2,
  [STEPS.SECURITY_QUESTIONS]: 3,
  [STEPS.SUMMARY]:            4,
}

const initialSession = {
  name: '', role: '', companyDescription: '',
  industry: '', companySize: '', framework: '',
  securityAnswers: {},
}

// ─── component ──────────────────────────────────────────────────────────────

const ChatEngine = () => {
  const [messages, setMessages]       = useState([])
  const [session, setSession]         = useState(initialSession)
  const [step, setStep]               = useState(STEPS.WELCOME)
  const [subStep, setSubStep]         = useState(0)   // within a step
  const [isTyping, setIsTyping]       = useState(false)
  const [inputValue, setInputValue]   = useState('')
  const [inputDisabled, setInputDisabled] = useState(false)
  const [showOptions, setShowOptions] = useState(null) // { type, options }
  const [questionIndex, setQuestionIndex] = useState(0)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const initialized = useRef(false)

  // ── auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── restore session from localStorage ─────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { messages: m, session: s, step: st, subStep: ss, questionIndex: qi } = JSON.parse(saved)
        setMessages(m || [])
        setSession(s || initialSession)
        setStep(st || STEPS.WELCOME)
        setSubStep(ss || 0)
        setQuestionIndex(qi || 0)
        // If we're mid-flow, disable input until options are shown
        if (st === STEPS.FRAMEWORK || st === STEPS.SECURITY_QUESTIONS) {
          setInputDisabled(true)
        }
        return
      } catch { /* ignore */ }
    }
    // Fresh start — send welcome message
    sendAI("Hi there! I'm here to help you understand your organization's security posture. This will take about 5 minutes.", () => {
      sendAI("Let's start with the basics — what's your name and role? (e.g., Sarah, CISO)")
    })
  }, [])

  // ── persist to localStorage ────────────────────────────────────────────────
  useEffect(() => {
    if (!initialized.current) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, session, step, subStep, questionIndex }))
  }, [messages, session, step, subStep, questionIndex])

  // ── send AI message with typing delay ─────────────────────────────────────
  const sendAI = useCallback((text, onDone, delay = 900) => {
    setIsTyping(true)
    setInputDisabled(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text }])
      setInputDisabled(false)
      inputRef.current?.focus()
      onDone?.()
    }, delay)
  }, [])

  // ── send user message ──────────────────────────────────────────────────────
  const sendUser = useCallback((text, initial = '') => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      text,
      userInitial: initial || session.name?.[0]?.toUpperCase() || 'U',
    }])
  }, [session.name])

  // ── handle text input submit ───────────────────────────────────────────────
  const handleSubmit = (e) => {
    e?.preventDefault()
    const val = inputValue.trim()
    if (!val || inputDisabled) return
    setInputValue('')
    processTextInput(val)
  }

  const processTextInput = (val) => {
    // ── WELCOME step ──────────────────────────────────────────────────────────
    if (step === STEPS.WELCOME) {
      sendUser(val)
      // Parse "Name, Role" or just name
      const parts = val.split(/,|·|-/).map(s => s.trim())
      const name = parts[0] || val
      const role = parts[1] || 'Team Member'
      setSession(s => ({ ...s, name, role }))

      sendAI(`Nice to meet you, **${name}**!`, () => {
        sendAI(`To give you accurate results, I need to know a bit about your company. What does your organization do?`, () => {
          setStep(STEPS.COMPANY_INFO)
          setSubStep(0)
        })
      })
      return
    }

    // ── COMPANY_INFO step ─────────────────────────────────────────────────────
    if (step === STEPS.COMPANY_INFO) {
      sendUser(val)

      if (subStep === 0) {
        // Company description
        setSession(s => ({ ...s, companyDescription: val }))
        sendAI(`Got it. Which industry are you in?`, () => {
          setSubStep(1)
          setShowOptions({ type: 'industry', options: INDUSTRIES })
          setInputDisabled(true)
        })
        return
      }
    }

    // ── FRAMEWORK step — text not expected, options only ──────────────────────
    if (step === STEPS.FRAMEWORK) return

    // ── SECURITY_QUESTIONS — text not expected ────────────────────────────────
    if (step === STEPS.SECURITY_QUESTIONS) return
  }

  // ── handle option selection ────────────────────────────────────────────────
  const handleOptionSelect = (option) => {
    setShowOptions(null)

    // Industry selection
    if (step === STEPS.COMPANY_INFO && subStep === 1) {
      sendUser(option.label)
      setSession(s => ({ ...s, industry: option.label }))
      sendAI(`Thanks. How many people work at your company?`, () => {
        setShowOptions({ type: 'size', options: COMPANY_SIZES })
        setInputDisabled(true)
      })
      setSubStep(2)
      return
    }

    // Company size selection
    if (step === STEPS.COMPANY_INFO && subStep === 2) {
      sendUser(option.label)
      setSession(s => ({ ...s, companySize: option.label }))
      sendAI(`Perfect. Now pick the compliance framework you want to check against.`, () => {
        setStep(STEPS.FRAMEWORK)
        setSubStep(0)
        setShowOptions({ type: 'framework', options: FRAMEWORKS })
        setInputDisabled(true)
      })
      return
    }

    // Framework selection
    if (step === STEPS.FRAMEWORK) {
      sendUser(option.label)
      setSession(s => ({ ...s, framework: option.id }))
      const questions = SECURITY_QUESTIONS[option.id] || []
      sendAI(
        `Good choice. I'll ask you ${questions.length} quick questions about **${option.label}**. Just answer honestly — it helps us give you an accurate score.`,
        () => {
          setStep(STEPS.SECURITY_QUESTIONS)
          setQuestionIndex(0)
          askSecurityQuestion(0, option.id)
        }
      )
      return
    }

    // Security question answers (yes / partial / no)
    if (step === STEPS.SECURITY_QUESTIONS) {
      const colorLabel = { yes: '✅ Yes', partial: '⚠️ Partially', no: '❌ No' }
      sendUser(colorLabel[option.id] || option.label)

      const framework = session.framework
      const questions = SECURITY_QUESTIONS[framework] || []
      const newAnswers = { ...session.securityAnswers, [questions[questionIndex].id]: option.id }
      setSession(s => ({ ...s, securityAnswers: newAnswers }))

      const nextIndex = questionIndex + 1
      if (nextIndex < questions.length) {
        setQuestionIndex(nextIndex)
        askSecurityQuestion(nextIndex, framework)
      } else {
        // All questions answered — go to summary
        sendAI(`Thanks for answering everything. Let me put together your results...`, () => {
          sendAI(`Here's what we found based on your answers.`, () => {
            setStep(STEPS.SUMMARY)
            setInputDisabled(true)
          }, 1200)
        })
      }
      return
    }
  }

  // ── ask a security question by index ──────────────────────────────────────
  const askSecurityQuestion = (index, frameworkId) => {
    const questions = SECURITY_QUESTIONS[frameworkId] || []
    const q = questions[index]
    if (!q) return
    sendAI(
      `(${index + 1}/${questions.length}) ${q.question}`,
      () => {
        setShowOptions({ type: 'yesno', options: YES_NO_OPTIONS })
        setInputDisabled(true)
      },
      700
    )
  }

  // ── restart conversation ───────────────────────────────────────────────────
  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY)
    setMessages([])
    setSession(initialSession)
    setStep(STEPS.WELCOME)
    setSubStep(0)
    setQuestionIndex(0)
    setShowOptions(null)
    setInputDisabled(false)
    initialized.current = false
    setTimeout(() => {
      initialized.current = true
      sendAI("Let's start over. I'm here to help you check your security compliance.", () => {
        sendAI("What's your name and role?")
      })
    }, 100)
  }

  const currentStepIndex = stepIndex[step] ?? 0

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <ProgressBar currentStep={currentStepIndex} totalSteps={5} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-1">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence mode="wait">
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>

        {/* Summary card */}
        <AnimatePresence mode="wait">
          {step === STEPS.SUMMARY && (
            <SummaryCard session={session} onRestart={handleRestart} />
          )}
        </AnimatePresence>

        {/* Option buttons */}
        <AnimatePresence mode="wait">
          {showOptions && !isTyping && (
            <OptionButtons
              options={showOptions.options}
              onSelect={handleOptionSelect}
              columns={showOptions.type === 'yesno' ? 3 : 2}
            />
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-white/[0.04] bg-black/20 backdrop-blur-xl px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={inputDisabled}
              placeholder={
                inputDisabled
                  ? 'Select an option above'
                  : 'Type your answer...'
              }
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4 pr-12 text-base text-white
                placeholder:text-white/20 outline-none focus:border-[#2C74B3]/40 focus:bg-white/[0.03]
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            />
            {inputValue && !inputDisabled && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                type="button"
                onClick={() => setInputValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </div>
          
          <motion.button
            type="submit"
            disabled={inputDisabled || !inputValue.trim()}
            whileHover={inputDisabled || !inputValue.trim() ? {} : { scale: 1.05 }}
            whileTap={inputDisabled || !inputValue.trim() ? {} : { scale: 0.95 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2C74B3] to-[#205295] 
              disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center 
              transition-all duration-200 flex-shrink-0 shadow-lg shadow-[#2C74B3]/20
              hover:shadow-xl hover:shadow-[#2C74B3]/30"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </form>

        {/* Footer */}
        <div className="flex justify-between items-center mt-3 px-1">
          <p className="text-[10px] text-white/15 tracking-wide">
            Amenly Security Assessment
          </p>
          <button
            onClick={handleRestart}
            className="text-[10px] text-white/20 hover:text-white/40 transition-colors flex items-center gap-1.5 group"
          >
            <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Start Over</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatEngine
