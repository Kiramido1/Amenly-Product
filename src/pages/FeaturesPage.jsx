import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import FuturisticFooter from '../components/futuristic/FuturisticFooter'
import HolographicCard from '../components/futuristic/HolographicCard'
import DataStream from '../components/futuristic/DataStream'
import { useSmoothScroll } from '../hooks/useSmoothScroll'

const FeaturesPage = () => {
  useSmoothScroll()

  const featureCategories = [
    {
      title: 'AI & Machine Learning',
      icon: '🧠',
      color: 'from-cyan-500 to-blue-600',
      features: [
        {
          name: 'Neural Threat Detection',
          description: 'Advanced AI that learns your infrastructure and predicts threats before they materialize.',
          metrics: ['99.9% Accuracy', 'Real-time Learning', '<1ms Detection'],
        },
        {
          name: 'Behavioral Analysis',
          description: 'Deep learning algorithms that understand normal patterns and flag anomalies instantly.',
          metrics: ['Pattern Recognition', 'Anomaly Detection', 'Predictive Insights'],
        },
        {
          name: 'Auto-Remediation',
          description: 'Self-healing security that automatically responds to and neutralizes threats.',
          metrics: ['Zero-Touch', 'Instant Response', 'Self-Learning'],
        },
      ],
    },
    {
      title: 'Quantum Security',
      icon: '⚛️',
      color: 'from-purple-500 to-pink-600',
      features: [
        {
          name: 'Quantum-Safe Encryption',
          description: 'Future-proof encryption resistant to quantum computing attacks.',
          metrics: ['Post-Quantum', '256-bit', 'Military-Grade'],
        },
        {
          name: 'Multi-Dimensional Scanning',
          description: 'Quantum-inspired algorithms that analyze security from multiple dimensions.',
          metrics: ['Deep Scan', '360° Coverage', 'Zero Blind Spots'],
        },
        {
          name: 'Entangled Authentication',
          description: 'Quantum entanglement principles for unhackable authentication.',
          metrics: ['Unbreakable', 'Instant Verify', 'Zero-Knowledge'],
        },
      ],
    },
    {
      title: 'Infrastructure Intelligence',
      icon: '🌐',
      color: 'from-emerald-500 to-teal-600',
      features: [
        {
          name: '3D Infrastructure Mapping',
          description: 'Holographic visualization of your entire infrastructure in real-time.',
          metrics: ['Live 3D View', 'Interactive', 'Real-time Updates'],
        },
        {
          name: 'Predictive Scaling',
          description: 'AI predicts resource needs and auto-scales before demand spikes.',
          metrics: ['Auto-Scale', 'Cost Optimize', 'Zero Downtime'],
        },
        {
          name: 'Dependency Graphing',
          description: 'Visualize all system dependencies and potential failure points.',
          metrics: ['Full Visibility', 'Risk Mapping', 'Impact Analysis'],
        },
      ],
    },
    {
      title: 'Compliance & Governance',
      icon: '📋',
      color: 'from-orange-500 to-red-600',
      features: [
        {
          name: 'Auto-Compliance',
          description: 'Automatically maintain compliance with global security standards.',
          metrics: ['SOC 2', 'ISO 27001', 'GDPR'],
        },
        {
          name: 'Audit Trail AI',
          description: 'AI-powered audit trails that document every security event.',
          metrics: ['Complete History', 'Tamper-Proof', 'Instant Reports'],
        },
        {
          name: 'Policy Automation',
          description: 'Automatically enforce security policies across your organization.',
          metrics: ['Zero-Touch', 'Real-time', 'Adaptive'],
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
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
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
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
                Complete Feature Suite
              </span>
            </motion.div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="text-white">Security </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                Reimagined
              </span>
            </h1>

            <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
              Every feature designed for the future. Every capability powered by AI.
              Every protection quantum-safe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, catIndex) => (
        <section key={catIndex} className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category Header */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  className={`text-5xl w-20 h-20 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  {category.icon}
                </motion.div>
                <h2 className="text-4xl font-bold text-white">{category.title}</h2>
              </div>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {category.features.map((feature, featureIndex) => (
                <motion.div
                  key={featureIndex}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: featureIndex * 0.1 }}
                >
                  <HolographicCard glowColor={`rgba(59, 130, 246, 0.5)`}>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3">
                        {feature.name}
                      </h3>
                      <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {feature.metrics.map((metric, i) => (
                          <span
                            key={i}
                            className="text-xs px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/30"
                          >
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                  </HolographicCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Ready to Experience{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                All Features?
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Start your free trial and unlock the complete suite of next-gen security features.
            </p>
            <motion.button
              className="px-12 py-5 text-lg font-bold text-white rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Free Trial →
            </motion.button>
          </motion.div>
        </div>
      </section>

      <FuturisticFooter />
    </div>
  )
}

export default FeaturesPage
