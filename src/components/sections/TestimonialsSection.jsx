import SectionContainer from '../layout/SectionContainer'
import TestimonialCard from '../ui/TestimonialCard'
import Badge from '../ui/Badge'

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Ahmed Hassan",
      role: "CISO, TechCorp",
      quote: "Amenly transformed our security posture. The AI-driven insights helped us identify vulnerabilities we never knew existed."
    },
    {
      name: "Sarah Al-Rashid", 
      role: "Security Manager, FinanceHub",
      quote: "The Arabic interface made it easy for our team to adopt. Compliance reporting is now automated and accurate."
    },
    {
      name: "Omar Khalil",
      role: "IT Director, MedTech Solutions", 
      quote: "Implementation was seamless. Within weeks, we achieved compliance standards that took months with our previous solution."
    },
    {
      name: "Layla Mansour",
      role: "Risk Analyst, DataFlow Inc",
      quote: "The real-time risk assessment feature is game-changing. We can now respond to threats before they become incidents."
    }
  ]

  return (
    <SectionContainer className="bg-black">
      <div className="text-center mb-16">
        <Badge className="mb-8">Customer Success</Badge>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Amenly Works{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amenly-medium to-amenly-light">
            Wherever You Are
          </span>
        </h2>
        <p className="text-silver/80 text-lg max-w-2xl mx-auto">
          Organizations across the Middle East trust Amenly to secure their digital infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={index}
            name={testimonial.name}
            role={testimonial.role}
            quote={testimonial.quote}
            className={index % 2 === 1 ? 'md:mt-8' : ''}
          />
        ))}
      </div>
    </SectionContainer>
  )
}

export default TestimonialsSection