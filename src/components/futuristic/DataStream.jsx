import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const DataStream = ({ className = '', color = '#2C74B3' }) => {
  const containerRef = useRef(null)

  const streams = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 2,
    left: `${Math.random() * 100}%`,
  }))

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {streams.map((stream) => (
        <motion.div
          key={stream.id}
          className="absolute w-px h-32"
          style={{
            left: stream.left,
            background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
          }}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{
            y: ['- 100%', '100vh'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: stream.duration,
            delay: stream.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

export default DataStream
