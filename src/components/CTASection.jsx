import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const CTASection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden bg-black">
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#2C74B3]/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#205295]/10 to-transparent rounded-full blur-3xl" />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex items-center justify-center">
        <motion.div
          initial={{ 
            width: '120px',
            height: '120px',
            borderRadius: '24px',
            opacity: 0,
            scale: 0.3,
          }}
          animate={isInView ? { 
            width: '100%',
            height: 'auto',
            borderRadius: '0px',
            opacity: 1,
            scale: 1,
          } : {}}
          transition={{
            duration: 0.9,
            ease: [0.34, 1.3, 0.64, 1],
            opacity: { duration: 0.4 },
            borderRadius: { duration: 0.7 },
          }}
          className="relative overflow-hidden"
          style={{ originX: 0.5, originY: 0.5 }}
        >
          {/* Content fades in after expand */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - 3D Logo with premium frame */}
            <div className="relative flex items-center justify-center">
              {/* Premium frame container - animates from small to full size */}
              <motion.div
                className="relative aspect-square"
                initial={{ width: '80px', opacity: 0 }}
                animate={isInView ? { width: '100%', opacity: 1 } : {}}
                transition={{
                  width: { duration: 0.9, ease: [0.34, 1.2, 0.64, 1] },
                  opacity: { duration: 0.3 },
                }}
                style={{ maxWidth: '28rem' }}
              >
                {/* Animated corner accents */}
                <motion.div
                  className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#2C74B3]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-[#2C74B3]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-[#2C74B3]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
                <motion.div
                  className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#2C74B3]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                />

                {/* Center logo - fades in after frame expands */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={isInView ? { opacity: 1, scale: 1, y: [0, -20, 0] } : {}}
                    transition={{
                      opacity: { duration: 0.4, delay: 0.7 },
                      scale: { duration: 0.5, delay: 0.7, ease: [0.34, 1.4, 0.64, 1] },
                      y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
                    }}
                  >
                    {/* Hexagon background */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="300" height="300" viewBox="0 0 300 300" className="opacity-20">
                        <defs>
                          <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2C74B3" />
                            <stop offset="100%" stopColor="#205295" />
                          </linearGradient>
                        </defs>
                        <polygon
                          points="150,30 250,90 250,210 150,270 50,210 50,90"
                          fill="none"
                          stroke="url(#hexGrad)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    {/* Rotating outer ring */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-72 h-72 rounded-full border border-[#2C74B3]/30 border-dashed" />
                    </motion.div>

                    {/* Logo with glow */}
                    <div className="relative z-10 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2C74B3]/30 to-[#205295]/30 rounded-full blur-3xl scale-150" />
                      <img 
                        src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png" 
                        alt="Amenly Logo" 
                        className="relative w-56 h-56 object-contain"
                        style={{ filter: 'drop-shadow(0 0 40px rgba(44, 116, 179, 0.6))' }}
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Right side - Content with premium styling */}
            <div className="relative z-10">

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              >
                <span className="text-white">Automate your</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2C74B3] via-[#205295] to-[#144272]">
                  compliance workflow
                </span>
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-gray-400 text-lg mb-10 leading-relaxed max-w-xl"
              >
                Leverage AI-powered document retrieval and intelligent analysis to streamline security compliance. Get instant answers from your compliance documentation.
              </motion.p>

              {/* Trust indicators - cleaner design */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex flex-col gap-3"
              >
                {[
                  { icon: '✓', text: 'AI-driven compliance automation' },
                  { icon: '✓', text: 'Instant answers from your documents' },
                  { icon: '✓', text: 'Enterprise-grade security' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-[#2C74B3]/20 flex items-center justify-center text-[#2C74B3] text-xs font-bold">
                      {item.icon}
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </motion.div>

              {/* Stats bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="mt-12 pt-8 border-t border-white/10"
              >
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '10K+', label: 'Documents' },
                    { value: '<2s', label: 'Response Time' },
                    { value: '95%', label: 'Accuracy' }
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTASection
