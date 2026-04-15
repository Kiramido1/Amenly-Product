import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'

gsap.registerPlugin(ScrollTrigger)

const FuturisticCTA = () => {
  const sectionRef = useRef(null)
  const orb1Ref = useRef(null)
  const orb2Ref = useRef(null)
  const orb3Ref = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const orb1 = orb1Ref.current
    const orb2 = orb2Ref.current
    const orb3 = orb3Ref.current

    // Parallax orbs
    gsap.to(orb1, {
      y: -150,
      x: 100,
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
    })

    gsap.to(orb2, {
      y: -200,
      x: -100,
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
    })

    gsap.to(orb3, {
      y: -100,
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
    })
  }, [])

  return (
    <section ref={sectionRef} className="relative py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />

      {/* Animated orbs */}
      <motion.div
        ref={orb1Ref}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent)' }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        ref={orb2Ref}
        className="absolute top-1/3 right-1/4 w-[700px] h-[700px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent)' }}
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: [0.7, 0.4, 0.7],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        ref={orb3Ref}
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3), transparent)' }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Holographic container */}
          <div className="relative backdrop-blur-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border-2 border-white/20 rounded-[3rem] p-16 overflow-hidden">
            {/* Animated gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Scan lines */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, transparent 2px, transparent 4px)',
                }}
              />
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-cyan-400/50 rounded-tl-[3rem]" />
            <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-purple-400/50 rounded-tr-[3rem]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-purple-400/50 rounded-bl-[3rem]" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-cyan-400/50 rounded-br-[3rem]" />

            {/* Content */}
            <div className="relative z-10 text-center">
              <motion.div
                className="inline-block mb-8"
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(59,130,246,0.6)',
                    '0 0 60px rgba(168,85,247,0.6)',
                    '0 0 30px rgba(59,130,246,0.6)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-cyan-400 text-sm font-bold tracking-widest uppercase px-8 py-4 rounded-full border-2 border-cyan-400/50 bg-cyan-400/10 backdrop-blur-xl">
                  Join the Future
                </span>
              </motion.div>

              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                <span className="text-white">Ready to Experience </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                  Next-Gen Security?
                </span>
              </h2>

              <p className="text-gray-300 text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of organizations already protected by AI-powered,
                quantum-safe security that evolves with your needs.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
                <Link to="/signup">
                  <motion.button
                    className="relative px-12 py-5 text-lg font-bold text-white rounded-full overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Animated gradient background */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600"
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{ backgroundSize: '200% 200%' }}
                    />
                    
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        boxShadow: '0 0 40px rgba(59,130,246,0.8), inset 0 0 20px rgba(255,255,255,0.2)',
                      }}
                    />

                    <span className="relative z-10 flex items-center gap-2">
                      Start Free Trial
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                  </motion.button>
                </Link>

                <motion.button
                  className="relative px-12 py-5 text-lg font-bold text-white rounded-full border-2 border-white/30 backdrop-blur-xl hover:border-cyan-400/50 transition-all duration-300 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">Watch Demo</span>
                  
                  {/* Hover glow */}
                  <motion.div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      boxShadow: '0 0 30px rgba(59,130,246,0.5)',
                    }}
                  />
                </motion.button>
              </div>

              {/* Trust indicators */}
              <motion.div
                className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {[
                  { icon: '✓', text: 'No credit card required' },
                  { icon: '✓', text: '14-day free trial' },
                  { icon: '✓', text: 'Cancel anytime' },
                  { icon: '✓', text: 'Enterprise support' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <motion.div
                      className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold"
                      animate={{
                        boxShadow: [
                          '0 0 10px rgba(59,130,246,0.5)',
                          '0 0 20px rgba(59,130,246,0.8)',
                          '0 0 10px rgba(59,130,246,0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    >
                      {item.icon}
                    </motion.div>
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Rotating rings */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-cyan-400/10 rounded-full pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-purple-400/10 rounded-full pointer-events-none"
              animate={{ rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default FuturisticCTA
