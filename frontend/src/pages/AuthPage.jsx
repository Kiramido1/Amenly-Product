import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { requestJoin } from '../api/auth'
import { getMyOrganization } from '../api/organizations'

// ─── Shared Eye Icon ───────────────────────────────────────────────
const EyeIcon = ({ show, toggle }) => (
  <button type="button" onClick={toggle}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
    {show
      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
    }
  </button>
)

const inputBase = (err) =>
  `w-full pl-10 pr-4 py-3 bg-white/[0.03] border rounded-lg text-white placeholder-gray-700 focus:outline-none transition-all text-sm ${
    err ? 'border-red-500/40' : 'border-white/[0.06] focus:border-[#2C74B3]/50 focus:bg-white/[0.05]'
  }`

const btnClass = "w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md border border-[#2C74B3]/30 hover:border-[#2C74B3]/60 transition-all flex items-center justify-center gap-2 group"
const btnStyle = { background: 'rgba(10, 38, 71, 0.8)' }

// ─── Login Form ────────────────────────────────────────────────────
const LoginForm = ({ onSwitch }) => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const result = await login({ email, password })
      if (result.success) {
        // Admins who haven't completed the company profile start onboarding first.
        const role = result.data?.user?.role
        if (role === 'org_admin') {
          try {
            const org = await getMyOrganization()
            navigate(org && !org.profile_completed ? '/ai-compliance' : '/dashboard')
          } catch {
            navigate('/dashboard')
          }
        } else {
          navigate('/dashboard')
        }
      } else {
        setApiError(result.message || 'Invalid credentials')
      }
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2C74B3]" />
          <span className="text-[#2C74B3] text-xs font-semibold uppercase tracking-widest">Secure Access</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-500 text-sm">Access your account and continue your compliance journey</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wider">Email Address</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }) }}
              className={inputBase(errors.email)} placeholder="you@example.com" autoComplete="email" />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-500 tracking-wider">Password</label>
            <a href="#" className="text-xs text-[#2C74B3] hover:text-white transition-colors">Forgot password?</a>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }) }}
              className={`${inputBase(errors.password)} pr-10`} placeholder="••••••••" autoComplete="current-password" />
            <EyeIcon show={showPw} toggle={() => setShowPw(!showPw)} />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer pt-1">
          <div onClick={() => setRemember(!remember)}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${remember ? 'bg-[#2C74B3] border-[#2C74B3]' : 'border-white/20 bg-transparent'}`}>
            {remember && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
          </div>
          <span className="text-xs text-gray-500">Remember me</span>
        </label>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs"
          >
            {apiError}
          </motion.div>
        )}
        <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }} className={btnClass} style={btnStyle}>
          <span>{loading ? 'Logging In...' : 'Log In'}</span>
          {!loading && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
        </motion.button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-gray-400 text-xs">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <p className="text-center text-gray-400 text-xs">
        Don't have an account?{' '}
        <button onClick={onSwitch} className="text-[#2C74B3] hover:text-white transition-colors font-medium">
          Create account
        </button>
      </p>
    </div>
  )
}

// ─── Signup Form ───────────────────────────────────────────────────
const SignupForm = ({ onSwitch }) => {
  const { register } = useAuth()
  const navigate = useNavigate()
  // 'create' = start a brand-new organization (becomes admin);
  // 'join'   = request to join an existing org via its invite code (needs approval).
  const [signupMode, setSignupMode] = useState('create')
  const [formData, setFormData] = useState({ organizationName: '', inviteCode: '', fullName: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [joinSubmitted, setJoinSubmitted] = useState(false)

  const isJoin = signupMode === 'join'

  const validate = () => {
    const e = {}
    if (isJoin) {
      if (!formData.inviteCode.trim()) e.inviteCode = 'Invite code is required'
    } else {
      if (!formData.organizationName.trim()) e.organizationName = 'Required'
    }
    if (!formData.fullName.trim()) e.fullName = 'Full name is required'
    if (!formData.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email'
    if (!formData.password) e.password = 'Required'
    else if (formData.password.length < 8) e.password = 'Min. 8 characters'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) {
      e.password = 'Needs uppercase, lowercase, number & special char'
    }
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      if (isJoin) {
        const result = await requestJoin({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          inviteCode: formData.inviteCode.trim().toUpperCase(),
        })
        if (result.success) {
          setJoinSubmitted(true)
        } else {
          setApiError(result.message || 'Could not send join request')
        }
      } else {
        const result = await register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          organizationName: formData.organizationName,
        })
        if (result.success) {
          navigate('/dashboard')
        } else {
          setApiError(result.message || 'Registration failed')
        }
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Something went wrong. Please try again.'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Confirmation screen shown after a join request is submitted.
  if (joinSubmitted) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#2C74B3]/15 border border-[#2C74B3]/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#2C74B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Request Sent</h1>
        <p className="text-gray-400 text-sm mb-8">
          Your request to join has been sent to the organization admin. You'll be able to log in once it's approved.
        </p>
        <button onClick={onSwitch} className="text-[#2C74B3] hover:text-white transition-colors font-medium text-sm">
          Back to Log in
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2C74B3]" />
          <span className="text-[#2C74B3] text-xs font-semibold uppercase tracking-widest">New Account</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-500 text-sm">Join us and start your security compliance journey</p>
      </div>

      {/* Mode toggle: create a new org vs. join an existing one */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        {[
          { key: 'create', label: 'New Organization' },
          { key: 'join', label: 'Join Existing' },
        ].map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => { setSignupMode(opt.key); setErrors({}); setApiError('') }}
            className={`py-2 rounded-md text-xs font-semibold transition-all ${
              signupMode === opt.key ? 'bg-[#2C74B3]/30 text-white border border-[#2C74B3]/40' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {[
          isJoin
            ? { name: 'inviteCode', label: 'Invite Code', placeholder: 'e.g. XCJDRWGK', type: 'text', autoComplete: 'off',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /> }
            : { name: 'organizationName', label: 'Organization Name', placeholder: 'Your Organization', type: 'text', autoComplete: 'organization',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
          { name: 'fullName', label: 'Full Name', placeholder: 'John Doe', type: 'text', autoComplete: 'name',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
          { name: 'email', label: 'Email Address', placeholder: 'you@example.com', type: 'email', autoComplete: 'email',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wider">{field.label}</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{field.icon}</svg>
              </div>
              <input name={field.name} type={field.type} value={formData[field.name]} onChange={handleChange}
                className={inputBase(errors[field.name])} placeholder={field.placeholder} autoComplete={field.autoComplete} />
            </div>
            {errors[field.name] && <p className="mt-1 text-xs text-red-400">{errors[field.name]}</p>}
          </div>
        ))}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wider">Password</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <input name="password" type={showPw ? 'text' : 'password'} value={formData.password} onChange={handleChange}
              className={`${inputBase(errors.password)} pr-10`} placeholder="Min. 8 characters" autoComplete="new-password" />
            <EyeIcon show={showPw} toggle={() => setShowPw(!showPw)} />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wider">Confirm Password</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange}
              className={`${inputBase(errors.confirmPassword)} pr-10`} placeholder="••••••••" autoComplete="new-password" />
            <EyeIcon show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
        </div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs"
          >
            {apiError}
          </motion.div>
        )}
        <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }} className={btnClass} style={btnStyle}>
          <span>{loading ? (isJoin ? 'Sending Request...' : 'Creating Account...') : (isJoin ? 'Send Join Request' : 'Register')}</span>
          {!loading && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
        </motion.button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-gray-400 text-xs">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <p className="text-center text-gray-400 text-xs">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-[#2C74B3] hover:text-white transition-colors font-medium">
          Log in
        </button>
      </p>
    </div>
  )
}

// ─── Brand Panel ───────────────────────────────────────────────────
const BrandPanel = ({ isLogin }) => (
  <div className="relative z-10 flex flex-col items-center text-center px-12">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.34, 1.2, 0.64, 1] }}
    >
      <motion.img
        src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
        alt="Amenly Logo"
        className="w-80 h-80 object-contain mx-auto mb-1"
        style={{ filter: 'drop-shadow(0 0 60px rgba(44,116,179,0.9))' }}
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <h2 className="text-5xl font-bold text-white tracking-wide -mt-14">Amenly</h2>
    </motion.div>

    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="text-gray-500 text-sm mt-4 mb-8 max-w-xs"
    >
      AI-powered security compliance platform
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <Link to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-white hover:border-[#2C74B3]/40 transition-all text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        {isLogin ? 'Back to Home' : 'Main Page'}
      </Link>
    </motion.div>
  </div>
)

// ─── Main AuthPage ─────────────────────────────────────────────────
const AuthPage = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode)
  const isLogin = mode === 'login'

  const ease = [0.43, 0.13, 0.23, 0.96]
  const duration = 0.6

  return (
    <div className="min-h-screen h-screen bg-black overflow-hidden relative flex">

      {/* ── Left slot ── */}
      <div className="w-1/2 h-full relative overflow-hidden">
        {/* Login Form - visible when isLogin */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-center items-center px-16 py-12 bg-black"
          animate={{ x: isLogin ? '0%' : '-100%', opacity: isLogin ? 1 : 0 }}
          transition={{ duration, ease }}
        >
          <div className="w-full max-w-sm">
            <LoginForm onSwitch={() => setMode('signup')} />
          </div>
        </motion.div>

        {/* Brand Panel - slides in from right when !isLogin */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#0a0a0f' }}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: isLogin ? '100%' : '0%', opacity: isLogin ? 0 : 1 }}
          transition={{ duration, ease }}
        >
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#2C74B3]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#2C74B3]/30 to-transparent" />
          <BrandPanel isLogin={false} />
        </motion.div>
      </div>

      {/* ── Right slot ── */}
      <div className="w-1/2 h-full relative overflow-hidden">
        {/* Brand Panel - visible when isLogin */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#0a0a0f' }}
          animate={{ x: isLogin ? '0%' : '100%', opacity: isLogin ? 1 : 0 }}
          transition={{ duration, ease }}
        >
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#2C74B3]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#205295]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#2C74B3]/30 to-transparent" />
          <BrandPanel isLogin={true} />
        </motion.div>

        {/* Signup Form - slides in from right when !isLogin */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-center items-center px-16 py-12 bg-black overflow-y-auto"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: isLogin ? '100%' : '0%', opacity: isLogin ? 0 : 1 }}
          transition={{ duration, ease }}
        >
          <div className="w-full max-w-sm">
            <SignupForm onSwitch={() => setMode('login')} />
          </div>
        </motion.div>
      </div>

    </div>
  )
}

export default AuthPage
