import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import HowItWorksSection from '../components/HowItWorksSection'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'
import { useSmoothScroll } from '../hooks/useSmoothScroll'

const LandingPage = () => {
  useSmoothScroll()

  return (
    <div className="bg-black">
      <Navbar />
      <HeroSection />
      <div id="features" className="min-h-screen">
        <FeaturesSection />
      </div>
      <div id="how-it-works" className="min-h-screen">
        <HowItWorksSection />
      </div>
      <div id="cta" className="min-h-screen">
        <CTASection />
        <Footer />
      </div>
    </div>
  )
}

export default LandingPage
