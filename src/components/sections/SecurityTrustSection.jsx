import SectionContainer from '../layout/SectionContainer'
import FeatureCard from '../ui/FeatureCard'
import Badge from '../ui/Badge'

const SecurityTrustSection = () => {
  const securityFeatures = [
    {
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Self-Managed Security',
      description: 'Complete control over your security infrastructure with on-premises deployment options.'
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      title: 'Advanced Authentication',
      description: 'Multi-factor authentication with biometric and hardware key support for maximum security.'
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
      title: 'Disaster Recovery',
      description: 'Automated backup and recovery systems ensure business continuity in any scenario.'
    }
  ]

  return (
    <section 
      className="relative min-h-screen flex items-center py-20 lg:py-24 overflow-hidden"
      style={{
        backgroundImage: 'url(/gemini-3-pro-image-preview-2k_b_A_dark_cinematic_fut.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 w-full">
        <div className="text-center mb-16">
          <Badge className="mb-8">Security & Trust</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Built for Safety,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amenly-medium to-amenly-light">
              Designed for You
            </span>
          </h2>
          <p className="text-silver/90 text-lg max-w-2xl mx-auto">
            Enterprise-grade security with user-friendly design. Your data stays protected while your team stays productive.
          </p>
        </div>

        {/* Shield Card */}
        <div className="flex justify-center mb-16">
          <div className="glass-card p-8 max-w-md">
            <img 
              src="/flux-2-max-20251222_b_Prompt__NanoBanana__-removebg-preview.png"
              alt="Security Shield"
              className="w-full h-48 object-contain filter drop-shadow-[0_0_30px_rgba(44,116,179,0.6)]"
            />
          </div>
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {securityFeatures.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default SecurityTrustSection