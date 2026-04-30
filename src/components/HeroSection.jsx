import Button from './Button'
import { useState, useEffect } from 'react'

const HeroSection = () => {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  useEffect(() => {
    // Preload the optimized WebP image
    const img = new Image()
    img.src = '/hero-bg.webp'
    img.onload = () => setImageLoaded(true)
  }, [])

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
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Tiny placeholder - loads instantly */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: 'url(/hero-bg-tiny.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          opacity: imageLoaded ? 0 : 1
        }}
      />
      
      {/* Full quality image - fades in when loaded */}
      <div 
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage: imageLoaded ? 'url(/hero-bg.webp)' : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: imageLoaded ? 1 : 0
        }}
      />
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
        <div className="relative">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            <span className="relative inline-block">
              <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.1s'}}>No</span>
              {' '}
              <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.25s'}}>Complexity.</span>
              {' '}
              <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.4s'}}>No</span>
              {' '}
              <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.55s'}}>Confusion.</span>
              {/* Strikethrough line - positioned at capital letter center using cap-height */}
              <span 
                className="absolute pointer-events-none overflow-hidden" 
                style={{
                  top: '0.6em', // Centered on capital letters
                  left: '-5%', // Extend left
                  right: '-5%', // Extend right
                  height: '5px'
                }}
              >
                <span className="block h-full bg-amenly-light rounded-full animate-strike-draw" style={{animationDelay: '0.7s'}}></span>
              </span>
            </span>
            <br />
            <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '0.85s'}}>Just</span>
            {' '}
            <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '1s'}}>Smarter</span>
            {' '}
            <span className="inline-block opacity-0 animate-word-reveal" style={{animationDelay: '1.15s'}}>Compliance.</span>
          </h1>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        onClick={scrollToNext}
        className="absolute bottom-10 inset-x-0 mx-auto w-fit z-10 flex flex-col items-center gap-2 cursor-pointer group opacity-0 animate-bounce-fade"
        style={{animationDelay: '1.5s'}}
      >
        <span className="text-white/60 text-xs font-light tracking-[0.2em] uppercase group-hover:text-white/90 transition-colors duration-300">
          Scroll to know more
        </span>
        <span className="block w-px h-6 bg-gradient-to-b from-white/0 via-white/60 to-white/0 group-hover:via-white/90 transition-colors duration-300" />
        <svg
          className="w-4 h-4 text-white/60 group-hover:text-white/90 animate-bounce-slow transition-colors duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div className="absolute bottom-20 left-20 max-w-[340px] z-10 opacity-0 animate-slide-in-left" style={{animationDelay: '1.3s'}}>
        <p className="text-white text-base leading-relaxed">
          Secure your organization with intelligent<br />
          governance and compliance tools. Understand<br />
          risks. Monitor systems. Make better decisions.
        </p>
      </div>
    </section>
  )
}

export default HeroSection
