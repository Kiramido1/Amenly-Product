import { motion } from 'framer-motion'
import Button from '../Button'
import Hero3DScene from '../Hero3DScene'
import Badge from '../ui/Badge'

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden bg-black">
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

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
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
    </section>
  )
}

export default HeroSection
