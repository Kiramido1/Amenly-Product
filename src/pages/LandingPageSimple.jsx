import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import Footer from '../components/Footer'
import { useSmoothScroll } from '../hooks/useSmoothScroll'

const LandingPageSimple = () => {
  // Comment out smooth scroll temporarily to test
  // useSmoothScroll()

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <HeroSection />
      
      {/* Simple test section */}
      <section className="py-20 text-center bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white mb-4">
            Test Section
          </h2>
          <p className="text-gray-400 text-lg">
            If you can see this, the basic page is working.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Hero, Navbar, and Footer are preserved.
          </p>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}

export default LandingPageSimple
