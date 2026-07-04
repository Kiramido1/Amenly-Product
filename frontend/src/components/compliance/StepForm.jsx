import { useState, memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { INDUSTRIES, COMPANY_SIZES, REGIONS } from '../../data/chatFlowData'
import { updateCompanyProfile } from '../../api/organizations'

const EASE = [0.25, 0.46, 0.45, 0.94]
const sanitize = (val) => val.replace(/[<>]/g, '')

const SectionLabel = ({ children, required }) => (
  <label className="block text-sm font-semibold text-white/70 mb-2.5">
    {children}
    {required && <span className="text-[#2C74B3] ml-1">*</span>}
  </label>
)

const Chip = ({ active, onClick, children, ariaLabel }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.015, y: -1 }}
    whileTap={{ scale: 0.985 }}
    onClick={onClick}
    aria-pressed={active}
    aria-label={ariaLabel}
    className={`px-3.5 py-2.5 rounded-xl border text-left transition-all duration-300 ${
      active
        ? 'border-[#2C74B3]/50 bg-[#144272]/15 shadow-lg shadow-[#144272]/10'
        : 'border-white/[0.06] bg-white/[0.015] hover:border-[#144272]/30 hover:bg-white/[0.03]'
    }`}
  >
    {children}
  </motion.button>
)

const StepForm = ({ initialData = {}, onComplete, onBack }) => {
  const [formData, setFormData] = useState({
    companyName: initialData.companyName || '',
    industry: initialData.industry || '',
    companySize: initialData.companySize || '',
    region: initialData.region || '',
    website: initialData.website || '',
    description: initialData.description || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')

  const set = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }, [])

  const validate = () => {
    const e = {}
    const name = formData.companyName.trim()
    if (!name) e.companyName = 'Company name is required'
    else if (name.length < 2) e.companyName = 'Name must be at least 2 characters'
    if (!formData.industry) e.industry = 'Select an industry'
    if (!formData.companySize) e.companySize = 'Select a company size'
    if (!formData.region) e.region = 'Select a region'
    if (formData.website && !/^https?:\/\/|^www\.|\.[a-z]{2,}/i.test(formData.website)) {
      e.website = 'Enter a valid website'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setSaving(true)
    try {
      await updateCompanyProfile(formData)
      onComplete(formData)
    } catch (err) {
      setApiError(err.response?.data?.detail || err.message || 'Could not save the profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-chat"
    >
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#144272]/[0.08] border border-[#144272]/15 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2C74B3]" />
            <span className="text-[11px] text-[#2C74B3]/80 font-semibold tracking-wider uppercase">Step 1 · Organization Profile</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Set up your organization</h2>
          <p className="text-white/40 text-sm">As the admin, tell us about your company. This tailors the assessment and unlocks it for your team.</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
          className="space-y-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 sm:p-7 backdrop-blur-xl"
          noValidate
        >
          {/* Company name */}
          <div>
            <SectionLabel required>Company name</SectionLabel>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => set('companyName', sanitize(e.target.value))}
              placeholder="e.g. Acme Corp"
              maxLength={120}
              className={`w-full bg-white/[0.02] border ${errors.companyName ? 'border-red-500/40' : 'border-white/[0.07]'} rounded-xl px-4 py-3.5 text-base text-white placeholder:text-white/20 outline-none focus:border-[#2C74B3]/40 focus:bg-white/[0.03] focus:shadow-[0_0_20px_rgba(44,116,179,0.06)] transition-all duration-300`}
            />
            {errors.companyName && <p className="text-xs text-red-400/80 mt-1.5">{errors.companyName}</p>}
          </div>

          {/* Industry */}
          <div>
            <SectionLabel required>Industry</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {INDUSTRIES.map((ind) => (
                <Chip key={ind.id} active={formData.industry === ind.id} onClick={() => set('industry', ind.id)} ariaLabel={ind.label}>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <svg className={`w-4 h-4 ${formData.industry === ind.id ? 'text-[#2C74B3]' : 'text-white/35'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ind.iconPath} />
                    </svg>
                    <span className="text-[11px] font-medium text-white/60 text-center leading-tight">{ind.label}</span>
                  </div>
                </Chip>
              ))}
            </div>
            {errors.industry && <p className="text-xs text-red-400/80 mt-1.5">{errors.industry}</p>}
          </div>

          {/* Company size + Region */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <SectionLabel required>Company size</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {COMPANY_SIZES.map((size) => (
                  <Chip key={size.id} active={formData.companySize === size.id} onClick={() => set('companySize', size.id)} ariaLabel={size.label}>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white/90">{size.label}</span>
                      <span className="text-[10px] text-white/35">{size.desc}</span>
                    </div>
                  </Chip>
                ))}
              </div>
              {errors.companySize && <p className="text-xs text-red-400/80 mt-1.5">{errors.companySize}</p>}
            </div>

            <div>
              <SectionLabel required>Primary region</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {REGIONS.map((region) => (
                  <Chip key={region.id} active={formData.region === region.id} onClick={() => set('region', region.id)} ariaLabel={region.label}>
                    <span className="text-xs font-medium text-white/65">{region.label}</span>
                  </Chip>
                ))}
              </div>
              {errors.region && <p className="text-xs text-red-400/80 mt-1.5">{errors.region}</p>}
            </div>
          </div>

          {/* Website (optional) */}
          <div>
            <SectionLabel>Website <span className="text-white/25 font-normal">(optional)</span></SectionLabel>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => set('website', sanitize(e.target.value))}
              placeholder="https://example.com"
              className={`w-full bg-white/[0.02] border ${errors.website ? 'border-red-500/40' : 'border-white/[0.07]'} rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2C74B3]/40 focus:bg-white/[0.03] transition-all duration-300`}
            />
            {errors.website && <p className="text-xs text-red-400/80 mt-1.5">{errors.website}</p>}
          </div>

          {/* Description (optional) */}
          <div>
            <SectionLabel>Brief description <span className="text-white/25 font-normal">(optional)</span></SectionLabel>
            <textarea
              value={formData.description}
              onChange={(e) => set('description', sanitize(e.target.value))}
              placeholder="What does your organization do?"
              rows={3}
              maxLength={500}
              className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#2C74B3]/40 focus:bg-white/[0.03] transition-all duration-300 resize-none"
            />
          </div>

          {apiError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">{apiError}</div>
          )}

          <div className="flex items-center gap-3 pt-1">
            {onBack && (
              <button type="button" onClick={onBack} className="px-4 py-3 text-xs text-white/35 hover:text-white/60 transition-colors">
                Back
              </button>
            )}
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.01 }}
              whileTap={{ scale: saving ? 1 : 0.99 }}
              className="flex-1 py-3.5 text-white font-semibold rounded-xl border border-[#2C74B3]/30 hover:border-[#2C74B3]/60 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'rgba(10, 38, 71, 0.85)' }}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save & Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </motion.div>
  )
}

export default memo(StepForm)
