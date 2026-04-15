import SectionContainer from '../layout/SectionContainer'
import Button from '../Button'

const FinalCTASection = () => {
  return (
    <SectionContainer className="bg-black" padding="py-32">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
          Ditch The Complexity{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amenly-medium to-amenly-light">
            Own Your Security
          </span>
        </h2>
        
        <p className="text-silver/80 text-xl mb-12 leading-relaxed max-w-2xl mx-auto">
          Join thousands of organizations that have simplified their cybersecurity 
          with Amenly's intelligent platform.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          <Button variant="primary" className="px-12 py-4 text-base font-semibold shadow-[0_0_30px_rgba(44,116,179,0.5)]">
            Start Free Trial
          </Button>
          <Button variant="secondary" className="px-12 py-4 text-base font-semibold">
            Schedule Demo
          </Button>
        </div>
        
        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
          <div className="text-silver text-sm">Trusted by 500+ organizations</div>
          <div className="w-px h-4 bg-silver/30" />
          <div className="text-silver text-sm">ISO 27001 Certified</div>
          <div className="w-px h-4 bg-silver/30" />
          <div className="text-silver text-sm">SOC 2 Type II</div>
        </div>
      </div>
    </SectionContainer>
  )
}

export default FinalCTASection