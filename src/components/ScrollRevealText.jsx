import { useEffect, useRef, useState } from 'react'

const ScrollRevealText = ({ text, className = '' }) => {
  const containerRef = useRef(null)
  const [progress, setProgress] = useState(0)
  
  const words = text.split(' ')

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Calculate when element enters viewport (from bottom) to when it leaves (from top)
      const start = windowHeight
      const end = 0
      const current = rect.top
      
      // Progress from 0 to 1 as element scrolls through viewport
      let scrollProgress = 0
      if (current <= start && current >= end) {
        scrollProgress = 1 - (current / start)
      } else if (current < end) {
        scrollProgress = 1
      }
      
      setProgress(scrollProgress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <h2 ref={containerRef} className={className}>
      {words.map((word, index) => {
        const wordProgress = index / words.length
        const nextWordProgress = (index + 1) / words.length
        
        let opacity = 0.1
        
        if (progress >= nextWordProgress) {
          opacity = 1
        } else if (progress >= wordProgress) {
          const fadeProgress = (progress - wordProgress) / (nextWordProgress - wordProgress)
          opacity = 0.1 + (fadeProgress * 0.9)
        }
        
        return (
          <span
            key={index}
            style={{
              opacity,
              transition: 'opacity 0.3s ease-out',
              display: 'inline-block',
              marginRight: '0.25em'
            }}
          >
            {word}
          </span>
        )
      })}
    </h2>
  )
}

export default ScrollRevealText
