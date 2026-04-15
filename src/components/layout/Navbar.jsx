import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../Button'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
  { label: 'About', href: '#about' },
]

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/95 backdrop-blur-xl shadow-lg shadow-amenly-dark/20' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-20">
            {/* Logo — left */}
            <Link to="/" className="flex items-center space-x-3 group">
              <img 
                src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png" 
                alt="Amenly Logo" 
                className="h-12 w-auto transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-2xl font-bold text-white tracking-tight">Amenly</span>
            </Link>

            {/* Navigation Links — center (desktop) */}
            <div className="hidden md:flex items-center space-x-10">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-silver hover:text-amenly-light transition-colors text-sm font-medium tracking-wide"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right side — CTA + Hamburger */}
            <div className="flex items-center space-x-4">
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-sm font-medium text-white hover:text-amenly-light">
                  Login
                </Button>
              </Link>
              <Link to="/signup" className="hidden sm:block">
                <Button variant="primary" className="text-sm font-medium px-6 py-2.5">
                  Get Started
                </Button>
              </Link>

              {/* Hamburger — mobile */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex flex-col justify-center items-center w-10 h-10 space-y-1.5"
                aria-label="Toggle menu"
              >
                <motion.span
                  animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  className="block w-6 h-0.5 bg-white"
                />
                <motion.span
                  animate={mobileOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                  className="block w-6 h-0.5 bg-white"
                />
                <motion.span
                  animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  className="block w-6 h-0.5 bg-white"
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Animated separator line */}
      <div className="fixed top-20 left-0 right-0 z-40 h-px overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-amenly-light to-transparent animate-slide" />
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 pt-20 bg-black/98 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full space-y-8 px-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-white text-2xl font-semibold hover:text-amenly-light transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-6 flex flex-col space-y-4 w-full max-w-xs">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full py-3">
                    Login
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" className="w-full py-3">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
