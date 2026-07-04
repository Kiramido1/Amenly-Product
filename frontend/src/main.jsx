import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initSmoothScroll } from './utils/smoothScroll.js'
import './index.css'

// Scroll reveal animations
const initScrollReveal = () => {
  const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale')
  
  const revealOnScroll = () => {
    revealElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top
      const windowHeight = window.innerHeight
      
      if (elementTop < windowHeight * 0.85) {
        element.classList.add('revealed')
      }
    })
  }
  
  window.addEventListener('scroll', revealOnScroll, { passive: true })
  revealOnScroll()
}

// Initialize after DOM is ready
setTimeout(() => {
  // Add Lenis classes to html
  document.documentElement.classList.add('lenis', 'lenis-smooth')
  
  // Initialize Lenis-style smooth scroll
  initSmoothScroll()
  initScrollReveal()
}, 100)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
