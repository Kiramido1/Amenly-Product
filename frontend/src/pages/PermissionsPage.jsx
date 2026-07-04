import { useState, useEffect } from 'react'
import { PERMISSIONS, ROLES, clearPermissionCache } from '../utils/permissions'
import api from '../api/client'

const PermissionsPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterPosition, setFilterPosition] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showPermissionModal, setShowPermissionModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/')
      const baseUsers = response.data.data?.users || response.data || []
      const usersWithPermissions = await Promise.all(
        baseUsers.map(async (user) => {
          try {
            const perms = await api.get(`/permissions/user/${user.id}`)
            return {
              ...user,
              permissions: perms.data.data?.all_permissions || [],
              department: user.department || user.department_name || '-',
              position: user.position || user.position_name || user.position_id || '-',
            }
          } catch {
            return { ...user, permissions: [] }
          }
        })
      )
      setUsers(usersWithPermissions)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionToggle = async (userId, permission) => {
    const targetUser = users.find(user => user.id === userId)
    const hasPermission = targetUser?.permissions?.includes(permission)

    setUsers(prev => prev.map(user => {
      if (user.id !== userId) return user
      const permissions = new Set(user.permissions || [])
      if (hasPermission) permissions.delete(permission)
      else permissions.add(permission)
      return { ...user, permissions: [...permissions] }
    }))

    try {
      await api.post(hasPermission ? '/permissions/revoke' : '/permissions/grant', {
        user_id: userId,
        permissions: [permission],
      })
      clearPermissionCache()
      fetchUsers()
    } catch (error) {
      console.error('Failed to update permission:', error)
      fetchUsers()
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole })
      clearPermissionCache()
      fetchUsers()
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !filterDepartment || user.department === filterDepartment
    const matchesPosition = !filterPosition || user.position === filterPosition

    return matchesSearch && matchesDepartment && matchesPosition
  })

  const departments = [...new Set(users.map(u => u.department).filter(Boolean))]
  const positions = [...new Set(users.map(u => u.position).filter(Boolean))]

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#2C74B3] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Permissions Management</h1>
          <a href="/admin" className="px-4 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:border-[#2C74B3]/40 transition-all">
            Admin Panel →
          </a>
        </div>

        {/* Filters */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30"
            />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white"
            >
              <option value="">All Positions</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">{user.full_name}</div>
                      <div className="text-sm text-white/50">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-black/60 border border-white/10 rounded px-3 py-1 text-sm text-white"
                    >
                      <option value={ROLES.ORG_MEMBER}>Member</option>
                      <option value={ROLES.ORG_ADMIN}>Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70">{user.department || '-'}</td>
                  <td className="px-6 py-4 text-sm text-white/70">{user.position || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions?.slice(0, 3).map(perm => (
                        <span key={perm} className="px-2 py-1 bg-[#2C74B3]/20 text-[#2C74B3] text-xs rounded">
                          {perm}
                        </span>
                      ))}
                      {user.permissions?.length > 3 && (
                        <span className="px-2 py-1 bg-white/10 text-white/50 text-xs rounded">
                          +{user.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setShowPermissionModal(true)
                      }}
                      className="text-[#2C74B3] hover:text-[#2C74B3]/70 text-sm"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Permission Modal */}
        {showPermissionModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  Manage Permissions: {selectedUser.full_name}
                </h2>
                <button
                  onClick={() => {
                    setShowPermissionModal(false)
                    setSelectedUser(null)
                  }}
                  className="text-white/50 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {Object.values(PERMISSIONS).map(permission => (
                  <div key={permission} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                    <span className="text-white">{permission}</span>
                    <button
                      onClick={() => handlePermissionToggle(selectedUser.id, permission)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        selectedUser.permissions?.includes(permission)
                          ? 'bg-[#2C74B3]'
                          : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          selectedUser.permissions?.includes(permission)
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PermissionsPage
