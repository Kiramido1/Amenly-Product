import { memo } from 'react'
import { motion } from 'framer-motion'

const statusIcons = {
  // Security/Shield icons
  secure: (color) => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path 
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  ),
  
  // Warning/Alert icons
  warning: (color) => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path 
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  ),
  
  // Critical/Danger icons
  critical: (color) => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  
  // Trend down icon
  trendDown: (color) => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path 
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  ),
  
  // Calendar icon
  calendar: (color) => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  
  // Check/Success icon
  check: (color) => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path 
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  ),
  
  // Search/Scan icon
  search: (color) => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  
  // Lightning/Fast icon
  lightning: (color) => (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path 
        d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  ),
}

const StatusIcon = ({ type = 'secure', color = '#10b981', className = '', animate = false }) => {
  const icon = statusIcons[type] || statusIcons.secure

  if (animate) {
    return (
      <motion.div
        className={className}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {icon(color)}
      </motion.div>
    )
  }

  return <div className={className}>{icon(color)}</div>
}

export default memo(StatusIcon)
