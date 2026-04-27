import Badge from './Badge'
import type { OrderStatus, PaymentStatus } from '../../types'

const orderStatusMap: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' }> = {
  ordered: { label: 'Ordered', variant: 'warning' },
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  packed: { label: 'Packed', variant: 'purple' },
  shipped: { label: 'Shipped', variant: 'info' },
  out_for_delivery: { label: 'Out For Delivery', variant: 'info' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  returned: { label: 'Returned', variant: 'neutral' },
}

const paymentStatusMap: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  success: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = orderStatusMap[status] || { label: status, variant: 'neutral' as const }
  return <Badge variant={s.variant} dot>{s.label}</Badge>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = paymentStatusMap[status] || { label: status, variant: 'neutral' as const }
  return <Badge variant={s.variant} dot>{s.label}</Badge>
}
