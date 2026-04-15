import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const DashboardPage = () => {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Dashboard</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Your compliance dashboard is coming soon. Log in to access your security governance tools.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/login">
            <button className="px-6 py-2.5 bg-[#2C74B3] hover:bg-[#205295] text-white rounded-full text-sm font-medium transition-colors">
              Log In
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

export default DashboardPage
