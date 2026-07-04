import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ASSET_TYPE_META } from '../../constants/assetConstants'
import { useDashboard } from '../../context/DashboardContext'
import { getInfrastructureMap, listVulnerabilities } from '../../api/assets'
import AssetNode from './AssetNode'
import AssetListView from './AssetListView'

const toDisplayAssetType = (type) => {
  const mapping = {
    database: 'server',
    api: 'server',
    application: 'server',
    firewall: 'firewall',
    cloud_service: 'cloud',
    siem: 'server',
    laptop: 'workstation',
    mobile_device: 'workstation',
    network_device: 'router',
    storage: 'server',
  }
  return mapping[type] || type || 'server'
}

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
const ConnectionLines = memo(({ assetMap, filteredIds, connections }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(44,116,179,0.1)" />
          <stop offset="50%" stopColor="rgba(44,116,179,0.3)" />
          <stop offset="100%" stopColor="rgba(44,116,179,0.1)" />
        </linearGradient>
      </defs>
      {connections.map(([srcId, tgtId], idx) => {
        const src = assetMap[srcId]
        const tgt = assetMap[tgtId]
        if (!src || !tgt) return null

        const bothVisible = filteredIds.has(srcId) && filteredIds.has(tgtId)
        const oneVisible = filteredIds.has(srcId) || filteredIds.has(tgtId)

        return (
          <line
            key={`${srcId}-${tgtId}-${idx}`}
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
  const { filterStatus, assets: dashboardAssets } = useDashboard()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState([])

  // Fetch the real infrastructure map (nodes + edges) and per-asset CVEs.
  useEffect(() => {
    const fetchMap = async () => {
      try {
        setLoading(true)
        const [mapRes, vulnRes] = await Promise.all([
          getInfrastructureMap(),
          listVulnerabilities().catch(() => null),
        ])
        const nodes = mapRes?.data?.nodes || []
        const edges = mapRes?.data?.edges || []
        const vulns = vulnRes?.data?.vulnerabilities || []

        // Group real vulnerabilities by asset so the detail panel shows CVEs.
        const byAsset = {}
        for (const v of vulns) {
          ;(byAsset[v.asset_id] ||= []).push(v)
        }

        const transformedAssets = nodes.map((n) => ({
          id: n.id,
          name: n.name,
          type: toDisplayAssetType(n.type),
          status: n.status || 'secure',
          gridX: n.grid_x,
          gridY: n.grid_y,
          risk_score: n.risk_score ?? 0,
          compliance_score: n.compliance_score ?? 100,
          department: 'Unassigned',
          ip: n.ip_address,
          vulnerability_count: n.vulnerability_count ?? (byAsset[n.id]?.length || 0),
          vulnerabilities: byAsset[n.id] || [],
          metadata: {},
        }))

        setAssets(transformedAssets)
        setConnections(edges.map((e) => [e.source, e.target]))
      } catch (error) {
        console.error('Failed to fetch infrastructure map:', error)
        setAssets([])
        setConnections([])
      } finally {
        setLoading(false)
      }
    }

    fetchMap()
  }, [])

  // Memoize filtered assets
  const filteredAssets = useMemo(() => {
    if (filterStatus === 'all') return assets
    return assets.filter((a) => a.status === filterStatus)
  }, [filterStatus, assets])

  // Memoize filtered IDs set
  const filteredIds = useMemo(() => new Set(filteredAssets.map(a => a.id)), [filteredAssets])

  // Memoize asset lookup map
  const assetMap = useMemo(() => {
    const map = {}
    assets.forEach((a) => { map[a.id] = a })
    return map
  }, [assets])

  if (loading) {
    return (
      <div className="relative rounded-xl border border-white/10 bg-black/60 flex flex-col h-96 items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#2C74B3] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative rounded-xl border border-white/10 bg-black/60 flex flex-col"
      style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
      {/* Header - with animation */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-black/40 to-transparent"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-amenly-light/20 to-amenly-medium/20 border border-amenly-light/30 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-amenly-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Infrastructure <span className="hidden sm:inline">Map</span></h3>
            <p className="text-[10px] text-white/40">
              <span className="text-amenly-light font-semibold">{filteredAssets.length}</span> of {assets.length} assets
            </p>
          </div>
        </div>
        
        {/* Real-time indicator - simplified */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-amenly-light/10 border border-amenly-light/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amenly-light opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amenly-light" />
          </span>
          <span className="text-[9px] font-bold text-amenly-light uppercase tracking-wider hidden sm:inline">Monitoring</span>
        </div>
      </motion.div>

      {/* Desktop: Map view */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden md:block"
      >
        {/* Map area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative w-full overflow-hidden" 
          style={{ paddingBottom: '42%' }}
        >
          {/* Static grid pattern background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(44,116,179,0.08)_0%,_transparent_70%)]" 
          />

          {/* Connection lines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <ConnectionLines assetMap={assetMap} filteredIds={filteredIds} connections={connections} />
          </motion.div>

          {/* Asset nodes */}
          <div className="absolute inset-0" style={{ zIndex: 5 }}>
            {filteredAssets.map((asset, i) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.7 + (i * 0.03),
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                style={{ position: 'absolute', left: `${asset.gridX}%`, top: `${asset.gridY}%` }}
              >
                <AssetNode asset={asset} index={i} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1 }}
        >
          <MapLegend />
        </motion.div>
      </motion.div>

      {/* Mobile: List view */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="md:hidden p-4 max-h-[600px] overflow-y-auto scrollbar-chat"
      >
        <AssetListView />
      </motion.div>
    </motion.div>
  )
}

export default memo(InfrastructureMap)
