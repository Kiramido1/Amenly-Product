import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HolographicCard from '../futuristic/HolographicCard'
import DataStream from '../futuristic/DataStream'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: '🧠',
    title: 'Neural Compliance Engine',
    description: 'AI-powered compliance analysis that learns and adapts to your organization\'s unique security landscape.',
    color: 'rgba(59, 130, 246, 0.5)',
    gradient: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
    dataPoints: ['99.9% Accuracy', 'Real-time Analysis', 'Self-Learning'],
  },
  {
    icon: '🛡️',
    title: 'Quantum Security Matrix',
    description: 'Multi-dimensional security assessment using quantum-inspired algorithms for unprecedented protection.',
    color: 'rgba(168, 85, 247, 0.5)',
    gradient: 'from-purple-500/20 via-pink-500/20 to-purple-500/20',
    dataPoints: ['256-bit Encryption', 'Zero-Trust', 'Quantum-Safe'],
  },
  {
    icon: '🌐',
    title: 'Holographic Infrastructure Map',
    description: 'Visualize your entire infrastructure in 3D space with real-time threat detection and response.',
    color: 'rgba(16, 185, 129, 0.5)',
    gradient: 'from-emerald-500/20 via-teal-500/20 to-emerald-500/20',
    dataPoints: ['3D Visualization', 'Live Monitoring', 'Predictive AI'],
  },
  {
    icon: '⚡',
    title: 'Autonomous Threat Response',
    description: 'Self-healing security system that identifies, isolates, and neutralizes threats before they escalate.',
    color: 'rgba(249, 115, 22, 0.5)',
    gradient: 'from-orange-500/20 via-amber-500/20 to-orange-500/20',
    dataPoints: ['<1ms Response', 'Auto-Remediation', 'Zero Downtime'],
  },
]

const FeatureCard = ({ feature, index }) => {
  const cardRef = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    gsap.fromTo(
      card,
      { opacity: 0, y: 100, scale: 0.8 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          end: 'top 50%',
          scrub: 1,
        },
      }
    )
  }, [])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0 }}
      className="relative group"
    >
      <HolographicCard glowColor={feature.color} className="h-full">
        <div className="p-8 h-full flex flex-col">
          {/* Icon with glow */}
          <motion.div
            className="text-6xl mb-6 relative"
            whileHover={{ scale: 1.2, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 blur-2xl opacity-50" style={{ background: feature.color }} />
            <span className="relative z-10">{feature.icon}</span>
          </motion.div>

          {/* Title */}
          <h3 className="text-2xl font-bold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200">
            {feature.title}
          </h3>

          {/* Description */}
          <p className="text-gray-300 mb-6 leading-relaxed flex-grow">
            {feature.description}
          </p>

          {/* Data points */}
          <div className="space-y-2">
            {feature.dataPoints.map((point, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-200">{point}</span>
              </motion.div>
            ))}
          </div>

          {/* Animated border */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </HolographicCard>
    </motion.div>
  )
}

const FuturisticFeatures = () => {
  const sectionRef = useRef(null)

  return (
    <section ref={sectionRef} className="relative py-40 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
      <DataStream color="#2C74B3" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent)' }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.3), transparent)' }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-block mb-6"
            animate={{
              boxShadow: [
                '0 0 20px rgba(59,130,246,0.5)',
                '0 0 40px rgba(168,85,247,0.5)',
                '0 0 20px rgba(59,130,246,0.5)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-cyan-400 text-sm font-bold tracking-widest uppercase px-6 py-3 rounded-full border-2 border-cyan-400/50 bg-cyan-400/10 backdrop-blur-xl">
              Next-Gen Security
            </span>
          </motion.div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Beyond </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient">
              Traditional Security
            </span>
          </h2>

          <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Experience the future of cybersecurity with AI-powered, quantum-safe protection
            that evolves with your organization.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {[
            { value: '99.99%', label: 'Uptime Guarantee' },
            { value: '<1ms', label: 'Response Time' },
            { value: '10M+', label: 'Threats Blocked' },
            { value: '24/7', label: 'AI Monitoring' },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative backdrop-blur-xl bg-white/5 border border-cyan-400/30 rounded-2xl p-6 text-center group hover:border-cyan-400/60 transition-all duration-300"
            >
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
              
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default FuturisticFeatures
