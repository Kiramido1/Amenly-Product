import { memo, useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ASSET_TYPE_META, STATUS_META } from '../../constants/assetConstants'
import { useDashboard } from '../../context/DashboardContext'

const AssetNode = ({ asset, index }) => {
  const { selectAsset, hoveredAsset, setHovered } = useDashboard()
  const [tooltipPos, setTooltipPos] = useState(null)
  const nodeRef = useRef(null)
  
  // Memoize metadata lookups
  const typeMeta = useMemo(() => ASSET_TYPE_META[asset.type] || ASSET_TYPE_META.server, [asset.type])
  const statusMeta = useMemo(() => STATUS_META[asset.status] || STATUS_META.warning, [asset.status])
  
  const isHovered = hoveredAsset === asset.id
  const isCritical = asset.status === 'critical'
  const isWarning = asset.status === 'warning'
  
  const riskColor = useMemo(() => {
    return asset.risk_score > 60 ? '#ef4444' : asset.risk_score > 30 ? '#94A3B8' : '#10b981'
  }, [asset.risk_score])

  const handleMouseEnter = useCallback(() => {
    setHovered(asset.id)
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const tooltipHeight = 180
      const tooltipWidth = 220
      
      // Calculate center position
      let x = rect.left + rect.width / 2
      let y = rect.bottom + 12
      let showBelow = true
      
      // Check if tooltip would go off bottom of screen
      if (y + tooltipHeight > viewportHeight - 20) {
        y = rect.top - 12
        showBelow = false
      }
      
      // Ensure tooltip doesn't go off left/right edges
      if (x - tooltipWidth / 2 < 10) {
        x = tooltipWidth / 2 + 10
      } else if (x + tooltipWidth / 2 > viewportWidth - 10) {
        x = viewportWidth - tooltipWidth / 2 - 10
      }
      
      setTooltipPos({ x, y, showBelow })
    }
  }, [asset.id, setHovered])

  const handleMouseLeave = useCallback(() => {
    setHovered(null)
    setTooltipPos(null)
  }, [setHovered])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    selectAsset(asset)
  }, [asset, selectAsset])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      selectAsset(asset)
    }
  }, [asset, selectAsset])

  // Memoize animation variants
  const glowAnimation = useMemo(() => {
    if (isCritical) {
      return {
        opacity: [0.5, 1, 0.5],
        scale: [2.5, 3.5, 2.5],
      }
    }
    if (isWarning) {
      return {
        opacity: [0.3, 0.6, 0.3],
        scale: [2.8, 3.2, 2.8],
      }
    }
    return {
      opacity: isHovered ? 1 : 0.4,
      scale: isHovered ? 3.5 : 3,
    }
  }, [isCritical, isWarning, isHovered])

  const glowTransition = useMemo(() => {
    if (isCritical || isWarning) {
      return {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    }
    return { duration: 0.3 }
  }, [isCritical, isWarning])

  return (
    <button
      ref={nodeRef}
      type="button"
      className="cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amenly-light focus:ring-offset-2 focus:ring-offset-black rounded-xl"
      style={{
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered ? 20 : 10,
        willChange: isHovered ? 'transform' : 'auto',
        pointerEvents: 'auto',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${asset.name}, ${typeMeta.label}, Risk score ${asset.risk_score}, Status ${statusMeta.label}, Department ${asset.department}`}
      role="button"
      tabIndex={0}
    >
      {/* Outer glow ring - optimized */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${statusMeta.color}30 0%, transparent 70%)`,
          transform: 'scale(3)',
          filter: 'blur(12px)',
        }}
        animate={glowAnimation}
        transition={glowTransition}
      />

      {/* Status indicator dot - only for critical/warning */}
      {(isCritical || isWarning) && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full z-10 pointer-events-none"
          style={{
            backgroundColor: statusMeta.color,
            boxShadow: `0 0 10px ${statusMeta.color}`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Node body - use CSS transforms */}
      <motion.div
        className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: `${statusMeta.color}18`,
          border: `2px solid ${statusMeta.color}50`,
          boxShadow: `0 0 20px ${statusMeta.color}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
          willChange: 'transform',
        }}
        whileHover={{ 
          scale: 1.2, 
          rotate: 5,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          style={{ color: statusMeta.color }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeMeta.icon} />
        </svg>
      </motion.div>

      {/* Label - CSS transition instead of Framer Motion */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap pointer-events-none transition-opacity duration-200"
        style={{
          opacity: isHovered ? 1 : 0,
        }}
      >
        <span className="text-[10px] sm:text-[11px] font-semibold text-white bg-black/90 px-3 py-1 rounded-lg border border-white/20 shadow-xl">
          {asset.name}
        </span>
      </div>

      {/* Tooltip - render in portal to avoid clipping */}
      {isHovered && tooltipPos && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: tooltipPos.showBelow ? `${tooltipPos.y}px` : 'auto',
            bottom: tooltipPos.showBelow ? 'auto' : `${window.innerHeight - tooltipPos.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-black/95 border border-white/20 rounded-xl px-4 py-3 w-[220px] shadow-2xl shadow-black/80 backdrop-blur-xl">
            {/* Arrow - changes direction based on position */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-[12px] h-[12px] bg-black/95 border-white/20 rotate-45"
              style={{
                [tooltipPos.showBelow ? 'top' : 'bottom']: '-6px',
                borderLeft: tooltipPos.showBelow ? '1px solid' : 'none',
                borderTop: tooltipPos.showBelow ? '1px solid' : 'none',
                borderRight: tooltipPos.showBelow ? 'none' : '1px solid',
                borderBottom: tooltipPos.showBelow ? 'none' : '1px solid',
              }}
            />
            
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-white/10">
              <span 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                style={{ 
                  backgroundColor: statusMeta.color, 
                  boxShadow: `0 0 8px ${statusMeta.color}` 
                }}
              />
              <span className="text-xs font-bold text-white truncate">{asset.name}</span>
            </div>
            
            {/* Stats */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/50 uppercase tracking-wider">Risk Score</span>
                <span 
                  className="text-[12px] font-bold px-2 py-0.5 rounded-md" 
                  style={{ 
                    color: riskColor,
                    backgroundColor: `${riskColor}15`,
                  }}
                >
                  {asset.risk_score}/100
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/50 uppercase tracking-wider">Compliance</span>
                <span className="text-[12px] font-bold text-amenly-light">{asset.compliance_score}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/50 uppercase tracking-wider">Department</span>
                <span className="text-[11px] font-medium text-white/70">{asset.department}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/10">
                <span className="text-[10px] text-white/50 uppercase tracking-wider">Status</span>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: `${statusMeta.color}20`, 
                    color: statusMeta.color, 
                    border: `1px solid ${statusMeta.color}40` 
                  }}
                >
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </button>
  )
}

// Custom comparison function for memo
const areEqual = (prevProps, nextProps) => {
  return prevProps.asset.id === nextProps.asset.id &&
         prevProps.index === nextProps.index
}

export default memo(AssetNode, areEqual)
