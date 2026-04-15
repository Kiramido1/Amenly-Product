import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <p className="text-[#2C74B3] text-sm font-semibold uppercase tracking-widest mb-4">404</p>
        <h1 className="text-5xl font-bold text-white mb-4">Page not found</h1>
        <p className="text-gray-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/">
          <button className="px-6 py-2.5 bg-[#2C74B3] hover:bg-[#205295] text-white rounded-full text-sm font-medium transition-colors">
            Back to Home
          </button>
        </Link>
      </motion.div>
    </div>
  )
}

export default NotFoundPage
