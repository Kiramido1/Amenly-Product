import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const AssetTooltip = ({ asset, position }) => {
  if (!asset) return null

  const statusColor = {
    secure: '#10b981',
    warning: '#94A3B8',
    critical: '#ef4444',
  }[asset.status]

  const statusLabel = {
    secure: 'Secure',
    warning: 'Warning',
    critical: 'Critical',
  }[asset.status]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 5 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="absolute z-50 pointer-events-none"
        style={{
          left: position?.x ?? 0,
          top: (position?.y ?? 0) - 8,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="bg-[#040A16]/98 backdrop-blur-xl border border-[#0F1D32]/60 rounded-xl px-4 py-3 min-w-[200px] shadow-2xl shadow-black/70">
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-[10px] h-[10px] bg-[#040A16]/98 border-r border-b border-[#0F1D32]/60 rotate-45" />

          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
            />
            <span className="text-xs font-semibold text-white truncate">{asset.name}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/40">Risk Score</span>
              <span className="text-[11px] font-semibold" style={{ color: asset.risk_score > 60 ? '#ef4444' : asset.risk_score > 30 ? '#94A3B8' : '#10b981' }}>
                {asset.risk_score}/100
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/40">Compliance</span>
              <span className="text-[11px] font-semibold text-[#2C74B3]">{asset.compliance_score}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/40">Status</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(AssetTooltip)
