import { motion } from 'framer-motion'

const STEP_LABELS = ['Welcome', 'Company', 'Framework', 'Assessment', 'Summary']

/**
 * Shows current step progress (1-based display).
 * currentStep: 0-indexed
 */
const ProgressBar = ({ currentStep, totalSteps = 5 }) => {
  const percent = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="px-6 py-3 border-b border-white/[0.06] bg-black/40 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/40 tracking-widest uppercase font-semibold">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-[11px] text-[#2C74B3] font-bold tracking-wide">
            — {STEP_LABELS[currentStep]}
          </span>
        </div>
        <span className="text-[11px] text-white/30 font-medium">{Math.round(percent)}%</span>
      </div>

      {/* Track */}
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          className="h-full bg-gradient-to-r from-[#205295] via-[#2C74B3] to-[#2C74B3] rounded-full shadow-[0_0_12px_rgba(44,116,179,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between mt-2.5">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: i <= currentStep ? 1 : 0.8 }}
              transition={{ duration: 0.3 }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= currentStep
                  ? 'bg-[#2C74B3] shadow-[0_0_8px_rgba(44,116,179,0.6)]'
                  : 'bg-white/10'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressBar
