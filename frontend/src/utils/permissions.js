import { me } from '../api/auth'

// Permission constants matching backend
export const PERMISSIONS = {
  START_ASSESSMENT: 'start_assessment',
  PARTICIPATE_IN_ASSESSMENT: 'participate_in_assessment',
  VIEW_ORG_DASHBOARD: 'view_org_dashboard',
  VIEW_ALL_ASSETS: 'view_all_assets',
  VIEW_ASSIGNED_ASSETS_ONLY: 'view_assigned_assets_only',
  VIEW_FINAL_COMPLIANCE_SCORE: 'view_final_compliance_score',
  MANAGE_PERMISSIONS: 'manage_permissions',
  MANAGE_USERS: 'manage_users',
  MANAGE_FRAMEWORKS: 'manage_frameworks',
}

// Role constants
export const ROLES = {
  ORG_ADMIN: 'org_admin',
  ORG_MEMBER: 'org_member',
}

// Default permissions by role
export const ROLE_PERMISSIONS = {
  [ROLES.ORG_ADMIN]: [
    PERMISSIONS.START_ASSESSMENT,
    PERMISSIONS.VIEW_ORG_DASHBOARD,
    PERMISSIONS.VIEW_ALL_ASSETS,
    PERMISSIONS.VIEW_FINAL_COMPLIANCE_SCORE,
    PERMISSIONS.MANAGE_PERMISSIONS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_FRAMEWORKS,
  ],
  [ROLES.ORG_MEMBER]: [
    PERMISSIONS.PARTICIPATE_IN_ASSESSMENT,
    PERMISSIONS.VIEW_ASSIGNED_ASSETS_ONLY,
  ],
}

const LEGACY_PERMISSION_ALIASES = {
  view_dashboard: PERMISSIONS.VIEW_ORG_DASHBOARD,
  view_org_total_score: PERMISSIONS.VIEW_FINAL_COMPLIANCE_SCORE,
  view_assets: PERMISSIONS.VIEW_ALL_ASSETS,
  view_all_sessions: PERMISSIONS.START_ASSESSMENT,
  view_own_sessions: PERMISSIONS.PARTICIPATE_IN_ASSESSMENT,
  grant_permissions: PERMISSIONS.MANAGE_PERMISSIONS,
  manage_members: PERMISSIONS.MANAGE_USERS,
}

function expandPermissionAliases(permissions = []) {
  const expanded = new Set(permissions)
  permissions.forEach((permission) => {
    const alias = LEGACY_PERMISSION_ALIASES[permission]
    if (alias) expanded.add(alias)
  })
  return [...expanded]
}

// Cache user permissions
let cachedPermissions = null
let cachedRole = null
let cacheExpiry = null

export async function getUserPermissions() {
  // Check cache
  if (cachedPermissions && cacheExpiry && Date.now() < cacheExpiry) {
    return { permissions: cachedPermissions, role: cachedRole }
  }

  try {
    const response = await me()
    const user = response.data?.user || response.data
    
    if (!user) {
      return { permissions: [], role: null }
    }

    const role = user.role
    const permissions = expandPermissionAliases(user.permissions || ROLE_PERMISSIONS[role] || [])

    // Cache for 5 minutes
    cachedPermissions = permissions
    cachedRole = role
    cacheExpiry = Date.now() + 5 * 60 * 1000

    return { permissions, role }
  } catch (error) {
    console.error('Failed to fetch user permissions:', error)
    return { permissions: [], role: null }
  }
}

export function hasPermission(requiredPermission, userPermissions = []) {
  if (!requiredPermission) return true
  return userPermissions.includes(requiredPermission)
}

export function hasAnyPermission(requiredPermissions, userPermissions = []) {
  if (!requiredPermissions || requiredPermissions.length === 0) return true
  return requiredPermissions.some(perm => userPermissions.includes(perm))
}

export function hasAllPermissions(requiredPermissions, userPermissions = []) {
  if (!requiredPermissions || requiredPermissions.length === 0) return true
  return requiredPermissions.every(perm => userPermissions.includes(perm))
}

export function isOrgAdmin(role) {
  return role === ROLES.ORG_ADMIN
}

export function isOrgMember(role) {
  return role === ROLES.ORG_MEMBER
}

export function clearPermissionCache() {
  cachedPermissions = null
  cachedRole = null
  cacheExpiry = null
}
