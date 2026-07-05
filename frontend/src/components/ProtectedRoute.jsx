import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getUserPermissions, hasPermission, hasAnyPermission, isOrgAdmin } from '../utils/permissions'
import { useState, useEffect } from 'react'

const ProtectedRoute = ({ children, requirePermission = null, requireAnyPermission = null, requireAdmin = false }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const [permissionCheck, setPermissionCheck] = useState({ loading: true, hasAccess: true })

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isAuthenticated) {
        setPermissionCheck({ loading: false, hasAccess: false })
        return
      }

      if (requireAdmin || requirePermission || requireAnyPermission) {
        try {
          const { permissions, role } = await getUserPermissions()
          
          // Check admin requirement
          if (requireAdmin && !isOrgAdmin(role)) {
            setPermissionCheck({ loading: false, hasAccess: false })
            return
          }

          // Check single permission requirement
          if (requirePermission && !hasPermission(requirePermission, permissions)) {
            setPermissionCheck({ loading: false, hasAccess: false })
            return
          }

          // Check any permission requirement
          if (requireAnyPermission && !hasAnyPermission(requireAnyPermission, permissions)) {
            setPermissionCheck({ loading: false, hasAccess: false })
            return
          }

          setPermissionCheck({ loading: false, hasAccess: true })
        } catch (error) {
          console.error('Permission check failed:', error)
          setPermissionCheck({ loading: false, hasAccess: false })
        }
      } else {
        setPermissionCheck({ loading: false, hasAccess: true })
      }
    }

    checkPermissions()
  }, [isAuthenticated, requirePermission, requireAnyPermission, requireAdmin])

  if (isLoading || permissionCheck.loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#2C74B3] rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!permissionCheck.hasAccess) {
    // Members (and anyone lacking access to an admin page) belong on the
    // assessment. Never redirect to /dashboard here — that page is admin-only
    // and would create a redirect loop.
    return <Navigate to="/ai-compliance" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
