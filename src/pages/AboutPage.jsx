import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const team = [
  { name: 'Ahmed Hassan', role: 'CEO & Co-Founder', initials: 'AH' },
  { name: 'Sara Mohamed', role: 'CTO & Co-Founder', initials: 'SM' },
  { name: 'Omar Khalil', role: 'Head of AI Research', initials: 'OK' },
  { name: 'Nour Ali', role: 'Lead Security Engineer', initials: 'NA' },
]

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Top border glow */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#2C74B3]/60 to-transparent" />

      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-12">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#2C74B3] animate-pulse" />
            <span className="text-[#2C74B3] text-xs font-semibold uppercase tracking-widest">Our Team</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Built by security experts,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2C74B3] to-[#205295]">
              for security teams
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
            Amenly was founded with a single mission: make security compliance accessible, intelligent, and automated through the power of AI and RAG technology.
          </p>
        </motion.div>

        {/* Team grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16"
        >
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#2C74B3]/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2C74B3] to-[#205295] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {member.initials}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{member.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{member.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="p-8 rounded-2xl bg-gradient-to-br from-[#2C74B3]/10 to-transparent border border-[#2C74B3]/20"
        >
          <h2 className="text-xl font-bold text-white mb-3">Our Mission</h2>
          <p className="text-gray-400 leading-relaxed">
            We believe every organization deserves enterprise-grade security compliance tools. By combining RAG-powered document retrieval with intelligent analysis, Amenly helps teams understand their compliance posture instantly — without the complexity.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default AboutPage
