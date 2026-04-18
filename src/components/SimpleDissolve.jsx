import { useEffect, useState } from 'react'

const SimpleDissolve = ({ sectionId = 'home' }) => {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    console.log('SimpleDissolve mounted for section:', sectionId)
    
    const handleScroll = () => {
      const section = document.getElementById(sectionId)
      if (!section) {
        console.log('Section not found:', sectionId)
        return
      }

      const rect = section.getBoundingClientRect()
      const sectionHeight = section.offsetHeight
      const windowHeight = window.innerHeight

      // Calculate scroll progress through the section
      const scrollStart = -rect.top
      const maxScroll = sectionHeight - windowHeight

      let progress = 0
      if (scrollStart > 0 && scrollStart < maxScroll) {
        progress = scrollStart / maxScroll
      } else if (scrollStart >= maxScroll) {
        progress = 1
      }

      console.log('Dissolve progress:', progress)
      setOpacity(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [sectionId])

  console.log('Dissolve rendering with opacity:', opacity)

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `linear-gradient(to top, rgba(44, 116, 179, ${opacity * 0.3}), transparent)`,
        transition: 'background 0.1s linear',
        zIndex: 2
      }}
    />
  )
}

export default SimpleDissolve
