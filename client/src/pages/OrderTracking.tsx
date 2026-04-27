import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/commerce'
import api from '../services/api'
import styles from './commerce.module.css'
import './OrderTracking.css'

const statusSteps = ['ordered', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const

const stepMeta: Record<(typeof statusSteps)[number], { label: string; icon: string; desc: string }> = {
  ordered:          { label: 'Order placed',     icon: '📦', desc: 'We have received your order.' },
  packed:           { label: 'Packed',            icon: '🏷️', desc: 'Your order has been packed.' },
  shipped:          { label: 'Shipped',           icon: '🚚', desc: 'Your order is on the way.' },
  out_for_delivery: { label: 'Out for delivery',  icon: '🏃', desc: 'Arriving today — stay home!' },
  delivered:        { label: 'Delivered',         icon: '✅', desc: 'Package delivered.' },
}

interface OrderItem {
  product: {
    _id: string
    name: string
    price: number
    image: string
    category: string
  }
  quantity: number
}

interface Order {
  _id: string
  items: OrderItem[]
  total: number
  subtotal: number
  discount: number
  couponDiscount: number
  deliveryFee: number
  couponCode?: string
  status: (typeof statusSteps)[number] | 'cancelled'
  paymentMethod: string
  paymentStatus: string
  estimatedDelivery: string
  address: {
    fullName: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  refundId?: string
}

const OrderTracking = () => {
  const { orderId } = useParams()
  const { isLoggedIn } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundStatus, setRefundStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [refundError, setRefundError] = useState<string | null>(null)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [supportMessage, setSupportMessage] = useState('')
  const [submittingSupport, setSubmittingSupport] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isLoggedIn || !orderId) {
        setError('Please login to view order details')
        setLoading(false)
        return
      }

      try {
        const response = await api.request(`/orders/${orderId}`)
        setOrder(response.order)
      } catch (err: any) {
        setError(err.message || 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, isLoggedIn])

  const canCancelOrder = order && order.paymentStatus === 'success'
  const handleCancelOrder = async () => {
    if (!order || !canCancelOrder) return

    try {
      setCancelling(true)
      setCancelError(null)
      setRefundStatus('pending')
      setRefundError(null)
      
      // Call backend to process cancellation and refund
      const response = await api.request(`/orders/${order._id}/cancel-with-refund`, { method: 'POST' })
      
      setRefundStatus('success')
      setOrder(response.order)
      
      // Close modals after success
      setTimeout(() => {
        setShowCancelModal(false)
        setShowRefundModal(false)
        setCancelError(null)
      }, 2000)
    } catch (err: any) {
      setRefundStatus('error')
      setRefundError(err.message || 'Failed to process refund')
      setCancelError(err.message || 'Failed to cancel order and process refund')
    } finally {
      setCancelling(false)
    }
  }

  const handleInitiateRefund = () => {
    setShowCancelModal(false)
    setShowRefundModal(true)
  }

  const handleSubmitSupport = async () => {
    if (!order || !supportMessage.trim()) return

    try {
      setSubmittingSupport(true)
      await api.request(`/orders/${order._id}/support`, {
        method: 'POST',
        body: JSON.stringify({ message: supportMessage })
      })
      setSupportMessage('')
      setShowSupportModal(false)
      alert('Support request submitted successfully. We will contact you soon.')
    } catch (err: any) {
      alert('Failed to submit support request: ' + (err.message || 'Unknown error'))
    } finally {
      setSubmittingSupport(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.card} style={{ padding: 20 }}>
          <h2 style={{ color: 'var(--text-dark)' }}>Login required</h2>
          <p>Please login to view your order details.</p>
          <Link to="/" className={styles.primaryBtn} style={{ marginTop: 10, display: 'inline-block' }}>Go back home</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.card} style={{ padding: 20, textAlign: 'center' }}>
          <p>⏳ Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.card} style={{ padding: 20 }}>
          <h2 style={{ color: 'var(--text-dark)' }}>Order not found</h2>
          <p>{error || 'Check your order ID or browse more products.'}</p>
          <Link to="/products" className={styles.primaryBtn} style={{ marginTop: 10, display: 'inline-block' }}>Continue shopping</Link>
        </div>
      </div>
    )
  }

  // Calculate progress
  const activeIndex = statusSteps.findIndex((entry) => entry === order.status)
  const progressWidth = `${Math.max(8, ((activeIndex + 1) / statusSteps.length) * 100)}%`

  return (
    <div className={`container ${styles.page}`} data-testid="order-tracking-page">
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link to="/">Home</Link>
        <span>›</span>
        <span>Order Tracking</span>
        <span>›</span>
        <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{order._id}</span>
      </nav>

      <h1 style={{ marginBottom: 16 }}>Order Tracking</h1>

      <div className={styles.checkoutGrid} style={{ alignItems: 'flex-start' }}>
        {/* Left: Timeline + Delivery Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Timeline Section */}
          <section className={styles.card} style={{ padding: 20 }}>
            <div className={styles.row} style={{ marginBottom: 14 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-light)' }}>Order ID</p>
                <strong style={{ color: 'var(--text-dark)', letterSpacing: 0.5 }}>{order._id}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-light)' }}>Estimated delivery</p>
                <strong style={{ color: 'var(--primary)' }}>
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </strong>
              </div>
            </div>

            {/* Progress bar */}
            <div className={styles.progress} style={{ marginBottom: 20 }}>
              <div className={styles.progressFill} style={{ width: progressWidth }} />
            </div>

            {/* Timeline */}
            <div className={styles.timeline}>
              {statusSteps.map((step, index) => {
                const active = index <= activeIndex
                const meta = stepMeta[step]
                return (
                  <div key={step} className={`${styles.step} ${active ? styles.stepActive : ''}`.trim()}>
                    <span className={`${styles.stepIcon} ${active ? styles.stepIconActive : ''}`.trim()}>
                      {active ? meta.icon : ''}
                    </span>
                    <strong>{meta.label}</strong>
                    {active && <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 400, color: 'var(--text-light)' }}>{meta.desc}</p>}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Action Buttons */}
          {(canCancelOrder || order?.status === 'cancelled' || true) && (
            <section className={styles.card} style={{ padding: 16 }}>
              <h3 style={{ 
                marginBottom: 14, 
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-dark)',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '12px'
              }}>
                Order Actions
              </h3>
              
              {order?.status === 'cancelled' ? (
                // Show cancellation message
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#856404'
                  }}>
                    ✓ Order has been cancelled
                  </p>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '13px',
                    color: '#856404',
                    lineHeight: '1.6'
                  }}>
                    Your refund of <strong>{formatCurrency(order.total)}</strong> will be available in your account within <strong>4-5 business days</strong>.
                  </p>
                  <p style={{
                    margin: '0',
                    fontSize: '12px',
                    color: '#856404'
                  }}>
                    Refund ID: <strong>{order.refundId || 'Processing'}</strong>
                  </p>
                </div>
              ) : (
                // Show cancel button
                <div style={{ display: 'grid', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    disabled={!canCancelOrder || cancelling}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: canCancelOrder ? '#d32f2f' : '#ccc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: canCancelOrder ? 'pointer' : 'not-allowed',
                      opacity: canCancelOrder ? 1 : 0.6,
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (canCancelOrder) {
                        e.currentTarget.style.backgroundColor = '#b71c1c'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(211, 47, 47, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#d32f2f'
                      e.currentTarget.style.boxShadow = ''
                    }}
                  >
                    {cancelling ? '⏳ Processing...' : '✕ Cancel Order'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(true)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(125, 46, 79, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = ''
                    }}
                  >
                    💬 Contact Support
                  </button>
                </div>
              )}
              
              {cancelError && (
                <p style={{ color: '#d32f2f', fontSize: 13, marginTop: 10, margin: '10px 0 0 0' }}>
                  ⚠️ {cancelError}
                </p>
              )}
            </section>
          )}

          {/* Delivery Info Section */}
          <section className={styles.card} style={{ padding: 16 }}>
            <h3 style={{ 
              marginBottom: 14, 
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--text-dark)',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '12px'
            }}>
              Delivery Info
            </h3>
            
            {/* Payment Method */}
            <div className={styles.row} style={{ marginBottom: 12 }}>
              <span style={{ color: 'var(--text-light)', fontSize: 13 }}>Payment Method</span>
              <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{order.paymentMethod.toUpperCase()}</span>
            </div>

            {/* Payment Status */}
            <div className={styles.row} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: 'var(--text-light)', fontSize: 13 }}>Payment Status</span>
              <span className={order.paymentStatus === 'success' ? styles.stockOk : styles.stockLow}>
                {order.paymentStatus === 'success' ? '✓ Paid' : '✗ Failed'}
              </span>
            </div>

            {/* Address Section */}
            {order.address && (
              <div>
                <p style={{ margin: '0 0 10px 0', fontSize: 13, color: 'var(--text-light)', fontWeight: '600' }}>Delivering to</p>
                <div style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                  <strong style={{ color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>{order.address.fullName}</strong>
                  <p style={{ margin: '0 0 4px 0', fontSize: 13, color: '#333' }}>
                    {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: 13, color: '#333' }}>
                    {order.address.city}, {order.address.state} – {order.address.pincode}
                  </p>
                  <p style={{ margin: '0', fontSize: 13, color: '#333', fontWeight: '500' }}>
                    📞 {order.address.phone}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right: Order info */}
        <div style={{ display: 'grid', gap: 14 }}>
          {/* Products */}
          <section className={styles.card} style={{ padding: 16 }}>
            <h3 style={{ 
              marginBottom: 14, 
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--text-dark)',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '12px'
            }}>
              Items in order
            </h3>
            
            {/* Order Items */}
            <div style={{ marginBottom: '16px' }}>
              {order.items.map((item: OrderItem) => (
                <div 
                  key={item.product._id} 
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    marginBottom: '10px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                    e.currentTarget.style.borderColor = '#d0d0d0';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Product Image */}
                  <img 
                    src={item.product.image} 
                    alt={item.product.name} 
                    loading="lazy"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'https://via.placeholder.com/64x64?text=Product';
                    }}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      border: '1px solid #ddd',
                      flexShrink: 0
                    }} 
                  />
                  
                  {/* Item Details */}
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <Link 
                        to={`/products/${item.product._id}`} 
                        style={{
                          color: 'var(--text-dark)',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '14px',
                          display: 'block',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dark)'}
                      >
                        {item.product.name}
                      </Link>
                      <p style={{ 
                        margin: '0', 
                        fontSize: '12px', 
                        color: '#999',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}>
                        <span style={{ color: '#666' }}>Qty: <strong>{item.quantity}</strong></span>
                        <span>{formatCurrency(item.product.price)}/unit</span>
                      </p>
                    </div>
                    
                    {/* Item Total */}
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <p style={{
                        margin: '0',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#2ecc71'
                      }}>
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                      <p style={{
                        margin: '2px 0 0 0',
                        fontSize: '11px',
                        color: '#999'
                      }}>
                        {item.product.category}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ 
              height: '1px', 
              backgroundColor: '#e0e0e0', 
              margin: '14px 0' 
            }} />

            {/* Price Breakdown */}
            <div style={{ marginTop: '14px' }}>
              <h4 style={{ 
                color: '#666', 
                fontSize: '13px', 
                fontWeight: '600', 
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Price Breakdown
              </h4>

              {/* Subtotal */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: '#666', fontSize: '13px' }}>Subtotal</span>
                <span style={{ color: '#333', fontWeight: '500', fontSize: '13px' }}>
                  {formatCurrency(order.subtotal || order.total + (order.discount || 0) + (order.couponDiscount || 0))}
                </span>
              </div>

              {/* Discount (Product Discount) */}
              {order.discount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>Product Discount</span>
                  <span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>
                    -{formatCurrency(order.discount)}
                  </span>
                </div>
              )}

              {/* Coupon Discount */}
              {order.couponDiscount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>
                    Coupon {order.couponCode && <span style={{ color: '#10b981', fontWeight: '600' }}>({order.couponCode})</span>}
                  </span>
                  <span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>
                    -{formatCurrency(order.couponDiscount)}
                  </span>
                </div>
              )}

              {/* Delivery Fee */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: '#666', fontSize: '13px' }}>Delivery Fee</span>
                {order.deliveryFee > 0 ? (
                  <span style={{ color: '#333', fontWeight: '500', fontSize: '13px' }}>
                    {formatCurrency(order.deliveryFee)}
                  </span>
                ) : (
                  <span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>Free</span>
                )}
              </div>

              {/* Total */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '14px 10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
                marginTop: '10px'
              }}>
                <span style={{ color: '#333', fontWeight: 'bold', fontSize: '15px' }}>Order Total</span>
                <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '16px' }}>
                  {formatCurrency(order.total)}
                </span>
              </div>

              {/* Savings Badge */}
              {(order.discount > 0 || order.couponDiscount > 0) && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  backgroundColor: '#d4f4dd',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '12px', 
                    color: '#10b981', 
                    fontWeight: '600' 
                  }}>
                    🎉 You saved {formatCurrency((order.discount || 0) + (order.couponDiscount || 0))}!
                  </p>
                </div>
              )}
            </div>
          </section>

          <Link to="/products" className={styles.secondaryBtn} style={{ textAlign: 'center', display: 'block' }}>
            Continue shopping
          </Link>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ marginTop: 0, color: 'var(--text-dark)', marginBottom: 12 }}>Cancel Order?</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: 20, lineHeight: 1.6 }}>
              Are you sure you want to cancel this order? This action cannot be undone. If you've already made payment, it will be refunded within 5-7 business days.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#f0f0f0',
                  color: 'var(--text-dark)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleInitiateRefund}
                disabled={cancelling}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: cancelling ? 0.6 : 1
                }}
              >
                {cancelling ? 'Processing...' : 'Proceed to Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && order && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            {refundStatus === 'pending' ? (
              <>
                <h2 style={{ marginTop: 0, color: 'var(--text-dark)', marginBottom: 20 }}>Refund Details</h2>
                
                {/* Order Summary */}
                <div style={{
                  backgroundColor: '#f9f9f9',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #e0e0e0'
                }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                    Order Amount Breakdown
                  </p>
                  
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#666' }}>Subtotal</span>
                      <span style={{ fontWeight: 600, color: '#333' }}>
                        {formatCurrency(order.subtotal || order.total)}
                      </span>
                    </div>
                    
                    {order.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#666' }}>Product Discount</span>
                        <span style={{ fontWeight: 600, color: '#10b981' }}>
                          -{formatCurrency(order.discount)}
                        </span>
                      </div>
                    )}
                    
                    {order.couponDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#666' }}>Coupon Discount</span>
                        <span style={{ fontWeight: 600, color: '#10b981' }}>
                          -{formatCurrency(order.couponDiscount)}
                        </span>
                      </div>
                    )}
                    
                    {order.deliveryFee > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#666' }}>Delivery Fee</span>
                        <span style={{ fontWeight: 600, color: '#333' }}>
                          {formatCurrency(order.deliveryFee)}
                        </span>
                      </div>
                    )}
                    
                    <div style={{
                      borderTop: '1px solid #e0e0e0',
                      paddingTop: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '14px'
                    }}>
                      <span style={{ color: '#333', fontWeight: 'bold' }}>Order Total Paid</span>
                      <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '16px' }}>
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Refund Info */}
                <div style={{
                  backgroundColor: '#e8f5e9',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  border: '1px solid #10b981'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#2e7d32',
                    lineHeight: '1.5'
                  }}>
                    ✓ You will receive <strong>{formatCurrency(order.total)}</strong> refund to your original payment method within 5-7 business days.
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRefundModal(false)
                      setShowCancelModal(true)
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: '#f0f0f0',
                      color: 'var(--text-dark)',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: '#2e7d32',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: cancelling ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: cancelling ? 0.6 : 1
                    }}
                  >
                    {cancelling ? '⏳ Processing...' : '✓ Confirm Refund'}
                  </button>
                </div>
              </>
            ) : refundStatus === 'success' ? (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '12px'
                  }}>
                    ✓
                  </div>
                  <h2 style={{ marginTop: 0, color: '#2e7d32', marginBottom: 12 }}>Refund Initiated!</h2>
                  <p style={{ color: 'var(--text-light)', marginBottom: 20, lineHeight: 1.6 }}>
                    Your order has been cancelled and refund of <strong>{formatCurrency(order.total)}</strong> will be credited to your original payment method within 5-7 business days.
                  </p>
                  <p style={{ color: '#999', fontSize: '12px', marginBottom: 20 }}>
                    Order ID: <strong>{order._id}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '12px'
                  }}>
                    ✕
                  </div>
                  <h2 style={{ marginTop: 0, color: '#d32f2f', marginBottom: 12 }}>Refund Failed</h2>
                  <p style={{ color: 'var(--text-light)', marginBottom: 20, lineHeight: 1.6 }}>
                    {refundError || 'An error occurred while processing your refund.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRefundModal(false)
                      setRefundStatus('pending')
                      setRefundError(null)
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: '#f0f0f0',
                      color: 'var(--text-dark)',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: cancelling ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: cancelling ? 0.6 : 1
                    }}
                  >
                    {cancelling ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ marginTop: 0, color: 'var(--text-dark)', marginBottom: 12 }}>Contact Support</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: 16, fontSize: 13 }}>
              Having issues with your order? Let us know what's wrong and our support team will help you out.
            </p>
            
            {/* Order Info Display */}
            <div style={{
              backgroundColor: '#f9f9f9',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#666',
              borderLeft: '3px solid var(--primary)'
            }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>Order {order?._id.slice(-8).toUpperCase()}</p>
              <p style={{ margin: 0 }}>Status: {order?.status.charAt(0).toUpperCase() + order?.status.slice(1).replace('_', ' ')}</p>
            </div>

            {/* Message Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>
                Tell us the issue:
              </label>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Describe the issue you're facing with your order..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  resize: 'vertical',
                  minHeight: '100px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setShowSupportModal(false)
                  setSupportMessage('')
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#f0f0f0',
                  color: 'var(--text-dark)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSubmitSupport}
                disabled={!supportMessage.trim() || submittingSupport}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: !supportMessage.trim() || submittingSupport ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: !supportMessage.trim() || submittingSupport ? 0.6 : 1
                }}
              >
                {submittingSupport ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderTracking
