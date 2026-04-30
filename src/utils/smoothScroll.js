/**
 * Lenis-Style Smooth Scroll Implementation
 * Mimics the buttery smooth scrolling from moneda.com
 */

class LenisStyleScroll {
  constructor(options = {}) {
    this.wrapper = options.wrapper || window
    this.content = options.content || document.documentElement
    this.duration = options.duration || 1.2
    this.easing = options.easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)))
    this.smooth = options.smooth !== false
    this.smoothTouch = options.smoothTouch || false
    this.direction = options.direction || 'vertical'
    this.gestureDirection = options.gestureDirection || 'vertical'
    this.infinite = options.infinite || false
    this.lerp = options.lerp || 0.1 // Lower = smoother but slower
    this.wheelMultiplier = options.wheelMultiplier || 1
    this.touchMultiplier = options.touchMultiplier || 2
    
    this.animatedScroll = 0
    this.targetScroll = 0
    this.currentScroll = 0
    this.isScrolling = false
    this.isStopped = false
    this.rafId = null
    
    this.init()
  }
  
  init() {
    this.targetScroll = this.currentScroll = this.animatedScroll = window.scrollY
    
    // Wheel event
    window.addEventListener('wheel', this.onWheel.bind(this), { passive: false })
    
    // Touch events for mobile
    if (this.smoothTouch) {
      window.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false })
      window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false })
      window.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false })
    }
    
    // Anchor links
    document.addEventListener('click', this.onAnchorClick.bind(this))
    
    // Start animation loop
    this.animate()
  }
  
  onWheel(e) {
    if (this.isStopped) return
    
    e.preventDefault()
    
    const delta = e.deltaY || e.detail || e.wheelDelta
    this.targetScroll += delta * this.wheelMultiplier
    this.clampTarget()
    
    this.isScrolling = true
  }
  
  onTouchStart(e) {
    this.touchStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }
  
  onTouchMove(e) {
    if (this.isStopped) return
    
    const deltaY = this.touchStart.y - e.touches[0].clientY
    this.targetScroll += deltaY * this.touchMultiplier
    this.clampTarget()
    
    this.touchStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
    
    this.isScrolling = true
  }
  
  onTouchEnd() {
    // Add momentum
  }
  
  onAnchorClick(e) {
    const anchor = e.target.closest('a[href^="#"]')
    if (!anchor) return
    
    e.preventDefault()
    const targetId = anchor.getAttribute('href').slice(1)
    
    if (!targetId) {
      this.scrollTo(0)
      return
    }
    
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      const offset = 80
      const targetY = targetElement.getBoundingClientRect().top + this.currentScroll - offset
      this.scrollTo(targetY)
    }
  }
  
  scrollTo(target, options = {}) {
    this.targetScroll = target
    this.clampTarget()
    
    if (options.immediate) {
      this.animatedScroll = this.currentScroll = this.targetScroll
      window.scrollTo(0, this.targetScroll)
    }
  }
  
  clampTarget() {
    const maxScroll = this.content.scrollHeight - window.innerHeight
    this.targetScroll = Math.max(0, Math.min(this.targetScroll, maxScroll))
  }
  
  animate() {
    if (this.isStopped) return
    
    // Lerp (linear interpolation) for smooth scrolling
    const delta = this.targetScroll - this.animatedScroll
    this.animatedScroll += delta * this.lerp
    
    // Round to avoid sub-pixel rendering
    this.animatedScroll = Math.round(this.animatedScroll * 100) / 100
    
    // Update scroll position
    if (Math.abs(delta) > 0.01) {
      window.scrollTo(0, this.animatedScroll)
      this.currentScroll = this.animatedScroll
      this.isScrolling = true
    } else {
      this.isScrolling = false
    }
    
    this.rafId = requestAnimationFrame(this.animate.bind(this))
  }
  
  stop() {
    this.isStopped = true
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }
  }
  
  start() {
    this.isStopped = false
    this.animate()
  }
  
  destroy() {
    this.stop()
    window.removeEventListener('wheel', this.onWheel)
    window.removeEventListener('touchstart', this.onTouchStart)
    window.removeEventListener('touchmove', this.onTouchMove)
    window.removeEventListener('touchend', this.onTouchEnd)
    document.removeEventListener('click', this.onAnchorClick)
  }
}

// Initialize
let scrollInstance = null

export const initSmoothScroll = () => {
  if (scrollInstance) {
    scrollInstance.destroy()
  }
  
  scrollInstance = new LenisStyleScroll({
    lerp: 0.08, // Smoothness factor (lower = smoother, 0.08 is like Lenis)
    wheelMultiplier: 1,
    touchMultiplier: 2,
    smoothTouch: false, // Disable on touch for better mobile performance
    infinite: false
  })
  
  return scrollInstance
}

export const destroySmoothScroll = () => {
  if (scrollInstance) {
    scrollInstance.destroy()
    scrollInstance = null
  }
}

export default LenisStyleScroll
