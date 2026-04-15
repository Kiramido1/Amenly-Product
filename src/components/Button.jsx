const Button = ({ children, variant = 'primary', className = '', disabled = false, ...props }) => {
  const variants = {
    primary: 'bg-amenly-light hover:bg-amenly-medium text-white transition-colors',
    secondary: 'bg-transparent border-2 border-amenly-light text-amenly-light hover:bg-amenly-light/10 hover:border-amenly-medium transition-colors',
    ghost: 'bg-transparent text-silver hover:text-white transition-colors',
  }

  return (
    <button
      className={`px-6 py-2 rounded-full font-medium ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
