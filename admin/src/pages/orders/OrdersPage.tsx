import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, FunnelIcon } from '@heroicons/react/24/outline'
import PageHeader from '../../components/common/PageHeader'
import DataTable, { Column } from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/StatusBadge'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { orderService } from '../../services/orderService'
import { MOCK_ORDERS } from '../../utils/mockData'
import type { Order, OrderStatus } from '../../types'

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Orders' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out For Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'All Payments' },
  { value: 'cod', label: 'COD' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
]

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await orderService.getAll({ limit: 200 })
      const data = res.data?.orders || res.data?.data || res.data
      setOrders(Array.isArray(data) ? data : MOCK_ORDERS as unknown as Order[])
    } catch {
      setOrders(MOCK_ORDERS as unknown as Order[])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (filterPayment !== 'all' && o.paymentMethod !== filterPayment) return false
    if (startDate && new Date(o.createdAt) < new Date(startDate)) return false
    if (endDate && new Date(o.createdAt) > new Date(endDate + 'T23:59:59')) return false
    return true
  })

  const stats = {
    total: orders.length,
    ordered: orders.filter(o => o.status === 'ordered').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.filter(o => o.paymentStatus === 'success').reduce((s, o) => s + o.total, 0),
  }

  const columns: Column<Order>[] = [
    {
      key: '_id',
      header: 'Order ID',
      render: row => (
        <span className="font-mono text-xs text-primary-600 font-semibold">
          #{String(row._id).slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Customer',
      sortable: true,
      render: row => {
        const user = row.user as any
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{user?.name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{user?.phone || user?.email || ''}</p>
          </div>
        )
      },
    },
    {
      key: 'items',
      header: 'Items',
      render: row => (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{row.items?.length || 0} item(s)</p>
          <p className="text-xs text-gray-500 truncate max-w-36">{row.items?.[0]?.name}</p>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: row => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(row.total)}</p>
          <p className="text-xs text-gray-500 uppercase">{row.paymentMethod}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: row => <OrderStatusBadge status={row.status} />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: row => <PaymentStatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: row => <span className="text-xs text-gray-500">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: row => (
        <button
          onClick={e => { e.stopPropagation(); navigate(`/orders/${row._id}`) }}
          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
          title="View Details"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle={`${stats.total} total orders`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, color: 'text-gray-900 dark:text-white' },
          { label: 'Ordered', value: stats.ordered, color: 'text-yellow-600' },
          { label: 'Delivered', value: stats.delivered, color: 'text-green-600' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600' },
          { label: 'Revenue', value: formatCurrency(stats.totalRevenue), color: 'text-primary-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <FunnelIcon className="w-5 h-5 text-gray-400 self-center" />
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field py-1.5 text-sm w-40">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Payment</label>
          <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="input-field py-1.5 text-sm w-36">
            {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">From Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field py-1.5 text-sm w-36" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">To Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field py-1.5 text-sm w-36" />
        </div>
        <button
          onClick={() => { setFilterStatus('all'); setFilterPayment('all'); setStartDate(''); setEndDate('') }}
          className="btn-secondary text-sm self-end"
        >
          Clear
        </button>
        <div className="ml-auto text-sm text-gray-500 self-end">{filteredOrders.length} orders</div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search order ID, customer..."
        pageSize={10}
        onRowClick={row => navigate(`/orders/${(row as unknown as Order)._id}`)}
      />
    </div>
  )
}
