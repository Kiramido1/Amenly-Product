import { memo, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FRAMEWORKS, SECURITY_QUESTIONS, INDUSTRIES, REGIONS,
  COMPANY_SIZES, getRecommendations,
} from '../../data/chatFlowData'

const ProgressPanel = ({ session, answers, currentStep, questionIndex, isComplete, live = null }) => {
  const frameworkId = typeof session.framework === 'object' ? session.framework?.id : session.framework
  const framework = useMemo(() => {
    if (typeof session.framework === 'object' && session.framework) {
      return {
        id: session.framework.id,
        label: session.framework.name,
        description: session.framework.description || session.framework.category || 'Assigned compliance framework',
        iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      }
    }
    return FRAMEWORKS.find(f => f.id === frameworkId)
  }, [frameworkId, session.framework])
  const questions = useMemo(() => SECURITY_QUESTIONS[frameworkId] || [], [frameworkId])
  const industry = useMemo(() => INDUSTRIES.find(i => i.id === session.industry), [session.industry])
  const region = useMemo(() => REGIONS.find(r => r.id === session.region), [session.region])
  const companySize = useMemo(() => COMPANY_SIZES.find(s => s.id === session.companySize), [session.companySize])

  // Calculate live compliance score
  const { score: baseScore, riskLevel: baseRisk, riskColor, answeredCount, yesCount, partialCount, noCount } = useMemo(() => {
    const entries = Object.entries(answers)
    const total = questions.length || 1
    const answered = entries.length
    const yes = entries.filter(([, a]) => a === 'yes').length
    const partial = entries.filter(([, a]) => a === 'partial').length
    const no = entries.filter(([, a]) => a === 'no').length
    const s = total > 0 ? Math.round(((yes + partial * 0.5) / total) * 100) : 0

    let risk = 'Unknown'
    let rColor = 'text-white/40'
    if (answered > 0) {
      if (s >= 70) { risk = 'Low'; rColor = 'text-emerald-400' }
      else if (s >= 40) { risk = 'Medium'; rColor = 'text-amber-400' }
      else { risk = 'High'; rColor = 'text-rose-400' }
    }

    return { score: s, riskLevel: risk, riskColor: rColor, answeredCount: answered, yesCount: yes, partialCount: partial, noCount: no }
  }, [answers, questions.length])

  // Recommendations
  const recommendations = useMemo(() => {
    if (!isComplete) return []
    return getRecommendations(frameworkId, answers)
  }, [isComplete, frameworkId, answers])

  const baseProgress = questions.length > 0
    ? Math.round(((isComplete ? questions.length : questionIndex) / questions.length) * 100)
    : 0

  // Prefer the AI-driven interview's LIVE metrics (running score, risk, progress)
  // whenever the interview is active; fall back to the legacy computed values.
  const hasLive = !!(live && (live.total || live.percent || live.done))
  const effHasScore = hasLive ? typeof live.score === 'number' : answeredCount > 0
  const score = hasLive ? (typeof live.score === 'number' ? live.score : 0) : baseScore
  const riskLevel = hasLive
    ? (live.riskLevel && live.riskLevel !== 'unknown'
        ? live.riskLevel.charAt(0).toUpperCase() + live.riskLevel.slice(1) : 'Unknown')
    : baseRisk
  const progress = hasLive ? live.percent : baseProgress

  const scoreColor = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : score > 0 ? 'text-rose-400' : 'text-white/25'
  const scoreRingColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : score > 0 ? '#f43f5e' : 'rgba(255,255,255,0.06)'

  const handleExportReport = useCallback(() => {
    const reportDate = new Date().toLocaleDateString()
    let text = `Amenly Compliance Assessment Report\nDate: ${reportDate}\n\n`
    
    text += `--- Company Profile ---\n`
    text += `Organization: ${session.companyName || 'N/A'}\n`
    text += `Industry: ${industry?.label || 'N/A'}\n`
    text += `Size: ${companySize?.label || 'N/A'}\n`
    text += `Region: ${region?.label || 'N/A'}\n\n`
    
    text += `--- Assessment Results ---\n`
    text += `Framework: ${framework?.label || 'N/A'}\n`
    text += `Compliance Score: ${score}%\n`
    text += `Risk Level: ${riskLevel}\n\n`
    
    text += `--- Summary ---\n`
    text += `- Fully Compliant (Yes): ${yesCount}\n`
    text += `- Partially Compliant (Partial): ${partialCount}\n`
    text += `- Non-Compliant (No): ${noCount}\n\n`
    
    if (recommendations.length > 0) {
      text += `--- Key Recommendations ---\n`
      recommendations.forEach((r, i) => {
        text += `${i + 1}. [${r.severity.toUpperCase()}] ${r.recommendation}\n`
      })
      text += '\n'
    }

    text += `--- Detailed Responses ---\n`
    questions.forEach((q, i) => {
      const answer = answers[q.id] || 'unanswered'
      text += `Q${i + 1}: ${q.question || q.question_text}\nYour Answer: ${String(answer).toUpperCase()}\n\n`
    })

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.companyName?.replace(/\s+/g, '_') || 'Company'}_Compliance_Report.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [session.companyName, framework, industry, companySize, region, score, riskLevel, yesCount, partialCount, noCount, recommendations, questions, answers])

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-chat">
      <div className="p-6 space-y-5">

        {/* Compliance gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="text-center"
        >
          <div className="relative w-36 h-36 mx-auto mb-3">
            {effHasScore && (
              <div className="absolute inset-4 rounded-full blur-2xl opacity-30" style={{ background: scoreRingColor }} />
            )}
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={scoreRingColor} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={scoreRingColor} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="6" />
              <motion.circle
                cx="60" cy="60" r="52" fill="none" stroke="url(#gaugeGrad)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - (effHasScore ? score : 0) / 100) }}
                transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span key={score} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`font-display text-[40px] leading-none font-semibold tabular-nums ${scoreColor}`}>
                {effHasScore ? score : '—'}
              </motion.span>
              <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1.5">Compliance</span>
            </div>
          </div>
          <p className="text-[11px] text-white/35">
            {effHasScore ? 'Live score — updated as you answer' : 'Your score appears as you answer'}
          </p>
        </motion.div>

        {/* Risk + progress metric rows */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.05]">
            <div className="font-mono text-[9px] text-white/30 uppercase tracking-[0.14em] mb-1.5">Risk level</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: effHasScore ? scoreRingColor : 'rgba(255,255,255,0.2)' }} />
              <span className="font-display text-[15px] font-semibold" style={{ color: effHasScore ? scoreRingColor : 'rgba(255,255,255,0.4)' }}>{riskLevel}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.05]">
            <div className="font-mono text-[9px] text-white/30 uppercase tracking-[0.14em] mb-1.5">Controls</div>
            <span className="font-display text-[15px] font-semibold text-white/85 tabular-nums">
              {live?.total ? `${live.done}/${live.total}` : `${progress}%`}
            </span>
          </div>
        </div>

        <div className="px-3.5 pt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.14em]">Interview progress</span>
            <span className="text-[11px] text-white/45 tabular-nums font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#2C74B3] to-[#5F9BD8]"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

        {/* Framework */}
        {framework && (
          <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]">
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.14em] block mb-2.5">Framework</span>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#144272]/10 border border-[#144272]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-[#2C74B3]/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={framework.iconPath} />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/80 truncate">{framework.label}</p>
                <p className="text-[11px] text-white/30 truncate">{framework.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Company Info */}
        {session.companyName && (
          <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]">
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.14em] block mb-3">Organization</span>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-xs text-white/50 truncate">{session.companyName}</span>
              </div>
              {industry && (
                <div className="flex items-center gap-2.5">
                  <svg className="w-3.5 h-3.5 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={industry.iconPath} />
                  </svg>
                  <span className="text-xs text-white/50 truncate">{industry.label}</span>
                </div>
              )}
              {companySize && (
                <div className="flex items-center gap-2.5">
                  <svg className="w-3.5 h-3.5 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-xs text-white/50 truncate">{companySize.label} employees</span>
                </div>
              )}
              {region && (
                <div className="flex items-center gap-2.5">
                  <svg className="w-3.5 h-3.5 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={region.iconPath} />
                  </svg>
                  <span className="text-xs text-white/50 truncate">{region.label}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Answer Breakdown */}
        {!hasLive && answeredCount > 0 && (
          <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]">
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.14em] block mb-3">Answers</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
                <motion.span
                  key={yesCount}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-lg font-bold text-emerald-400/90 block"
                >
                  {yesCount}
                </motion.span>
                <span className="text-[10px] text-emerald-400/50">Yes</span>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/10">
                <motion.span
                  key={partialCount}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-lg font-bold text-amber-400/90 block"
                >
                  {partialCount}
                </motion.span>
                <span className="text-[10px] text-amber-400/50">Partial</span>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-rose-500/[0.04] border border-rose-500/10">
                <motion.span
                  key={noCount}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-lg font-bold text-rose-400/90 block"
                >
                  {noCount}
                </motion.span>
                <span className="text-[10px] text-rose-400/50">No</span>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations (only when complete) */}
        <AnimatePresence>
          {isComplete && recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]"
            >
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-3.5 h-3.5 text-[#2C74B3]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                  Key Recommendations
                </span>
              </div>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec, i) => (
                  <motion.div
                    key={rec.questionId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="flex items-start gap-2.5"
                  >
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${rec.severity === 'high' ? 'bg-rose-400/80' : 'bg-amber-400/80'}`} />
                    <p className="text-[11px] text-white/45 leading-relaxed">{rec.recommendation}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy note */}
        <div className="px-3 py-3 rounded-xl bg-white/[0.008] border border-white/[0.025]">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-3.5 h-3.5 text-[#144272]/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-[11px] font-semibold text-white/40">Secure &amp; Confidential</span>
          </div>
          <p className="text-[10px] text-white/25 leading-relaxed">
            Your responses are encrypted in transit and scoped to your organization.
          </p>
        </div>

        {/* Export Action */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              key="export-report-btn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-4"
            >
              <motion.button
                onClick={handleExportReport}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-gradient-to-r from-[#2C74B3] to-[#144272] text-white font-semibold rounded-xl shadow-lg shadow-[#144272]/15 hover:shadow-[#144272]/25 transition-all duration-400 flex items-center justify-center gap-2.5 border border-white/[0.06]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Full Report
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default memo(ProgressPanel)
