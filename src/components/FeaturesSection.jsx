import { motion } from 'framer-motion'
import { memo } from 'react'

const features = [
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'AI-Driven Compliance Analysis',
    description: 'Leverage artificial intelligence to automatically analyze and ensure compliance with industry standards.',
    gradient: 'from-[#2C74B3]/20 via-[#205295]/10 to-[#144272]/20',
    glowColor: 'rgba(44, 116, 179, 0.3)',
    accentColor: '#2C74B3',
    stats: ['99.9% Accuracy', 'Real-time', 'Auto-Learning'],
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Role-Based Security Assessment',
    description: 'Comprehensive security assessments tailored to different roles and access levels.',
    gradient: 'from-[#205295]/20 via-[#144272]/10 to-[#0A2647]/20',
    glowColor: 'rgba(32, 82, 149, 0.3)',
    accentColor: '#205295',
    stats: ['Multi-Level', 'Customizable', 'Secure'],
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'Infrastructure Visualization',
    description: 'Interactive visualization of your entire infrastructure topology.',
    gradient: 'from-[#144272]/20 via-[#0A2647]/10 to-[#2C74B3]/20',
    glowColor: 'rgba(20, 66, 114, 0.3)',
    accentColor: '#144272',
    stats: ['3D View', 'Live Updates', 'Interactive'],
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Actionable Security Recommendations',
    description: 'Receive prioritized recommendations to improve your security posture.',
    gradient: 'from-[#0A2647]/20 via-[#2C74B3]/10 to-[#205295]/20',
    glowColor: 'rgba(10, 38, 71, 0.3)',
    accentColor: '#0A2647',
    stats: ['Prioritized', 'Actionable', 'Effective'],
  },
]

const FeatureCard = memo(({ feature, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="relative group h-full"
    >
      {/* Outer glow */}
      <div className={`absolute -inset-1 bg-gradient-to-br ${feature.color} rounded-[2rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500`} />

      {/* Main card */}
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative h-full bg-black/60 backdrop-blur-2xl border-2 border-white/10 rounded-[2rem] p-8 overflow-hidden group-hover:border-white/20 transition-all duration-300"
      >
        {/* Animated gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

        {/* Top decorative line */}
        <motion.div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color}`}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
          style={{ transformOrigin: 'left' }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon with gradient background */}
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
          >
            <div className="text-white">
              {feature.icon}
            </div>
          </motion.div>

          <h3 className="text-2xl font-bold mb-3 text-white">
            {feature.title}
          </h3>

          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {feature.description}
          </p>

          {/* Stats with new style */}
          <div className="flex flex-wrap gap-2">
            {feature.stats.map((stat, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 + i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className={`text-xs px-4 py-2 rounded-xl bg-gradient-to-r ${feature.color} bg-opacity-10 border border-white/10 font-medium text-white backdrop-blur-sm`}
              >
                {stat}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Bottom right accent */}
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10">
          <div className={`w-full h-full rounded-tl-full bg-gradient-to-tl ${feature.color}`} />
        </div>
      </motion.div>
    </motion.div>
  )
})

const FeaturesSection = () => {
  // Updated with more padding - should be visible now
  return (
    <section id="features" className="relative py-20 sm:py-24 lg:py-28 overflow-hidden bg-gradient-to-b from-black via-[#0A2647]/20 to-black">
      {/* Simple background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2C74B3]/10 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20 mt-8 lg:mt-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 text-white leading-tight"
          >
            Powerful Features for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2C74B3] via-[#205295] to-[#144272]">
              Complete Security
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-gray-400 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            Everything you need to manage cybersecurity governance, risk, and compliance.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-20 lg:mb-24">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* RAG System Technologies */}
        <motion.div
          className="mt-32 lg:mt-40"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center mb-12 lg:mb-16">
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Built on <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2C74B3] to-[#205295]">RAG Architecture</span>
            </h3>
            <p className="text-gray-400 text-base lg:text-lg max-w-2xl mx-auto">
              Retrieval-Augmented Generation system for accurate, contextual security insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: 'Document Retrieval',
                description: 'Advanced vector search across security documentation and compliance frameworks',
                color: '#2C74B3',
                gradient: 'from-[#2C74B3]/20 to-[#205295]/10'
              },
              {
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Context Generation',
                description: 'LLM-powered analysis that generates accurate responses based on retrieved context',
                color: '#205295',
                gradient: 'from-[#205295]/20 to-[#144272]/10'
              },
              {
                icon: (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                ),
                title: 'Knowledge Base',
                description: 'Comprehensive security standards database with real-time updates and versioning',
                color: '#144272',
                gradient: 'from-[#144272]/20 to-[#0A2647]/10'
              }
            ].map((tech, i) => (
              <motion.div
                key={i}
                className="relative group"
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glow effect */}
                <div 
                  className="absolute -inset-1 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                  style={{ backgroundColor: `${tech.color}40` }}
                />
                
                {/* Card */}
                <div className={`relative backdrop-blur-xl bg-gradient-to-br ${tech.gradient} border border-white/10 rounded-2xl p-6 lg:p-8 h-full group-hover:border-white/20 transition-all duration-300`}>
                  {/* Icon */}
                  <div 
                    className="mb-6 p-4 rounded-xl inline-block"
                    style={{ 
                      backgroundColor: `${tech.color}20`,
                      color: tech.color 
                    }}
                  >
                    {tech.icon}
                  </div>
                  
                  {/* Content */}
                  <h4 className="text-xl font-bold text-white mb-3">{tech.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{tech.description}</p>
                  
                  {/* Animated line */}
                  <motion.div
                    className="mt-6 h-1 rounded-full"
                    style={{ backgroundColor: `${tech.color}30` }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: tech.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default memo(FeaturesSection)