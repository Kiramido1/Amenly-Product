import { motion } from 'framer-motion'
import { useRef } from 'react'
import Button from '../Button'
import Hero3DScene from '../Hero3DScene'
import DissolveCanvas from '../DissolveCanvas'
import { SplitText } from '../../utils/textSplit'
import { useScrollAnimation, useWordReveal, useParallax } from '../../hooks/useScrollAnimation'

const HeroSection = () => {
  useScrollAnimation()
  
  const containerRef = useRef(null)
  const headlineRef = useWordReveal('.hero__headline', {
    start: 'top 50%',
    end: 'bottom 80%'
  })
  
  const scrollToNext = () => {
    const next = document.getElementById('features') || document.querySelector('section:nth-of-type(2)')
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section 
      ref={containerRef}
      id="home" 
      className="relative min-h-[185vh] flex flex-col items-center justify-start overflow-hidden bg-black"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => {
          const size = Math.random() * 2 + 1
          const delay = Math.random() * 3
          const duration = Math.random() * 2 + 2
          return (
            <div
              key={i}
              className="absolute rounded-full neon-dot"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            />
          )
        })}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amenly-light/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-amenly-medium/8 rounded-full blur-[120px]" />
      </div>

      {/* Dissolve Canvas Effect */}
      <DissolveCanvas 
        color="#2c74b3" 
        spread={0.5} 
        speed={1} 
        containerRef={containerRef}
      />

      {/* Top Section - Fixed viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center text-center px-6 sm:px-8 lg:px-12 z-10">
        {/* Floating 3D Asset */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <Hero3DScene />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
        >
          First Arabic Platform for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amenly-medium via-amenly-light to-amenly-medium">
            Intelligent Governance
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-silver/80 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mb-10"
        >
          Amenly helps organizations analyze cybersecurity posture, detect risks, and achieve 
          compliance through intelligent infrastructure analysis.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Button 
            variant="primary" 
            className="px-10 py-3.5 text-base font-semibold shadow-[0_0_30px_rgba(44,116,179,0.5)] hover:shadow-[0_0_45px_rgba(44,116,179,0.7)] transition-all"
          >
            Create an Account
          </Button>
        </motion.div>
      </div>

      {/* Scroll-Reveal Content Section */}
      <div className="relative w-full h-[85vh] flex items-center justify-center px-6 sm:px-8 lg:px-12 z-10">
        <h2 
          ref={headlineRef}
          className="hero__headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-center max-w-6xl"
        >
          <SplitText>
            Secure your organization with intelligent governance and compliance tools that understand risks monitor systems and make better decisions
          </SplitText>
        </h2>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        onClick={scrollToNext}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-10 inset-x-0 mx-auto w-fit flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-none outline-none"
        aria-label="Scroll to know more"
      >
        <span className="text-white/60 text-xs font-light tracking-[0.2em] uppercase group-hover:text-white/90 transition-colors duration-300">
          Scroll to know more
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-0.5"
        >
          <span className="block w-px h-6 bg-gradient-to-b from-white/0 via-white/60 to-white/0 group-hover:via-white/90 transition-colors duration-300" />
          <svg
            className="w-4 h-4 text-white/60 group-hover:text-white/90 transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.button>
    </section>
  )
}

export default HeroSection
