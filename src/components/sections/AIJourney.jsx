import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    phase: '01',
    title: 'Neural Onboarding',
    description: 'AI analyzes your infrastructure and creates a personalized security blueprint in seconds.',
    icon: '🧬',
    color: 'from-cyan-500 to-blue-600',
    features: ['Instant Setup', 'Auto-Discovery', 'Smart Mapping'],
  },
  {
    phase: '02',
    title: 'Quantum Assessment',
    description: 'Multi-dimensional security scan using quantum-inspired algorithms for complete visibility.',
    icon: '⚛️',
    color: 'from-purple-500 to-pink-600',
    features: ['Deep Scan', 'Risk Analysis', 'Compliance Check'],
  },
  {
    phase: '03',
    title: 'Predictive Intelligence',
    description: 'AI predicts potential threats before they materialize using advanced pattern recognition.',
    icon: '🔮',
    color: 'from-emerald-500 to-teal-600',
    features: ['Threat Prediction', 'Behavior Analysis', 'Anomaly Detection'],
  },
  {
    phase: '04',
    title: 'Autonomous Protection',
    description: 'Self-healing security that automatically responds to and neutralizes threats in real-time.',
    icon: '🛡️',
    color: 'from-orange-500 to-red-600',
    features: ['Auto-Response', 'Self-Healing', 'Zero-Touch Security'],
  },
]

const StepCard = ({ step, index }) => {
  const cardRef = useRef(null)
  const pathRef = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    gsap.fromTo(
      card,
      { opacity: 0, x: index % 2 === 0 ? -100 : 100, rotateY: 45 },
      {
        opacity: 1,
        x: 0,
        rotateY: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1,
        },
      }
    )

    // Animate connection path
    if (pathRef.current) {
      gsap.fromTo(
        pathRef.current,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: card,
            start: 'top 70%',
            end: 'top 40%',
            scrub: 1,
          },
        }
      )
    }
  }, [index])

  return (
    <div className="relative">
      <motion.div
        ref={cardRef}
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Holographic card */}
        <div className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 overflow-hidden group hover:border-cyan-400/50 transition-all duration-500">
          {/* Animated gradient background */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />

          {/* Phase number */}
          <div className="relative mb-6">
            <motion.div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} relative overflow-hidden`}
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-4xl relative z-10">{step.icon}</span>
              
              {/* Scan line */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent"
                animate={{
                  y: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>

            <div className={`mt-4 text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${step.color} opacity-20`}>
              {step.phase}
            </div>
          </div>

          {/* Content */}
          <h3 className="text-2xl font-bold mb-4 text-white">
            {step.title}
          </h3>

          <p className="text-gray-300 mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Features */}
          <div className="space-y-3">
            {step.features.map((feature, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div
                  className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color}`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
                <span className="text-cyan-200 text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Corner accents */}
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-400/30 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-purple-400/30 rounded-bl-3xl" />
        </div>
      </motion.div>

      {/* Connection line */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-1/2 left-full w-full h-px -translate-y-1/2 overflow-hidden">
          <motion.div
            ref={pathRef}
            className={`h-full bg-gradient-to-r ${step.color} origin-left`}
          />
          
          {/* Animated particle */}
          <motion.div
            className={`absolute top-1/2 w-3 h-3 rounded-full bg-gradient-to-r ${step.color} -translate-y-1/2`}
            animate={{
              left: ['0%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay: index * 0.5,
            }}
          />
        </div>
      )}
    </div>
  )
}

const AIJourney = () => {
  const sectionRef = useRef(null)

  return (
    <section ref={sectionRef} className="relative py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900" />

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-block mb-6"
            animate={{
              boxShadow: [
                '0 0 20px rgba(168,85,247,0.5)',
                '0 0 40px rgba(59,130,246,0.5)',
                '0 0 20px rgba(168,85,247,0.5)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-purple-400 text-sm font-bold tracking-widest uppercase px-6 py-3 rounded-full border-2 border-purple-400/50 bg-purple-400/10 backdrop-blur-xl">
              AI-Powered Journey
            </span>
          </motion.div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">From Setup to </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400">
              Autonomous Security
            </span>
          </h2>

          <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Experience a seamless journey powered by artificial intelligence that evolves with your needs.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </div>

        {/* Timeline visualization */}
        <motion.div
          className="mt-24 relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex items-center"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-2xl`}>
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <motion.div
                    className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-purple-400"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default AIJourney
