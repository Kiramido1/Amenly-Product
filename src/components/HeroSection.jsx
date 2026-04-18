import { motion } from 'framer-motion'
import ScrollRevealText from './ScrollRevealText'
import SimpleDissolve from './SimpleDissolve'

console.log('HeroSection loaded with scroll animations')

const HeroSection = () => {
  console.log('HeroSection rendering')
  
  const scrollToNext = () => {
    if (window.lenis) {
      window.lenis.scrollTo('#features', {
        offset: 0,
        duration: 2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      })
    } else {
      const featuresSection = document.getElementById('features')
      if (featuresSection) {
        featuresSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }
  }

  return (
    <section 
      id="home" 
      className="relative min-h-[185vh] flex flex-col items-center justify-start overflow-hidden bg-black"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url(/gemini-3-pro-image-preview-2k_b_A_dark_cinematic_fut.png)',
        }}
      />
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Simple Dissolve Effect */}
      <SimpleDissolve sectionId="home" />

      {/* Top Section - Sticky */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center z-10">
        <div className="relative text-center max-w-6xl mx-auto px-6">
          <div className="relative">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
            >
              <span className="relative inline-block">
                <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.05s'}}>No</span>
                {' '}
                <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.1s'}}>Complexity.</span>
                {' '}
                <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.15s'}}>No</span>
                {' '}
                <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.2s'}}>Confusion.</span>
                <span className="absolute inset-0 flex items-center opacity-0 animate-strike-line" style={{animationDelay: '0.3s'}}>
                  <span className="w-full h-2 bg-amenly-light"></span>
                </span>
              </span>
              <br />
              <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.4s'}}>Just</span>
              {' '}
              <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.45s'}}>Smarter</span>
              {' '}
              <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.5s'}}>Compliance.</span>
            </motion.h1>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute bottom-20 left-20 max-w-[340px]"
          >
            <p className="text-white text-base leading-relaxed">
              Secure your organization with intelligent<br />
              governance and compliance tools. Understand<br />
              risks. Monitor systems. Make better decisions.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Scroll-Reveal Content Section */}
      <div className="relative w-full min-h-[85vh] flex items-center justify-center px-6 sm:px-8 lg:px-12 z-10 pb-32">
        <ScrollRevealText
          text="Secure your organization with intelligent governance and compliance tools that understand risks monitor systems and make better decisions"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-center max-w-6xl text-white"
        />
        
        {/* Scroll Indicator */}
        <motion.button
          onClick={scrollToNext}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group cursor-pointer bg-transparent border-none outline-none"
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
      </div>
    </section>
  )
}

export default HeroSection
