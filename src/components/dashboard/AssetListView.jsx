import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { assets, ASSET_TYPE_META, STATUS_META } from '../../data/mockAssets'
import { useDashboard } from '../../context/DashboardContext'

const AssetListView = () => {
  const { filterStatus, selectAsset } = useDashboard()

  // Memoize filtered assets
  const filteredAssets = useMemo(() => {
    if (filterStatus === 'all') return assets
    return assets.filter((a) => a.status === filterStatus)
  }, [filterStatus])

  return (
    <div className="space-y-3">
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-white/70 mb-2">No Assets Found</h3>
          <p className="text-sm text-white/40">Try adjusting your filters</p>
        </div>
      ) : (
        filteredAssets.map((asset, i) => {
          const typeMeta = ASSET_TYPE_META[asset.type]
          const statusMeta = STATUS_META[asset.status]
          const riskColor = asset.risk_score > 60 ? '#ef4444' : asset.risk_score > 30 ? '#94A3B8' : '#10b981'

          return (
            <motion.button
              key={asset.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => selectAsset(asset)}
              className="w-full p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-amenly-light focus:ring-offset-2 focus:ring-offset-black"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              aria-label={`${asset.name}, ${typeMeta.label}, Risk ${asset.risk_score}, Status ${statusMeta.label}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${statusMeta.color}18`,
                    border: `2px solid ${statusMeta.color}50`,
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    style={{ color: statusMeta.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={typeMeta.icon} />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{asset.name}</h3>
                      <p className="text-xs text-white/50">{typeMeta.label} • {asset.department}</p>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0"
                      style={{
                        backgroundColor: `${statusMeta.color}20`,
                        color: statusMeta.color,
                        border: `1px solid ${statusMeta.color}40`,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Risk Score</p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-bold"
                          style={{ color: riskColor }}
                        >
                          {asset.risk_score}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${asset.risk_score}%`,
                              backgroundColor: riskColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Compliance</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-amenly-light">
                          {asset.compliance_score}%
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amenly-light"
                            style={{ width: `${asset.compliance_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })
      )}
    </div>
  )
}

export default memo(AssetListView)
