import { lazy, Suspense } from 'react'
import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import ErrorBoundary from '../components/ErrorBoundary'

// Lazy load below-fold sections for better initial load performance
const FeaturesSection = lazy(() => import('../components/FeaturesSection'))
const HowItWorksSection = lazy(() => import('../components/HowItWorksSection'))
const CTASection = lazy(() => import('../components/CTASection'))
const Footer = lazy(() => import('../components/Footer'))

// Lightweight loading fallback
const SectionLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-2 border-white/10 border-t-amenly-light/50 rounded-full animate-spin" />
  </div>
)

const LandingPage = () => {
  return (
    <div className="bg-black">
      <ErrorBoundary>
        <Navbar />
      </ErrorBoundary>
      
      <ErrorBoundary>
        <div id="hero" className="h-screen">
          <HeroSection />
        </div>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <div id="features">
            <FeaturesSection />
          </div>
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <div id="how-it-works">
            <HowItWorksSection />
          </div>
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <div id="cta">
            <CTASection />
            <Footer />
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

export default LandingPage
