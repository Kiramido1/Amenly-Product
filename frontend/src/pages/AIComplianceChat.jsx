import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { STEPS, STEP_META } from '../data/chatFlowData'
import { useAuth } from '../hooks/useAuth'
import { getMyOrganization } from '../api/organizations'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'

const WelcomeScreen = lazy(() => import('../components/compliance/WelcomeScreen'))
const StepForm = lazy(() => import('../components/compliance/StepForm'))
const FrameworkSelector = lazy(() => import('../components/compliance/FrameworkSelector'))
const ChatBox = lazy(() => import('../components/compliance/ChatBox'))
const ProgressPanel = lazy(() => import('../components/compliance/ProgressPanel'))

const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-[#144272]/30 border-t-[#2C74B3] rounded-full" />
      <span className="text-xs text-white/30">Loading...</span>
    </div>
  </div>
)

// Shown to non-admin members while the org admin has not yet completed the
// company profile — the assessment is locked until then.
const ProfilePendingScreen = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    className="flex-1 flex items-center justify-center p-8"
  >
    <div className="max-w-md text-center">
      <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-[#144272]/15 border border-[#2C74B3]/30 flex items-center justify-center">
        <svg className="w-8 h-8 text-[#2C74B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Assessment not ready yet</h2>
      <p className="text-white/45 text-sm leading-relaxed mb-6">
        Your organization admin needs to complete the company profile before the assessment can begin. You'll be able to start as soon as it's set up.
      </p>
      <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:border-[#2C74B3]/40 transition-all text-sm">
        Back to Dashboard
      </Link>
    </div>
  </motion.div>
)

const AIComplianceChat = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'org_admin'

  const [step, setStep] = useState(STEPS.WELCOME)
  const [session, setSession] = useState({ companyName: '', industry: '', companySize: '', region: '', website: '', description: '', framework: null })
  const [answers, setAnswers] = useState({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [org, setOrg] = useState(null)
  const [orgLoading, setOrgLoading] = useState(true)

  // Load the org once so we know whether the company profile is complete and can
  // gate the assessment accordingly.
  useEffect(() => {
    let active = true
    getMyOrganization()
      .then((data) => {
        if (!active) return
        setOrg(data)
        if (data) {
          setSession((prev) => ({
            ...prev,
            companyName: data.name || prev.companyName,
            industry: data.industry || prev.industry,
            companySize: data.company_size || prev.companySize,
            region: data.region || prev.region,
            website: data.website || prev.website,
            description: data.description || prev.description,
          }))
        }
      })
      .catch(() => {})
      .finally(() => active && setOrgLoading(false))
    return () => { active = false }
  }, [])

  const profileComplete = !!org?.profile_completed
  const profileInitial = org
    ? {
        companyName: org.name || '',
        industry: org.industry || '',
        companySize: org.company_size || '',
        region: org.region || '',
        website: org.website || '',
        description: org.description || '',
      }
    : {}

  const currentStepIndex = STEP_META.findIndex(s => s.key === step)
  const showPanel = step === STEPS.SECURITY_QUESTIONS || step === STEPS.SUMMARY

  // After the intro: admins without a completed profile do onboarding first;
  // everyone else jumps straight to framework selection.
  const handleStart = useCallback(() => {
    setStep(isAdmin && !profileComplete ? STEPS.COMPANY_PROFILE : STEPS.FRAMEWORK)
  }, [isAdmin, profileComplete])

  const handleCompanyComplete = useCallback((data) => {
    setSession(prev => ({ ...prev, ...data }))
    setOrg(prev => ({ ...(prev || {}), profile_completed: true }))
    setStep(STEPS.FRAMEWORK)
  }, [])

  const handleFrameworkSelect = useCallback((fw) => {
    setSession(prev => ({ ...prev, framework: fw }))
    setTimeout(() => setStep(STEPS.SECURITY_QUESTIONS), 400)
  }, [])

  const handleAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    setQuestionIndex(prev => prev + 1)
  }, [])

  const handleComplete = useCallback(() => {
    setIsComplete(true)
    setStep(STEPS.SUMMARY)
  }, [])

  const handleRestart = useCallback(() => {
    setStep(STEPS.WELCOME)
    setSession({ companyName: '', industry: '', companySize: '', region: '', framework: null })
    setAnswers({})
    setQuestionIndex(0)
    setIsComplete(false)
    setPanelOpen(false)
  }, [])

  const handleBack = useCallback(() => {
    setStep((prevStep) => {
      switch (prevStep) {
        case STEPS.COMPANY_PROFILE:
          return STEPS.WELCOME
        case STEPS.FRAMEWORK:
          return STEPS.COMPANY_PROFILE
        case STEPS.SECURITY_QUESTIONS:
        case STEPS.SUMMARY:
          return STEPS.FRAMEWORK
        default:
          return prevStep
      }
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#000000] relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#144272]/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#0A2647]/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Subtle ambient floating orbs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#144272]/[0.03] blur-[120px] pointer-events-none"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-[#0A2647]/[0.04] blur-[100px] pointer-events-none"
        animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#144272] text-white px-4 py-2 rounded-lg z-[100] focus:outline-none focus:ring-2 focus:ring-white">Skip to main content</a>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-20 bg-[#060606]/90 backdrop-blur-2xl border-b border-white/[0.04]"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          {/* Panel toggle (mobile) */}
          {showPanel && (
            <button onClick={() => setPanelOpen(true)} className="lg:hidden w-10 h-10 rounded-lg bg-[#144272]/80 flex items-center justify-center transition-colors hover:bg-[#144272]" aria-label="Open insights panel">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </button>
          )}

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
            <motion.div
              className="relative flex-shrink-0"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 180, damping: 18 }}
            >
              <div className="absolute inset-0 bg-[#144272]/15 blur-xl rounded-full" />
              <img src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png" alt="Amenly" className="h-7 sm:h-9 w-auto relative z-10" />
            </motion.div>
            <motion.div
              className="flex flex-col"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="text-white font-bold text-base sm:text-lg tracking-tight leading-none">Amenly</span>
              <span className="text-[#2C74B3]/70 text-[8px] sm:text-[9px] font-medium tracking-[0.2em] uppercase">Compliance</span>
            </motion.div>
          </Link>

          {/* Steps indicator (desktop) */}
          <motion.div
            className="hidden md:flex items-center gap-0.5"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {STEP_META.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <motion.div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-500 ${
                    i <= currentStepIndex ? 'text-white/80' : 'text-white/20'
                  } ${i === currentStepIndex ? 'bg-[#144272]/15 border border-[#144272]/25' : ''}`}
                  layout
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                      i < currentStepIndex
                        ? 'bg-[#2C74B3] text-white'
                        : i === currentStepIndex
                        ? 'bg-[#144272]/30 text-[#2C74B3]'
                        : 'bg-white/[0.03] text-white/15'
                    }`}
                    layout
                  >
                    {i < currentStepIndex ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      i + 1
                    )}
                  </motion.div>
                  <span className="hidden lg:inline">{s.label}</span>
                </motion.div>
                {i < STEP_META.length - 1 && (
                  <motion.div
                    className={`w-4 h-[1px] mx-0.5 transition-colors duration-500 ${
                      i < currentStepIndex ? 'bg-[#2C74B3]/40' : 'bg-white/[0.04]'
                    }`}
                  />
                )}
              </div>
            ))}
          </motion.div>

          {/* Right section */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.06] border border-emerald-500/20">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-50" />
              </div>
              <span className="text-[10px] text-emerald-400/80 font-semibold tracking-wide">ONLINE</span>
            </div>
            <Link
              to="/dashboard"
              className="group px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-white/50 hover:text-white/90 rounded-lg border border-white/[0.06] hover:border-[#144272]/40 hover:bg-white/[0.02] transition-all duration-300"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-50 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </span>
            </Link>
          </motion.div>
        </div>
        <motion.div
          className="h-[1px] bg-gradient-to-r from-transparent via-[#144272]/30 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </motion.header>

      {/* Main content */}
      <div id="main-content" className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto flex flex-1 overflow-hidden">

          {/* Main area */}
          <motion.main className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ${showPanel ? '' : ''}`}>
            <div className="flex-1 flex flex-col bg-[#080808]/30 backdrop-blur-xl overflow-hidden">
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  {orgLoading ? (
                    <LoadingFallback />
                  ) : (!isAdmin && !profileComplete) ? (
                    <ProfilePendingScreen />
                  ) : (
                    <AnimatePresence mode="wait">
                      {step === STEPS.WELCOME && (
                        <WelcomeScreen key="welcome" onStart={handleStart} />
                      )}
                      {step === STEPS.COMPANY_PROFILE && (
                        <StepForm key="company" initialData={profileInitial} onComplete={handleCompanyComplete} onBack={handleBack} />
                      )}
                      {step === STEPS.FRAMEWORK && (
                        <FrameworkSelector key="framework" onSelect={handleFrameworkSelect} selected={session.framework?.id} onBack={handleBack} />
                      )}
                      {(step === STEPS.SECURITY_QUESTIONS || step === STEPS.SUMMARY) && (
                        <ChatBox key="chat" session={session} framework={session.framework} onAnswer={handleAnswer} onComplete={handleComplete} onBack={handleBack} />
                      )}
                    </AnimatePresence>
                  )}
                </Suspense>
              </ErrorBoundary>
            </div>
          </motion.main>

          {/* Right panel - Desktop */}
          {showPanel && (
            <>
              <motion.aside
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="hidden lg:block w-80 xl:w-96 flex-shrink-0 border-l border-white/[0.04] bg-[#060606]/70 backdrop-blur-xl h-full overflow-hidden"
              >
                <ProgressPanel session={session} answers={answers} currentStep={step} questionIndex={questionIndex} isComplete={isComplete} />
              </motion.aside>

              {/* Mobile panel overlay */}
              <AnimatePresence>
                {panelOpen && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanelOpen(false)} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                    <motion.aside
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                      className="lg:hidden fixed inset-y-0 right-0 w-80 bg-[#060606]/95 backdrop-blur-xl z-50 border-l border-white/[0.04]"
                      style={{ top: '73px' }}
                    >
                      <button onClick={() => setPanelOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors duration-200" aria-label="Close panel">
                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <ProgressPanel session={session} answers={answers} currentStep={step} questionIndex={questionIndex} isComplete={isComplete} />
                    </motion.aside>
                  </>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Footer */}
        <Footer />
      </div>

      {/* Restart button (when complete) */}
      <AnimatePresence>
        {isComplete && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }} className="fixed bottom-6 right-6 z-30">
            <motion.button
              onClick={handleRestart}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-3 bg-gradient-to-r from-[#2C74B3] to-[#144272] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#144272]/20 flex items-center gap-2 border border-white/[0.08]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              New Assessment
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" id="sr-announcements" />
    </div>
  )
}

export default AIComplianceChat
