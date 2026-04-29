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
    score >= 70 ? 'Strong' :
    score >= 40 ? 'Needs Work' :
    'At Risk'

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
      className="my-4 rounded-2xl border border-white/[0.08] glass-card overflow-hidden shadow-[0_0_40px_rgba(44,116,179,0.15)]"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between bg-gradient-to-r from-[#2C74B3]/5 to-transparent">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[11px] text-white/40 tracking-widest uppercase mb-1 font-semibold">Your Results</p>
          <h3 className="text-white font-bold text-base truncate">{session.name} · {session.role}</h3>
          <p className="text-white/50 text-xs mt-0.5 truncate">{session.companyDescription} · {session.industry}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-3xl font-bold ${scoreColor}`}>{score}%</p>
          <p className={`text-xs font-semibold ${scoreColor}`}>{scoreLabel}</p>
        </div>
      </div>

      {/* Framework badge */}
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2 bg-white/[0.02] overflow-hidden">
        {framework?.iconPath && (
          <div className="text-[#2C74B3] flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={framework.iconPath} />
            </svg>
          </div>
        )}
        <span className="text-sm text-white/70 truncate flex-1">Checked against <span className="text-white font-semibold">{framework?.label}</span></span>
        {session.companySize && (
          <span className="ml-auto text-xs text-white/40 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.08] flex-shrink-0 whitespace-nowrap">
            {session.companySize}
          </span>
        )}
      </div>

      {/* Q&A list */}
      <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
        {questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors overflow-hidden"
          >
            <span className="text-[11px] text-white/30 mt-0.5 w-5 flex-shrink-0 font-semibold">{i + 1}.</span>
            <p className="text-xs text-white/60 flex-1 leading-relaxed break-words min-w-0">{q.question}</p>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 whitespace-nowrap ${answerColor[answers[q.id]] || 'text-white/30 bg-white/[0.03] border-white/[0.08]'}`}>
              {answerLabel[answers[q.id]] || '—'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row gap-3 bg-white/[0.02]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-3 bg-gradient-to-r from-[#2C74B3] to-[#205295] hover:from-[#205295] hover:to-[#144272] text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(44,116,179,0.3)] hover:shadow-[0_0_35px_rgba(44,116,179,0.5)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Get Full Report
        </motion.button>
        <motion.button
          onClick={onRestart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.08] text-white/60 hover:text-white text-sm font-semibold rounded-xl transition-all border border-white/[0.08] hover:border-white/[0.15] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start Over
        </motion.button>
      </div>
    </motion.div>
  )
}

export default SummaryCard
