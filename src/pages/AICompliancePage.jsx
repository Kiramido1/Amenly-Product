import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const AICompliancePage = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        <Link to="/" className="inline-flex items-center gap-3 mb-10">
          <img
            src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
            alt="Amenly Logo"
            className="h-10 w-auto"
          />
          <span className="text-xl font-bold text-white">Amenly</span>
        </Link>

        <div className="w-16 h-16 rounded-2xl bg-[#2C74B3]/20 border border-[#2C74B3]/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#2C74B3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">AI Compliance</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Our RAG-powered AI compliance engine is being fine-tuned. It will help you retrieve, analyze, and act on your security documentation instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/login">
            <button className="px-6 py-2.5 bg-[#2C74B3] hover:bg-[#205295] text-white rounded-full text-sm font-medium transition-colors">
              Get Early Access
            </button>
          </Link>
          <Link to="/">
            <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-full text-sm font-medium transition-colors border border-white/10">
              Back to Home
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default AICompliancePage
