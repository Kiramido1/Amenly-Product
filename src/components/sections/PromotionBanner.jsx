import SectionContainer from '../layout/SectionContainer'
import Button from '../Button'

const PromotionBanner = () => {
  return (
    <SectionContainer className="bg-gradient-to-r from-amenly-darkest via-amenly-dark to-amenly-darkest">
      <div className="text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Share Amenly,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amenly-medium to-amenly-light">
              Secure Together
            </span>
          </h2>
          
          <p className="text-silver/90 text-lg mb-8 leading-relaxed">
            Refer other organizations to Amenly and help build a more secure digital ecosystem. 
            Both you and your referral get exclusive benefits and priority support.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button variant="primary" className="px-8 py-3 text-sm font-semibold">
              Start Referring
            </Button>
            <Button variant="secondary" className="px-8 py-3 text-sm font-semibold">
              Learn More
            </Button>
          </div>
          
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: '🎁', title: 'Exclusive Benefits', desc: 'Special pricing for both parties' },
              { icon: '⚡', title: 'Priority Support', desc: '24/7 dedicated assistance' },
              { icon: '🌟', title: 'Early Access', desc: 'New features before anyone else' }
            ].map((benefit, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-3">{benefit.icon}</div>
                <h3 className="text-white font-semibold mb-2">{benefit.title}</h3>
                <p className="text-silver/70 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}

export default PromotionBanner