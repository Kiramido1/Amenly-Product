import { motion } from 'framer-motion'

const STEP_LABELS = ['Identity', 'Company', 'Framework', 'Questions', 'Results']

/**
 * Shows current step progress (1-based display).
 * currentStep: 0-indexed
 */
const ProgressBar = ({ currentStep, totalSteps = 5 }) => {
  const percent = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="px-6 py-4 border-b border-white/[0.04]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-white/30 font-medium">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-xs text-[#144272] font-semibold">
            {STEP_LABELS[currentStep]}
          </span>
        </div>
        <span className="text-xs text-white/20 font-medium tabular-nums">{Math.round(percent)}%</span>
      </div>

      {/* Track */}
      <div className="relative h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#144272] to-[#0A2647] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-3">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <motion.div
              initial={{ scale: 0.8, opacity: 0.3 }}
              animate={{
                scale: i <= currentStep ? 1 : 0.8,
                opacity: i <= currentStep ? 1 : 0.3
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i <= currentStep ? 'bg-[#144272]' : 'bg-white/10'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressBar
