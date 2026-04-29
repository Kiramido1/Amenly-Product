import { createContext, useContext, useReducer, useCallback, useEffect, useState, useMemo } from 'react'

const DashboardContext = createContext(null)

const initialState = {
  selectedAsset: null,
  filterStatus: 'all', // 'all' | 'secure' | 'warning' | 'critical'
  hoveredAsset: null,
}

function dashboardReducer(state, action) {
  switch (action.type) {
    case 'SELECT_ASSET':
      return { ...state, selectedAsset: action.payload }
    case 'CLOSE_PANEL':
      return { ...state, selectedAsset: null }
    case 'SET_FILTER':
      return { ...state, filterStatus: action.payload }
    case 'SET_HOVERED':
      return { ...state, hoveredAsset: action.payload }
    default:
      return state
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)
  const [liveMetrics, setLiveMetrics] = useState({
    activeScans: 0,
    threatsBlocked: 0,
    lastUpdate: new Date().toISOString(),
  })

  // Memoize callbacks to prevent re-renders
  const selectAsset = useCallback((asset) => {
    dispatch({ type: 'SELECT_ASSET', payload: asset })
  }, [])
  
  const closePanel = useCallback(() => {
    dispatch({ type: 'CLOSE_PANEL' })
  }, [])
  
  const setFilter = useCallback((filter) => {
    dispatch({ type: 'SET_FILTER', payload: filter })
  }, [])
  
  const setHovered = useCallback((id) => {
    dispatch({ type: 'SET_HOVERED', payload: id })
  }, [])

  // Optimize real-time updates - use requestAnimationFrame
  useEffect(() => {
    let rafId
    let lastUpdate = Date.now()
    
    const updateMetrics = () => {
      const now = Date.now()
      // Only update every 5 seconds
      if (now - lastUpdate >= 5000) {
        setLiveMetrics(prev => ({
          activeScans: Math.floor(Math.random() * 5) + 1,
          threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 3),
          lastUpdate: new Date().toISOString(),
        }))
        lastUpdate = now
      }
      rafId = requestAnimationFrame(updateMetrics)
    }
    
    rafId = requestAnimationFrame(updateMetrics)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...state,
    liveMetrics,
    selectAsset,
    closePanel,
    setFilter,
    setHovered,
  }), [state, liveMetrics, selectAsset, closePanel, setFilter, setHovered])

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}
