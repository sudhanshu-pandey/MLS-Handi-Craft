import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, TruckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { orderService } from '../../services/orderService'
import { MOCK_ORDERS } from '../../utils/mockData'
import type { Order, OrderStatus } from '../../types'

const STATUS_FLOW: OrderStatus[] = ['ordered', 'packed', 'shipped', 'out_for_delivery', 'delivered']

const STATUS_LABELS: Record<OrderStatus, string> = {
  ordered: 'Ordered',
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out For Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await orderService.getById(id!)
        setOrder(res.data?.order || res.data)
      } catch {
        const mock = MOCK_ORDERS.find(o => o._id === id)
        setOrder(mock as unknown as Order || MOCK_ORDERS[0] as unknown as Order)
      } finally {
        setIsLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const updateStatus = async (newStatus: OrderStatus) => {
    if (!order) return
    setIsUpdating(true)
    try {
      await orderService.updateStatus(order._id, newStatus)
      setOrder(prev => prev ? { ...prev, status: newStatus } : prev)
      toast.success(`Order status updated to ${STATUS_LABELS[newStatus]}`)
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update order status'
      toast.error(errorMsg)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!order) return
    setIsUpdating(true)
    try {
      await orderService.cancelWithRefund(order._id, 'Cancelled by admin')
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev)
      toast.success('Order cancelled')
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to cancel order'
      toast.error(errorMsg)
    } finally {
      setIsUpdating(false)
      setShowCancel(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 skeleton w-48 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)}
          </div>
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="h-40 skeleton rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!order) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Order not found</p>
    </div>
  )

  const currentStatusIdx = STATUS_FLOW.indexOf(order.status as OrderStatus)
  const isCancelled = order.status === 'cancelled' || order.status === 'returned'
  const user = order.user as any

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order._id.slice(-8).toUpperCase()}`}
        subtitle={`Placed on ${formatDateTime(order.createdAt)}`}
        actions={
          <button onClick={() => navigate('/orders')} className="btn-secondary text-sm">
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </button>
        }
      />

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Order Progress</h3>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 dark:bg-gray-600" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-primary-500 transition-all duration-500"
              style={{ width: currentStatusIdx >= 0 ? `${(currentStatusIdx / (STATUS_FLOW.length - 1)) * 100}%` : '0%' }}
            />
            {STATUS_FLOW.map((status, idx) => {
              const isDone = idx < currentStatusIdx
              const isCurrent = idx === currentStatusIdx
              return (
                <div key={status} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isDone ? 'bg-primary-600 border-primary-600' :
                    isCurrent ? 'bg-white dark:bg-gray-800 border-primary-600' :
                    'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}>
                    {isDone ? (
                      <CheckCircleIcon className="w-5 h-5 text-white" />
                    ) : (
                      <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-primary-600' : 'bg-gray-300'}`} />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isCurrent ? 'text-primary-600' : isDone ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Status Update */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order Items */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Order Items ({order.items?.length})</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-xl">
                    🛍️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Delivery Fee</span><span>{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : 'Free'}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-600">
                <span>Total</span><span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          {!isCancelled && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TruckIcon className="w-5 h-5" /> Update Order Status
              </h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.map((status, idx) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={isUpdating || idx < currentStatusIdx || order.status === status}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      order.status === status
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
                <button
                  onClick={() => setShowCancel(true)}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Info cards */}
        <div className="space-y-5">
          {/* Order Status */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Order Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment</span>
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900 dark:text-white uppercase">{order.paymentMethod}</span>
              </div>
              {order.coupon && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Coupon</span>
                  <span className="font-mono text-xs bg-green-100 dark:bg-green-900/20 text-green-700 px-2 py-0.5 rounded">{order.coupon.code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="card p-5 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Customer</h3>
            <p className="font-medium text-gray-900 dark:text-white">{user?.name || 'N/A'}</p>
            <p className="text-sm text-gray-500">{user?.phone}</p>
            {user?.email && <p className="text-sm text-gray-500">{user.email}</p>}
          </div>

          {/* Delivery Address */}
          <div className="card p-5 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Delivery Address</h3>
            {order.deliveryAddress || order.address ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p className="font-medium text-gray-900 dark:text-white">{order.deliveryAddress?.fullName || order.address?.fullName || 'N/A'}</p>
                <p>{order.deliveryAddress?.phone || order.address?.phone || 'N/A'}</p>
                <p>{order.deliveryAddress?.addressLine1 || order.address?.line1 || 'N/A'}</p>
                {(order.deliveryAddress?.addressLine2 || order.address?.line2) && <p>{order.deliveryAddress?.addressLine2 || order.address?.line2}</p>}
                <p>{order.deliveryAddress?.city || order.address?.city}, {order.deliveryAddress?.state || order.address?.state} - {order.deliveryAddress?.pincode || order.address?.pincode}</p>
              </div>
            ) : <p className="text-sm text-gray-500">No address</p>}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? A refund will be initiated if payment was made."
        confirmText="Cancel Order"
        variant="danger"
        isLoading={isUpdating}
      />
    </div>
  )
}
