const Badge = ({ 
  children, 
  variant = 'default',
  className = ''
}) => {
  const variants = {
    default: 'bg-black/80 border-amenly-light/30 text-amenly-light',
    primary: 'bg-amenly-light/10 border-amenly-light/50 text-amenly-light',
    secondary: 'bg-amenly-dark/50 border-amenly-medium/30 text-amenly-medium'
  }

  return (
    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border backdrop-blur-sm shadow-[0_0_15px_rgba(44,116,179,0.3)] ${variants[variant]} ${className}`}>
      <span className="w-2 h-2 bg-amenly-light rounded-full shadow-[0_0_8px_rgba(44,116,179,1)]" />
      <span className="text-xs font-semibold tracking-wider uppercase">
        {children}
      </span>
    </div>
  )
}

export default Badge