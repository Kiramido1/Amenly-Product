import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const useScrollAnimation = () => {
  useEffect(() => {
    // Refresh ScrollTrigger on mount
    ScrollTrigger.refresh()

    return () => {
      // Clean up all ScrollTriggers on unmount
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])
}

export const useWordReveal = (options = {}) => {
  const elementRef = useRef(null)

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    const words = element.querySelectorAll('.word')
    
    if (words.length === 0) {
      console.warn('No .word elements found for word reveal animation')
      return
    }

    console.log(`Found ${words.length} words for animation`)

    gsap.set(words, { opacity: 0.1 })

    const trigger = ScrollTrigger.create({
      trigger: element,
      start: options.start || 'top 60%',
      end: options.end || 'bottom 100%',
      scrub: true,
      markers: false, // Set to true for debugging
      onUpdate: (self) => {
        const progress = self.progress
        const totalWords = words.length

        words.forEach((word, index) => {
          const wordProgress = index / totalWords
          const nextWordProgress = (index + 1) / totalWords

          let opacity = 0.1

          if (progress >= nextWordProgress) {
            opacity = 1
          } else if (progress >= wordProgress) {
            const fadeProgress =
              (progress - wordProgress) / (nextWordProgress - wordProgress)
            opacity = 0.1 + (fadeProgress * 0.9)
          }

          gsap.to(word, {
            opacity: opacity,
            duration: 0.1,
            overwrite: true,
          })
        })
      },
    })

    return () => {
      trigger.kill()
    }
  }, [options.start, options.end])

  return elementRef
}
