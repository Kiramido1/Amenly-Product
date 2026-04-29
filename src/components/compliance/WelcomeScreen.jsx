import { memo } from 'react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: 'Multi-Framework',
    desc: 'ISO 27001, NIST CSF, GDPR',
  },
  {
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'Expert Analysis',
    desc: 'Structured gap assessment',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    title: 'Live Scoring',
    desc: 'Real-time compliance score',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const WelcomeScreen = ({ onStart }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
      variants={containerVariants}
      className="flex-1 flex items-center justify-center p-4 sm:p-8"
    >
      <div className="max-w-2xl mx-auto text-center w-full">
        {/* Animated shield icon */}
        <motion.div
          variants={itemVariants}
          className="relative mx-auto mb-8 w-20 h-20"
        >
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amenly-light/15 to-amenly-dark/8 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amenly-light/10 to-amenly-dark/15 border border-amenly-light/20 flex items-center justify-center backdrop-blur-sm shadow-[0_0_30px_rgba(44,116,179,0.15)]">
            <svg className="w-10 h-10 text-amenly-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amenly-light/[0.08] border border-amenly-light/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amenly-light/70" />
            <span className="text-[11px] text-amenly-light/90 font-semibold tracking-wider uppercase">Compliance Assessment</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight"
        >
          Compliance{' '}
          <span className="bg-gradient-to-r from-amenly-light to-amenly-medium bg-clip-text text-transparent">
            Assessment
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-white/45 text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed"
        >
          Evaluate your organization's security posture in minutes with a guided, structured assessment that delivers actionable compliance insights.
        </motion.p>

        {/* Decorative divider */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#144272]/30" />
          <div className="w-1 h-1 rounded-full bg-[#144272]/40" />
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#144272]/30" />
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10"
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group relative p-5 rounded-xl bg-white/[0.015] border border-white/[0.05] hover:border-amenly-light/25 transition-all duration-500 hover:bg-white/[0.025] hover:shadow-[0_0_30px_rgba(44,116,179,0.08)]"
            >
              <div className="w-10 h-10 rounded-lg bg-amenly-light/[0.08] border border-amenly-light/20 flex items-center justify-center mb-3 mx-auto group-hover:scale-105 group-hover:border-amenly-light/40 group-hover:bg-amenly-light/15 group-hover:shadow-[0_0_20px_rgba(44,116,179,0.2)] transition-all duration-500">
                <svg className="w-5 h-5 text-amenly-light/80 group-hover:text-amenly-light transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feat.icon} />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white/75 mb-1">{feat.title}</p>
              <p className="text-xs text-white/35">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="group relative px-8 py-4 bg-gradient-to-r from-amenly-light to-amenly-dark text-white font-semibold text-base rounded-xl shadow-[0_0_30px_rgba(44,116,179,0.3)] hover:shadow-[0_0_50px_rgba(44,116,179,0.5)] hover:scale-[1.02] transition-all duration-500 overflow-hidden border border-white/[0.1]"
            aria-label="Start compliance assessment"
            id="start-assessment-btn"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.15] to-white/0"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
            <span className="relative z-10 flex items-center gap-3">
              Start Assessment
              <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </motion.button>

          <p className="text-xs text-white/20 mt-5 flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Takes ~5 minutes · All data stays private
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default memo(WelcomeScreen)
