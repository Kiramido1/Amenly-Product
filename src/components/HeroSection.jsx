import Button from './Button'

const HeroSection = () => {
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
      style={{
        backgroundImage: 'url(/gemini-3-pro-image-preview-2k_b_A_dark_cinematic_fut.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
        <div className="relative">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
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
          </h1>
        </div>

        {/* Scroll Indicator */}
        <div 
          onClick={scrollToNext}
          className="mt-32 flex flex-col items-center gap-2 cursor-pointer opacity-0 animate-bounce-fade"
          style={{animationDelay: '0.8s'}}
        >
          <span className="text-white text-sm font-medium tracking-wide">Scroll to know more</span>
          <svg 
            className="w-6 h-6 text-white animate-bounce-slow" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-20 left-20 max-w-[340px] z-10 opacity-0 animate-slide-in-left" style={{animationDelay: '0.7s'}}>
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
