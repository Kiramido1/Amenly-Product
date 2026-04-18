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

export const useWordReveal = (selector, options = {}) => {
  const elementRef = useRef(null)

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    const words = element.querySelectorAll('.word')
    
    if (words.length === 0) return

    gsap.set(words, { opacity: 0.1 })

    const trigger = ScrollTrigger.create({
      trigger: element,
      start: options.start || 'top 25%',
      end: options.end || 'bottom 100%',
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
            opacity = fadeProgress
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

export const useParallax = (selector, yOffset, options = {}) => {
  useEffect(() => {
    const element = document.querySelector(selector)
    if (!element) return

    const animation = gsap.to(element, {
      y: yOffset,
      ease: 'none',
      scrollTrigger: {
        trigger: options.trigger || element,
        start: options.start || 'top top',
        end: options.end || 'bottom top',
        scrub: true,
      },
    })

    return () => {
      animation.kill()
    }
  }, [selector, yOffset, options.trigger, options.start, options.end])
}
