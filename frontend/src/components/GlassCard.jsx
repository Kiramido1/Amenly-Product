import { motion } from 'framer-motion'

const GlassCard = ({ children, className = '', hover = true }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      className={`bg-gradient-to-br from-amenly-darkest/40 to-amenly-dark/20 backdrop-blur-sm border border-amenly-dark/50 rounded-xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default GlassCard
