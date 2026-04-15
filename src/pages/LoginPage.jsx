import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email'
    if (!password) newErrors.password = 'Password is required'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  const inputClass = (field) =>
    `w-full px-4 py-3 bg-white/[0.05] border rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all text-sm ${
      errors[field]
        ? 'border-red-500/50 focus:border-red-500'
        : 'border-white/[0.08] focus:border-[#2C74B3]/60 focus:bg-white/[0.07]'
    }`

  return (
    <div className="min-h-screen h-screen bg-black flex overflow-hidden">
      {/* Left - Form */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-1/2 flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-12"
      >
        <div className="w-full max-w-sm">
          {/* Logo - mobile only */}
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <img src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png" alt="Amenly" className="h-8 w-auto" />
            <span className="text-lg font-bold text-white">Amenly</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2C74B3]" />
              <span className="text-[#2C74B3] text-xs font-semibold uppercase tracking-widest">Secure Access</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 leading-tight">Welcome Back</h1>
            <p className="text-gray-500 text-sm">
              Access your account and continue your compliance journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="group">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }) }}
                  className={`w-full pl-10 pr-4 py-3 bg-white/[0.03] border rounded-lg text-white placeholder-gray-700 focus:outline-none transition-all text-sm ${errors.email ? 'border-red-500/40' : 'border-white/[0.06] focus:border-[#2C74B3]/50 focus:bg-white/[0.05]'}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500 tracking-wider">Password</label>
                <a href="#" className="text-xs text-[#2C74B3] hover:text-white transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }) }}
                  className={`w-full pl-10 pr-10 py-3 bg-white/[0.03] border rounded-lg text-white placeholder-gray-700 focus:outline-none transition-all text-sm ${errors.password ? 'border-red-500/40' : 'border-white/[0.06] focus:border-[#2C74B3]/50 focus:bg-white/[0.05]'}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                  {showPassword
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${rememberMe ? 'bg-[#2C74B3] border-[#2C74B3]' : 'border-white/20 bg-transparent'}`}
              >
                {rememberMe && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              </div>
              <span className="text-xs text-gray-500">Remember me</span>
            </label>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg font-semibold text-sm text-white mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group backdrop-blur-md border border-[#2C74B3]/30 hover:border-[#2C74B3]/60 transition-all"
              style={{ background: 'rgba(10, 38, 71, 0.8)' }}
            >
              <span>{loading ? 'Logging In...' : 'Log In'}</span>
              {!loading && (
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-gray-400 text-xs">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <p className="text-center text-gray-400 text-xs">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#2C74B3] hover:text-white transition-colors font-medium">
              Create account
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Right - Brand Panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-1/2 relative flex flex-col items-center justify-center overflow-hidden"
        style={{ background: '#0a0a0f' }}
      >
        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#2C74B3]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#205295]/10 rounded-full blur-3xl" />

        {/* Border left */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#2C74B3]/30 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
            className="mb-6"
          >
            {/* Logo floats independently */}
            <motion.img
              src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
              alt="Amenly Logo"
              className="w-80 h-80 object-contain mx-auto mb-1"
              style={{ filter: 'drop-shadow(0 0 60px rgba(44,116,179,0.9))' }}
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Text stays fixed */}
            <h2 className="text-5xl font-bold text-white tracking-wide -mt-14">Amenly</h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs"
          >
            AI-powered security compliance platform
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-white hover:border-[#2C74B3]/40 transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
