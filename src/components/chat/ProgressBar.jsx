import { motion } from 'framer-motion'

const STEP_LABELS = ['Welcome', 'Company', 'Framework', 'Assessment', 'Summary']

/**
 * Shows current step progress (1-based display).
 * currentStep: 0-indexed
 */
const ProgressBar = ({ currentStep, totalSteps = 5 }) => {
  const percent = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="px-6 py-3 border-b border-white/6 bg-[#080E1A]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/40 tracking-widest uppercase font-medium">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-[11px] text-[#2C74B3] font-semibold tracking-wide">
            — {STEP_LABELS[currentStep]}
          </span>
        </div>
        <span className="text-[11px] text-white/30">{Math.round(percent)}%</span>
      </div>

      {/* Track */}
      <div className="h-1 bg-white/6 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#205295] to-[#2C74B3] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between mt-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i <= currentStep ? 'bg-[#2C74B3]' : 'bg-white/15'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressBar
