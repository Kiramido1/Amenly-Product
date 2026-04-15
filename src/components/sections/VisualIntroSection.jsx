import SectionContainer from '../layout/SectionContainer'
import Badge from '../ui/Badge'

const VisualIntroSection = () => {
  return (
    <SectionContainer className="bg-black">
      <div className="text-center">
        <Badge className="mb-8">A New Kind of Platform</Badge>
        
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Like Traditional Security,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amenly-medium to-amenly-light">
              But Smarter
            </span>
          </h2>
          
          <p className="text-silver/80 text-lg leading-relaxed mb-12">
            Amenly combines the reliability of traditional cybersecurity with the intelligence 
            of modern AI to deliver unparalleled protection for your organization.
          </p>
          
          {/* Visual Element */}
          <div className="relative">
            <div className="w-full max-w-2xl mx-auto h-64 bg-gradient-to-br from-amenly-darkest/50 to-amenly-dark/30 rounded-2xl border border-amenly-light/20 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-amenly-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amenly-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-amenly-light font-medium">Intelligent Security Analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}

export default VisualIntroSection