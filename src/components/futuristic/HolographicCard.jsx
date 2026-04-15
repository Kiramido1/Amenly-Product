import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const HolographicCard = ({ children, className = '', glowColor = 'rgba(44, 116, 179, 0.5)' }) => {
  const cardRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg'])

  const handleMouseMove = (e) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      {/* Holographic glow */}
      <motion.div
        className="absolute -inset-1 rounded-3xl blur-xl opacity-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at center, ${glowColor}, transparent)`,
        }}
        animate={{
          opacity: isHovered ? 0.8 : 0,
        }}
      />

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"
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

      {/* Card content */}
      <div
        className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 rounded-3xl overflow-hidden"
        style={{
          transform: 'translateZ(50px)',
        }}
      >
        {/* Holographic shimmer */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-3xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-400/50 rounded-br-3xl" />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

export default HolographicCard
