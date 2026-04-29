import { memo, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { assets, connections, ASSET_TYPE_META } from '../../data/mockAssets'
import { useDashboard } from '../../context/DashboardContext'
import AssetNode from './AssetNode'

// Memoized legend component - never re-renders
const MapLegend = memo(() => {
  const legendItems = useMemo(() => [
    { label: 'Low (0–29)', color: '#10b981' },
    { label: 'Medium (30–69)', color: '#94A3B8' },
    { label: 'High (70–100)', color: '#ef4444' },
  ], [])

  const assetTypes = useMemo(() => Object.values(ASSET_TYPE_META).slice(0, 3), [])

  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-4 py-3 bg-black/60 border-t border-white/10">
      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Risk Level</span>
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}60` }}
          />
          <span className="text-[10px] text-white/50">{item.label}</span>
        </div>
      ))}
      <span className="hidden sm:inline text-white/10">|</span>
      <span className="hidden sm:inline text-[10px] text-white/40 font-bold uppercase tracking-wider">Asset Types</span>
      {assetTypes.map((meta) => (
        <div key={meta.label} className="hidden sm:flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" style={{ color: meta.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={meta.icon} />
          </svg>
          <span className="text-[10px] text-white/50">{meta.label}</span>
        </div>
      ))}
    </div>
  )
})

// Memoized connection lines - only re-render when filter changes
const ConnectionLines = memo(({ assetMap, filteredIds }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(44,116,179,0.1)" />
          <stop offset="50%" stopColor="rgba(44,116,179,0.3)" />
          <stop offset="100%" stopColor="rgba(44,116,179,0.1)" />
        </linearGradient>
      </defs>
      {connections.map(([srcId, tgtId]) => {
        const src = assetMap[srcId]
        const tgt = assetMap[tgtId]
        if (!src || !tgt) return null

        const bothVisible = filteredIds.has(srcId) && filteredIds.has(tgtId)
        const oneVisible = filteredIds.has(srcId) || filteredIds.has(tgtId)

        return (
          <line
            key={`${srcId}-${tgtId}`}
            x1={`${src.gridX}%`}
            y1={`${src.gridY}%`}
            x2={`${tgt.gridX}%`}
            y2={`${tgt.gridY}%`}
            stroke={bothVisible ? 'url(#lineGradient)' : 'rgba(44,116,179,0.05)'}
            strokeWidth={bothVisible ? 1.5 : 0.5}
            strokeDasharray={bothVisible ? 'none' : '4 4'}
            opacity={oneVisible ? 1 : 0.3}
            style={{
              filter: bothVisible ? 'drop-shadow(0 0 2px rgba(44,116,179,0.4))' : 'none',
            }}
          />
        )
      })}
    </svg>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if filtered IDs change
  return prevProps.filteredIds.size === nextProps.filteredIds.size &&
         [...prevProps.filteredIds].every(id => nextProps.filteredIds.has(id))
})

const InfrastructureMap = () => {
  const { filterStatus } = useDashboard()

  // Memoize filtered assets
  const filteredAssets = useMemo(() => {
    if (filterStatus === 'all') return assets
    return assets.filter((a) => a.status === filterStatus)
  }, [filterStatus])

  // Memoize filtered IDs set
  const filteredIds = useMemo(() => new Set(filteredAssets.map(a => a.id)), [filteredAssets])

  // Memoize asset lookup map
  const assetMap = useMemo(() => {
    const map = {}
    assets.forEach((a) => { map[a.id] = a })
    return map
  }, [])

  return (
    <div
      className="relative rounded-xl border border-white/10 bg-black/60 flex flex-col"
      style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
      {/* Header - no animations */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-amenly-light/20 to-amenly-medium/20 border border-amenly-light/30 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-amenly-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Infrastructure Map</h3>
            <p className="text-[10px] text-white/40">
              <span className="text-amenly-light font-semibold">{filteredAssets.length}</span> of {assets.length} assets visible
            </p>
          </div>
        </div>
        
        {/* Real-time indicator - simplified */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-amenly-light/10 border border-amenly-light/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amenly-light opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amenly-light" />
          </span>
          <span className="text-[9px] font-bold text-amenly-light uppercase tracking-wider">Monitoring</span>
        </div>
      </div>

      {/* Map area */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: '42%' }}>
        {/* Static grid pattern background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(44,116,179,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(44,116,179,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Static radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(44,116,179,0.08)_0%,_transparent_70%)]" />

        {/* Connection lines */}
        <ConnectionLines assetMap={assetMap} filteredIds={filteredIds} />

        {/* Asset nodes */}
        <div className="absolute inset-0" style={{ zIndex: 5 }}>
          {filteredAssets.map((asset, i) => (
            <AssetNode key={asset.id} asset={asset} index={i} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <MapLegend />
    </div>
  )
}

export default memo(InfrastructureMap)
