import { useState, useEffect, useCallback } from 'react'
import {
  UserCircleIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import DataTable, { Column } from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Modal from '../../components/common/Modal'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { userService } from '../../services/userService'
import { MOCK_USERS, MOCK_ORDERS } from '../../utils/mockData'
import type { User } from '../../types'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [blockTarget, setBlockTarget] = useState<User | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filterBlocked, setFilterBlocked] = useState('all')

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await userService.getAll({ limit: 200 })
      const data = res.data?.users || res.data?.data || res.data
      setUsers(Array.isArray(data) ? data : MOCK_USERS as unknown as User[])
    } catch {
      setUsers(MOCK_USERS as unknown as User[])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleBlockToggle = async () => {
    if (!blockTarget) return
    setIsProcessing(true)
    try {
      if (blockTarget.isBlocked) {
        await userService.unblock(blockTarget._id)
      } else {
        await userService.block(blockTarget._id)
      }
      setUsers(prev => prev.map(u =>
        u._id === blockTarget._id ? { ...u, isBlocked: !u.isBlocked } : u
      ))
      toast.success(`User ${blockTarget.isBlocked ? 'unblocked' : 'blocked'}`)
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update user status'
      toast.error(errorMsg)
    } finally {
      setIsProcessing(false)
      setBlockTarget(null)
    }
  }

  const filteredUsers = users.filter(u => {
    if (filterBlocked === 'blocked') return u.isBlocked
    if (filterBlocked === 'active') return !u.isBlocked
    return true
  })

  const userOrders = selectedUser
    ? MOCK_ORDERS.filter(o => (o.user as any)?._id === selectedUser._id || (o.user as any)?.phone === selectedUser.phone)
    : []

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: row => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
            {(row.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.name || 'No name'}</p>
            <p className="text-xs text-gray-500">{row.email || row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: row => <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{row.phone}</span>,
    },
    {
      key: 'gender',
      header: 'Gender',
      render: row => <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{row.gender || 'N/A'}</span>,
    },
    {
      key: 'isBlocked',
      header: 'Status',
      sortable: true,
      render: row => row.isBlocked
        ? <Badge variant="danger" dot>Blocked</Badge>
        : <Badge variant="success" dot>Active</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: row => <span className="text-xs text-gray-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); setSelectedUser(row) }}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
            title="View Details"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setBlockTarget(row) }}
            className={`p-1.5 rounded-lg transition-colors ${row.isBlocked
              ? 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600'
              : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600'
            }`}
            title={row.isBlocked ? 'Unblock' : 'Block'}
          >
            {row.isBlocked ? <CheckCircleIcon className="w-4 h-4" /> : <NoSymbolIcon className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle={`${users.length} total registered users`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-blue-600' },
          { label: 'Active', value: users.filter(u => !u.isBlocked).length, color: 'text-green-600' },
          { label: 'Blocked', value: users.filter(u => u.isBlocked).length, color: 'text-red-600' },
          { label: 'This Month', value: users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 86400000)).length, color: 'text-primary-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Status</label>
          <select value={filterBlocked} onChange={e => setFilterBlocked(e.target.value)} className="input-field py-1.5 text-sm w-40">
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-500">{filteredUsers.length} users</div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search by name, email, phone..."
        pageSize={10}
        onRowClick={row => setSelectedUser(row as unknown as User)}
      />

      {/* User Detail Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-2xl">
                {(selectedUser.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.name || 'No name'}</h3>
                <p className="text-sm text-gray-500">{selectedUser.phone}</p>
                {selectedUser.email && <p className="text-sm text-gray-500">{selectedUser.email}</p>}
                <div className="mt-1">
                  {selectedUser.isBlocked
                    ? <Badge variant="danger" dot>Blocked</Badge>
                    : <Badge variant="success" dot>Active</Badge>
                  }
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div>
                <p className="text-xs text-gray-500">Gender</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{selectedUser.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Joined</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Addresses</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.addresses?.length || 0} saved</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Wishlist</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.wishlist?.length || 0} items</p>
              </div>
            </div>
            {userOrders.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Orders</p>
                <div className="space-y-2">
                  {userOrders.slice(0, 3).map(o => (
                    <div key={o._id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-mono text-xs text-primary-600">#{o._id.slice(-6).toUpperCase()}</span>
                      <span className="text-gray-600 dark:text-gray-400">{formatDate(o.createdAt)}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">₹{o.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        onConfirm={handleBlockToggle}
        title={blockTarget?.isBlocked ? 'Unblock User' : 'Block User'}
        message={blockTarget?.isBlocked
          ? `Unblock ${blockTarget?.name || 'this user'}? They will regain access.`
          : `Block ${blockTarget?.name || 'this user'}? They won't be able to login.`
        }
        confirmText={blockTarget?.isBlocked ? 'Unblock' : 'Block'}
        variant={blockTarget?.isBlocked ? 'warning' : 'danger'}
        isLoading={isProcessing}
      />
    </div>
  )
}
