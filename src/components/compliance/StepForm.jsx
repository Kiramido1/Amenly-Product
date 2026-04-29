import { useState, memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { INDUSTRIES, COMPANY_SIZES, REGIONS } from '../../data/chatFlowData'

const StepForm = ({ onComplete, onBack }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    region: '',
  })
  const [currentField, setCurrentField] = useState(0) // 0=name, 1=industry, 2=size, 3=region
  const [errors, setErrors] = useState({})

  const handleNameSubmit = useCallback((e) => {
    e.preventDefault()
    const name = formData.companyName.trim()
    if (!name) {
      setErrors({ companyName: 'Company name is required' })
      return
    }
    if (name.length < 2) {
      setErrors({ companyName: 'Name must be at least 2 characters' })
      return
    }
    setErrors({})
    setCurrentField(1)
  }, [formData.companyName])

  const handleIndustrySelect = useCallback((industry) => {
    setFormData(prev => ({ ...prev, industry: industry.id }))
    setTimeout(() => setCurrentField(2), 300)
  }, [])

  const handleSizeSelect = useCallback((size) => {
    setFormData(prev => ({ ...prev, companySize: size.id }))
    setTimeout(() => setCurrentField(3), 300)
  }, [])

  const handleRegionSelect = useCallback((region) => {
    const finalData = { ...formData, region: region.id }
    setFormData(finalData)
    setTimeout(() => onComplete(finalData), 400)
  }, [formData, onComplete])

  const sanitize = (val) => val.replace(/[<>]/g, '')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#144272]/[0.08] border border-[#144272]/15 mb-4">
            <span className="text-[11px] text-[#2C74B3]/80 font-semibold tracking-wider uppercase">Step 1 of 4</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Tell us about your company
          </h2>
          <p className="text-white/35 text-sm">This helps us tailor the assessment to your organization</p>
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                width: i === currentField ? 24 : 8,
                backgroundColor: i <= currentField ? '#2C74B3' : 'rgba(255,255,255,0.06)',
                opacity: i <= currentField ? 1 : 0.5,
              }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        {/* Company Name */}
        {currentField === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <label htmlFor="company-name-input" className="block text-sm font-semibold text-white/60 mb-2">
                Company Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <input
                  id="company-name-input"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, companyName: sanitize(e.target.value) }))
                    setErrors({})
                  }}
                  placeholder="Enter your company name"
                  autoFocus
                  autoComplete="organization"
                  maxLength={100}
                  className={`w-full bg-white/[0.02] border ${errors.companyName ? 'border-red-500/40' : 'border-white/[0.06]'} rounded-xl pl-12 pr-5 py-4 text-base text-white placeholder:text-white/15 outline-none focus:border-[#2C74B3]/30 focus:bg-white/[0.03] focus:shadow-[0_0_20px_rgba(44,116,179,0.06)] transition-all duration-300`}
                  aria-describedby={errors.companyName ? 'company-name-error' : undefined}
                  aria-invalid={!!errors.companyName}
                />
              </div>
              {errors.companyName && (
                <motion.p
                  id="company-name-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400/80 mt-1"
                  role="alert"
                >
                  {errors.companyName}
                </motion.p>
              )}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-gradient-to-r from-[#2C74B3] to-[#144272] text-white font-semibold rounded-xl shadow-lg shadow-[#144272]/15 hover:shadow-[#144272]/25 transition-all duration-400 flex items-center justify-center gap-2 border border-white/[0.06]"
              >
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Industry Selection */}
        {currentField === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-sm font-semibold text-white/60 mb-4">Select your industry</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Industry selection">
              {INDUSTRIES.map((ind, i) => (
                <motion.button
                  key={ind.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleIndustrySelect(ind)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    formData.industry === ind.id
                      ? 'border-[#2C74B3]/40 bg-[#144272]/12 shadow-lg shadow-[#144272]/8'
                      : 'border-white/[0.05] bg-white/[0.015] hover:border-[#144272]/25 hover:bg-white/[0.03]'
                  }`}
                  role="radio"
                  aria-checked={formData.industry === ind.id}
                  aria-label={ind.label}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    formData.industry === ind.id
                      ? 'bg-[#2C74B3]/15 border border-[#2C74B3]/30'
                      : 'bg-white/[0.03] border border-white/[0.06]'
                  }`}>
                    <svg className={`w-4.5 h-4.5 transition-colors duration-300 ${
                      formData.industry === ind.id ? 'text-[#2C74B3]' : 'text-white/35'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ind.iconPath} />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-white/60 text-center leading-tight">{ind.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Company Size */}
        {currentField === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-sm font-semibold text-white/60 mb-4">Company size</p>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Company size selection">
              {COMPANY_SIZES.map((size, i) => (
                <motion.button
                  key={size.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSizeSelect(size)}
                  className={`flex flex-col items-center gap-1.5 p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                    formData.companySize === size.id
                      ? 'border-[#2C74B3]/40 bg-[#144272]/12 shadow-lg shadow-[#144272]/8'
                      : 'border-white/[0.05] bg-white/[0.015] hover:border-[#144272]/25 hover:bg-white/[0.03]'
                  }`}
                  role="radio"
                  aria-checked={formData.companySize === size.id}
                >
                  <span className="text-lg font-bold text-white/90">{size.label}</span>
                  <span className="text-xs text-white/35">{size.desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Region */}
        {currentField === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-sm font-semibold text-white/60 mb-4">Primary region of operation</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Region selection">
              {REGIONS.map((region, i) => (
                <motion.button
                  key={region.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRegionSelect(region)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    formData.region === region.id
                      ? 'border-[#2C74B3]/40 bg-[#144272]/12 shadow-lg shadow-[#144272]/8'
                      : 'border-white/[0.05] bg-white/[0.015] hover:border-[#144272]/25 hover:bg-white/[0.03]'
                  }`}
                  role="radio"
                  aria-checked={formData.region === region.id}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    formData.region === region.id
                      ? 'bg-[#2C74B3]/15 border border-[#2C74B3]/30'
                      : 'bg-white/[0.03] border border-white/[0.06]'
                  }`}>
                    <svg className={`w-4 h-4 transition-colors duration-300 ${
                      formData.region === region.id ? 'text-[#2C74B3]' : 'text-white/35'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={region.iconPath} />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white/60">{region.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back button */}
        {(currentField > 0 || onBack) && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => currentField > 0 ? setCurrentField(prev => prev - 1) : onBack?.()}
            className="mt-6 text-xs text-white/25 hover:text-white/50 transition-colors duration-300 flex items-center gap-1.5 mx-auto"
            aria-label="Go back to previous field"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default memo(StepForm)
