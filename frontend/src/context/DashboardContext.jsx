import { createContext, useContext, useReducer, useCallback, useEffect, useState, useMemo } from 'react'
import { getDashboardOverview, getComplianceDashboard, getAssetsDashboard, getRisksDashboard } from '../api/dashboard'
import { getUserPermissions, isOrgAdmin } from '../utils/permissions'

const DashboardContext = createContext(null)

const initialState = {
  selectedAsset: null,
  filterStatus: 'all', // 'all' | 'secure' | 'warning' | 'critical'
  hoveredAsset: null,
  loading: false,
  error: null,
  overview: null,
  compliance: null,
  assets: null,
  risks: null,
  userRole: null,
  userPermissions: [],
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
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_OVERVIEW':
      return { ...state, overview: action.payload }
    case 'SET_COMPLIANCE':
      return { ...state, compliance: action.payload }
    case 'SET_ASSETS':
      return { ...state, assets: action.payload }
    case 'SET_RISKS':
      return { ...state, risks: action.payload }
    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload }
    case 'SET_USER_PERMISSIONS':
      return { ...state, userPermissions: action.payload }
    default:
      return state
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

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

  // Fetch user role and permissions on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { permissions, role } = await getUserPermissions()
        dispatch({ type: 'SET_USER_PERMISSIONS', payload: permissions })
        dispatch({ type: 'SET_USER_ROLE', payload: role })
      } catch (error) {
        console.error('Failed to fetch user info:', error)
      }
    }

    fetchUserInfo()
  }, [])

  // Fetch dashboard data on mount (role-based)
  useEffect(() => {
    const fetchDashboardData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const [overview, compliance, assets, risks] = await Promise.all([
          getDashboardOverview(),
          getComplianceDashboard().catch(() => null),
          getAssetsDashboard().catch(() => null),
          getRisksDashboard().catch(() => null),
        ])
        
        dispatch({ type: 'SET_OVERVIEW', payload: overview })
        
        // Only fetch compliance and risks for admins
        if (isOrgAdmin(state.userRole)) {
          if (compliance) dispatch({ type: 'SET_COMPLIANCE', payload: compliance })
          if (risks) dispatch({ type: 'SET_RISKS', payload: risks })
        }
        
        // Assets are filtered by role in backend, so fetch for all
        if (assets) dispatch({ type: 'SET_ASSETS', payload: assets })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        dispatch({ type: 'SET_ERROR', payload: error.message })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    fetchDashboardData()
  }, [state.userRole])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...state,
    isAdmin: isOrgAdmin(state.userRole),
    canViewCompliance: state.userPermissions.includes('view_final_compliance_score') || state.userPermissions.includes('view_org_total_score'),
    canViewAllAssets: state.userPermissions.includes('view_all_assets') || state.userPermissions.includes('view_assets'),
    canManagePermissions: state.userPermissions.includes('manage_permissions') || state.userPermissions.includes('grant_permissions'),
    selectAsset,
    closePanel,
    setFilter,
    setHovered,
  }), [state, selectAsset, closePanel, setFilter, setHovered])

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
