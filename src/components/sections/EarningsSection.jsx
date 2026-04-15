import SectionContainer from '../layout/SectionContainer'
import Button from '../Button'
import Badge from '../ui/Badge'

const EarningsSection = () => {
  return (
    <SectionContainer className="bg-gradient-to-br from-amenly-darkest to-black">
      <div className="max-w-4xl mx-auto text-center">
        <Badge className="mb-8">ROI Calculator</Badge>
        
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          See How Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amenly-medium to-amenly-light">
            Security Investment
          </span>{' '}
          Could Grow
        </h2>
        
        <p className="text-silver/90 text-lg mb-12 leading-relaxed">
          Calculate the potential cost savings and ROI from implementing Amenly's 
          intelligent security platform in your organization.
        </p>
        
        {/* Calculator Card */}
        <div className="bg-black/50 border border-amenly-light/20 rounded-2xl p-8 backdrop-blur-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-amenly-light mb-2">85%</div>
              <div className="text-silver text-sm">Reduction in Security Incidents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amenly-light mb-2">60%</div>
              <div className="text-silver text-sm">Faster Threat Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amenly-light mb-2">$2.4M</div>
              <div className="text-silver text-sm">Average Annual Savings</div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="primary" className="px-8 py-3 text-sm font-semibold">
              Calculate Your ROI
            </Button>
            <Button variant="secondary" className="px-8 py-3 text-sm font-semibold">
              Download Report
            </Button>
          </div>
        </div>
        
        <p className="text-silver/60 text-sm">
          * Based on average enterprise deployment with 1000+ employees
        </p>
      </div>
    </SectionContainer>
  )
}

export default EarningsSection