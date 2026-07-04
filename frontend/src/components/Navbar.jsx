import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'
import { useAuth } from '../hooks/useAuth'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  useEffect(() => {
    if (!mobileOpen) return
    const close = () => setMobileOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [mobileOpen])

  const navLinks = [
    { label: 'Why Amenly', to: '/' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'AI Compliance', to: '/ai-compliance' },
    { label: 'About Us', to: '/about' },
  ]

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50" style={{ width: 'calc(100% - 2rem)', maxWidth: '1100px' }}>
      <motion.nav
        initial={{
          width: '56px',
          borderRadius: '9999px',
          opacity: 0,
          y: -20,
        }}
        animate={{
          width: '100%',
          borderRadius: '24px',
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.8,
          delay: 0.2,
          ease: [0.34, 1.56, 0.64, 1], // spring-like overshoot
          opacity: { duration: 0.3, delay: 0.2 },
          borderRadius: { duration: 0.6, delay: 0.2 },
        }}
        className="relative bg-black/95 backdrop-blur-md shadow-lg overflow-hidden"
      >
        {/* Animated border */}
        <div
          className="absolute inset-0 animate-border p-0.5"
          style={{
            borderRadius: 'inherit',
            background: 'linear-gradient(to right, #0A2647, #144272, #0A2647)',
            backgroundSize: '200% 100%',
          }}
        >
          <div className="w-full h-full bg-black/95 backdrop-blur-md" style={{ borderRadius: 'inherit' }} />
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="relative z-10 px-4 sm:px-6 py-3"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img
                src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
                alt="Amenly Logo"
                className="h-9 w-auto"
              />
              <span className="text-lg font-bold text-white">Amenly</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-white/80 hover:text-white transition-colors text-sm font-medium whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {user?.role === 'org_admin' && (
                    <Link to="/admin" className="hidden sm:flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin
                    </Link>
                  )}
                  <span className="hidden sm:block text-white/80 text-sm font-medium">
                    {user?.full_name || user?.email || 'User'}
                  </span>
                  <Button size="sm" variant="outline" onClick={handleLogout}>
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hidden sm:block">
                    <Button size="sm" variant="primary">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup" className="hidden sm:block">
                    <Button size="sm" variant="secondary">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                aria-label="Toggle mobile menu"
                className="lg:hidden flex flex-col gap-1.5 p-1"
                onClick={(e) => { e.stopPropagation(); setMobileOpen(!mobileOpen) }}
              >
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="lg:hidden overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mt-4 pb-2 border-t border-white/10 pt-4 flex flex-col gap-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="text-white/80 hover:text-white transition-colors text-sm font-medium py-1"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {isAuthenticated ? (
                    <>
                      {user?.role === 'org_admin' && (
                        <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-white/80 hover:text-white transition-colors text-sm font-medium py-1">
                          Admin Panel
                        </Link>
                      )}
                      <Button fullWidth size="md" variant="outline" onClick={() => { setMobileOpen(false); handleLogout() }}>
                        Log Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        <Button fullWidth size="md" variant="primary">
                          Log In
                        </Button>
                      </Link>
                      <Link to="/signup" onClick={() => setMobileOpen(false)}>
                        <Button fullWidth size="md" variant="secondary">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.nav>
    </div>
  )
}

export default Navbar
