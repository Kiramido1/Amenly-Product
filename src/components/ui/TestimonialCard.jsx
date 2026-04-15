import GlassCard from '../GlassCard'

const TestimonialCard = ({ 
  avatar, 
  name, 
  role, 
  quote, 
  className = '' 
}) => {
  return (
    <GlassCard className={`p-6 hover:border-amenly-light/50 transition-all duration-300 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amenly-medium to-amenly-light flex items-center justify-center text-white font-bold">
          {avatar || name?.charAt(0)}
        </div>
        <div>
          <h4 className="text-white font-semibold">{name}</h4>
          <p className="text-silver text-sm">{role}</p>
        </div>
      </div>
      <blockquote className="text-silver/90 italic leading-relaxed">
        "{quote}"
      </blockquote>
    </GlassCard>
  )
}

export default TestimonialCard