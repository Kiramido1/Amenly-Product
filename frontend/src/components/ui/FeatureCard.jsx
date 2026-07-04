import GlassCard from '../GlassCard'

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  className = '',
  hover = true 
}) => {
  return (
    <GlassCard 
      className={`h-full group transition-all duration-300 ${hover ? 'hover:border-amenly-light/50 hover:shadow-[0_0_30px_rgba(44,116,179,0.3)]' : ''} ${className}`}
      hover={hover}
    >
      <div className="text-amenly-light mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-3 text-white group-hover:text-amenly-light transition-colors">
        {title}
      </h3>
      <p className="text-silver text-sm leading-relaxed">
        {description}
      </p>
    </GlassCard>
  )
}

export default FeatureCard