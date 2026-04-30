import { motion } from 'framer-motion'

/**
 * Unified Button Component - Matches Login Page Style
 * 
 * Props:
 * - children: Button text/content
 * - onClick: Click handler
 * - disabled: Disabled state
 * - loading: Loading state
 * - type: button type (button, submit, reset)
 * - className: Additional classes
 * - variant: 'primary' (default) | 'secondary' | 'outline'
 * - size: 'sm' | 'md' (default) | 'lg'
 * - fullWidth: boolean
 * - icon: React element for icon
 * - iconPosition: 'left' | 'right' (default)
 */

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  type = 'button',
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  ...props 
}) => {
  
  // Base styles matching login button
  const baseClass = "rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md transition-all flex items-center justify-center gap-2 group"
  
  // Size variants
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  }
  
  // Variant styles - ALL USE SAME LOGIN STYLE
  const variantStyles = {
    primary: {
      className: 'border border-[#2C74B3]/30 hover:border-[#2C74B3]/60',
      style: { background: 'rgba(10, 38, 71, 0.8)' }
    },
    secondary: {
      className: 'border border-[#2C74B3]/30 hover:border-[#2C74B3]/60',
      style: { background: 'rgba(10, 38, 71, 0.8)' }
    },
    outline: {
      className: 'border border-[#2C74B3]/30 hover:border-[#2C74B3]/60',
      style: { background: 'rgba(10, 38, 71, 0.8)' }
    }
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  const selectedVariant = variantStyles[variant] || variantStyles.primary
  const selectedSize = sizeClasses[size] || sizeClasses.md
  
  const finalClassName = `${baseClass} ${selectedSize} ${selectedVariant.className} ${widthClass} ${className}`
  
  // Arrow icon for default behavior
  const defaultIcon = (
    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
  
  const displayIcon = icon || defaultIcon
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      className={finalClassName}
      style={selectedVariant.style}
      {...props}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {iconPosition === 'left' && !loading && displayIcon}
          <span>{children}</span>
          {iconPosition === 'right' && !loading && displayIcon}
        </>
      )}
    </motion.button>
  )
}

export default Button
