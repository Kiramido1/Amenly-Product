import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboard } from '../../context/DashboardContext'
import { ASSET_TYPE_META, STATUS_META } from '../../constants/assetConstants'

const AssetDetailPanel = () => {
  const { selectedAsset, closePanel } = useDashboard()

  return (
    <AnimatePresence>
      {selectedAsset && (
        <>
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            style={{ zIndex: 9998 }}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-black/95 backdrop-blur-2xl border-l border-white/10 overflow-y-auto scrollbar-chat"
            style={{
              boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
              zIndex: 9999,
            }}
          >
            <PanelContent asset={selectedAsset} onClose={closePanel} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

const PanelContent = ({ asset, onClose }) => {
  const typeMeta = ASSET_TYPE_META[asset.type] || ASSET_TYPE_META.server
  const statusMeta = STATUS_META[asset.status] || STATUS_META.warning
  const vulnerabilities = asset.vulnerabilities || []

  const riskColor = asset.risk_score > 60 ? '#ef4444' : asset.risk_score > 30 ? '#94A3B8' : '#10b981'

  // AI Recommendation based on asset status
  const getAIRecommendation = () => {
    if (asset.status === 'critical') {
      return {
        type: 'critical',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
        title: 'Immediate Action Required',
        message: `Apply security patches immediately. ${vulnerabilities.length} critical vulnerabilities detected. Isolate asset from production network until remediated.`,
        color: '#ef4444',
        badge: 'CRITICAL',
      }
    } else if (asset.status === 'warning') {
      return {
        type: 'warning',
        icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        title: 'Recommended Actions',
        message: `Schedule maintenance window for updates. Review access controls and implement MFA. Monitor for unusual activity patterns.`,
        color: '#94A3B8',
        badge: 'WARNING',
      }
    } else {
      return {
        type: 'success',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        title: 'Asset Secure',
        message: `Continue regular monitoring. Next scheduled scan in 24 hours. All compliance requirements met.`,
        color: '#10b981',
        badge: 'SECURE',
      }
    }
  }

  const aiRec = getAIRecommendation()

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-sm"
            style={{ 
              backgroundColor: `${statusMeta.color}20`, 
              border: `2px solid ${statusMeta.color}40`,
              boxShadow: `0 0 20px ${statusMeta.color}30`,
            }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <svg className="w-7 h-7" style={{ color: statusMeta.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeMeta.icon} />
            </svg>
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-white">{asset.name}</h2>
            <p className="text-xs text-white/50">{typeMeta.label} • {asset.department}</p>
          </div>
        </div>

        <motion.button
          onClick={onClose}
          className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
          aria-label="Close panel"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <motion.span
          className="px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm"
          style={{ 
            backgroundColor: `${statusMeta.color}20`, 
            color: statusMeta.color, 
            border: `1px solid ${statusMeta.color}40`,
            boxShadow: `0 0 15px ${statusMeta.color}20`,
          }}
          animate={{
            boxShadow: [`0 0 15px ${statusMeta.color}20`, `0 0 20px ${statusMeta.color}40`, `0 0 15px ${statusMeta.color}20`],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          {statusMeta.label}
        </motion.span>
        <span className="text-[11px] text-white/40 font-mono">ID: {asset.id}</span>
      </div>

      {/* AI Recommendation Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl backdrop-blur-xl border"
        style={{
          backgroundColor: `${aiRec.color}10`,
          borderColor: `${aiRec.color}30`,
        }}
      >
        <div className="flex items-start gap-3">
          <motion.div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${aiRec.color}20`,
              border: `1px solid ${aiRec.color}40`,
            }}
            animate={{
              boxShadow: [`0 0 10px ${aiRec.color}30`, `0 0 20px ${aiRec.color}50`, `0 0 10px ${aiRec.color}30`],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <svg className="w-5 h-5" style={{ color: aiRec.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={aiRec.icon} />
            </svg>
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: aiRec.color }}>
                AI Recommendation
              </span>
              <span 
                className="text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                style={{
                  backgroundColor: `${aiRec.color}20`,
                  color: aiRec.color,
                  border: `1px solid ${aiRec.color}40`,
                }}
              >
                {aiRec.badge}
              </span>
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: aiRec.color }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{aiRec.title}</h4>
            <p className="text-xs text-white/70 leading-relaxed">{aiRec.message}</p>
          </div>
        </div>
      </motion.div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Risk Score */}
        <motion.div 
          className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl"
          whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 font-bold">Risk Score</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold" style={{ color: riskColor }}>{asset.risk_score}</span>
            <span className="text-xs text-white/40 mb-1.5">/100</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ 
                backgroundColor: riskColor,
                boxShadow: `0 0 10px ${riskColor}60`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${asset.risk_score}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Compliance */}
        <motion.div 
          className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl"
          whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 font-bold">Compliance</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold text-amenly-light">{asset.compliance_score}</span>
            <span className="text-xs text-white/40 mb-1.5">%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amenly-medium to-amenly-light"
              style={{
                boxShadow: '0 0 10px rgba(44,116,179,0.6)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${asset.compliance_score}%` }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Details */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl space-y-3">
        <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Asset Details
        </p>
        {[
          { label: 'IP / Identifier', value: asset.ip, icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
          { label: 'Department', value: asset.department, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { label: 'Type', value: typeMeta.label, icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
          { label: 'Last Scan', value: asset.last_scan, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((item) => (
          <motion.div 
            key={item.label} 
            className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              <span className="text-xs text-white/50">{item.label}</span>
            </div>
            <span className="text-xs font-semibold text-white/80">{item.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Vulnerabilities */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-gray-500/10 border border-red-500/20 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Vulnerabilities
          </p>
          <motion.span
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
            style={{
              backgroundColor: vulnerabilities.length > 2 ? 'rgba(239,68,68,0.2)' : vulnerabilities.length > 0 ? 'rgba(148,163,184,0.2)' : 'rgba(16,185,129,0.2)',
              color: vulnerabilities.length > 2 ? '#ef4444' : vulnerabilities.length > 0 ? '#94A3B8' : '#10b981',
              border: `1px solid ${vulnerabilities.length > 2 ? 'rgba(239,68,68,0.3)' : vulnerabilities.length > 0 ? 'rgba(148,163,184,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }}
            animate={{
              scale: vulnerabilities.length > 2 ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 2,
              repeat: vulnerabilities.length > 2 ? Infinity : 0,
            }}
          >
            {vulnerabilities.length} found
          </motion.span>
        </div>

        {vulnerabilities.length === 0 ? (
          <div className="text-center py-6">
            <motion.svg 
              className="w-12 h-12 text-emerald-500/40 mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </motion.svg>
            <p className="text-xs text-white/50 font-medium">No vulnerabilities detected</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vulnerabilities.map((vuln, i) => {
              const isCritical = vuln.includes('Critical')
              const isOpen = vuln.includes('Open')
              const vulnColor = isCritical ? '#ef4444' : isOpen ? '#94A3B8' : '#10b981'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-black/40 border border-white/10 backdrop-blur-sm"
                  whileHover={{ x: 4, borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  <motion.span
                    className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: vulnColor }}
                    animate={{
                      boxShadow: [`0 0 4px ${vulnColor}`, `0 0 8px ${vulnColor}`, `0 0 4px ${vulnColor}`],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                  <span className="text-[11px] text-white/70 leading-relaxed flex-1">{vuln}</span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(AssetDetailPanel)
