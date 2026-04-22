import { motion } from 'framer-motion'
import { FRAMEWORKS, SECURITY_QUESTIONS } from '../../data/chatFlowData'

/**
 * Final summary card shown at step 5.
 * session: the collected answers object
 * onRestart: () => void
 */
const SummaryCard = ({ session, onRestart }) => {
  const framework = FRAMEWORKS.find(f => f.id === session.framework)
  const questions = SECURITY_QUESTIONS[session.framework] || []

  // Calculate a simple compliance score
  const answers = session.securityAnswers || {}
  const total = questions.length
  const yesCount = Object.values(answers).filter(a => a === 'yes').length
  const partialCount = Object.values(answers).filter(a => a === 'partial').length
  const score = total > 0 ? Math.round(((yesCount + partialCount * 0.5) / total) * 100) : 0

  const scoreColor =
    score >= 70 ? 'text-green-400' :
    score >= 40 ? 'text-yellow-400' :
    'text-red-400'

  const scoreLabel =
    score >= 70 ? 'Good Posture' :
    score >= 40 ? 'Needs Improvement' :
    'High Risk'

  const answerLabel = { yes: 'Yes', partial: 'Partially', no: 'No' }
  const answerColor = {
    yes:     'text-green-400 bg-green-500/10 border-green-500/20',
    partial: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    no:      'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="my-4 rounded-2xl border border-white/10 bg-[#0D1B2E] overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-white/40 tracking-widest uppercase mb-1">Assessment Summary</p>
          <h3 className="text-white font-semibold text-base">{session.name} · {session.role}</h3>
          <p className="text-white/50 text-xs mt-0.5">{session.companyDescription} · {session.industry}</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${scoreColor}`}>{score}%</p>
          <p className={`text-xs font-medium ${scoreColor}`}>{scoreLabel}</p>
        </div>
      </div>

      {/* Framework badge */}
      <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
        <span className="text-base">{framework?.icon}</span>
        <span className="text-sm text-white/70">Framework: <span className="text-white font-medium">{framework?.label}</span></span>
        {session.companySize && (
          <span className="ml-auto text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
            {session.companySize}
          </span>
        )}
      </div>

      {/* Q&A list */}
      <div className="px-5 py-4 space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="flex items-start gap-3">
            <span className="text-[11px] text-white/30 mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
            <p className="text-xs text-white/60 flex-1 leading-relaxed">{q.question}</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${answerColor[answers[q.id]] || 'text-white/30 bg-white/5 border-white/10'}`}>
              {answerLabel[answers[q.id]] || '—'}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 py-4 border-t border-white/8 flex flex-col sm:flex-row gap-3">
        <button className="flex-1 py-2.5 bg-[#2C74B3] hover:bg-[#205295] text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Risk Report
        </button>
        <button
          onClick={onRestart}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm rounded-xl transition-colors border border-white/8 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Restart
        </button>
      </div>
    </motion.div>
  )
}

export default SummaryCard
