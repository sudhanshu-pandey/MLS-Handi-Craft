import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import RazorpayPayment from '../components/RazorpayPayment/RazorpayPayment';
import { formatCurrency } from '../utils/commerce';
import api from '../services/api';
import { clearCart } from '../store/slices/cartSlice';
import { clearCoupon } from '../store/slices/couponSlice';
import styles from './Payment.module.css';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orderId } = useParams<{ orderId: string }>();
  const { isLoggedIn } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [paymentExpired, setPaymentExpired] = useState(false);

  // Load order details and start countdown
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    if (!orderId) {
      setLoading(false);
      return;
    }

    loadOrderDetails();
  }, [orderId, isLoggedIn, navigate]);

  // Countdown timer effect (10 minutes = 600 seconds)
  useEffect(() => {
    if (paymentSuccess || paymentExpired) return;
    // Store the expiration time on first load
    const expirationTime = Date.now() + (timeLeft * 1000);

    const timer = setInterval(() => {
      const now = Date.now();
      const secondsRemaining = Math.max(0, Math.ceil((expirationTime - now) / 1000));

      setTimeLeft(secondsRemaining);
      if (secondsRemaining <= 0) {
        clearInterval(timer);
        setPaymentExpired(true);
        // Redirect to cart after 2 seconds
        setTimeout(() => {
          navigate('/cart');
        }, 2000);
      }
    }, 500); // Update every 500ms for accuracy instead of 1000ms

    return () => clearInterval(timer);
  }, [paymentSuccess, paymentExpired, navigate]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.request(`/orders/${orderId}`);
      setOrder(response.order || response);
      // Calculate remaining time from paymentExpiresAt
      if (response.order?.paymentExpiresAt || response.paymentExpiresAt) {
        const expiresAt = new Date(response.order?.paymentExpiresAt || response.paymentExpiresAt);
        const now = new Date();
        const secondsLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        setTimeLeft(secondsLeft);
      }
    } catch (err: any) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentProcessing(true);
    try {
      // The payment has been verified on the backend
      setPaymentSuccess(true);
      
      // Clear cart and coupon from localStorage and Redux
      localStorage.removeItem('cart');
      localStorage.removeItem('cartTotal');
      localStorage.removeItem('appliedCoupon');
      dispatch(clearCart());
      dispatch(clearCoupon());
      
      // Deduct product quantities from database
      if (order.items && order.items.length > 0) {
        const items = order.items.map((item: any) => ({
          productId: item.product?._id || item.product?.id,
          quantity: item.quantity,
        }));
        
        try {
          await api.request('/products/update-stock', {
            method: 'POST',
            body: JSON.stringify({ items }),
          });
          console.log('✓ Product stock updated successfully');
        } catch (err) {
          console.error('Error updating product stock:', err);
          // Continue even if stock update fails
        }
      }
      
      // Redirect to order tracking after 2 seconds
      setTimeout(() => {
        navigate(`/order-tracking/${orderId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Payment successful but unable to process order:', err);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('Payment error:', errorMessage);
    setPaymentProcessing(false);
  };

  if (!isLoggedIn) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <h2 style={{ color: 'var(--text-dark)' }}>Login Required</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>
              Please login to continue with payment.
            </p>
            <Link to="/" className={styles.backButton}>
              <FiArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.card}>
          <div className={styles.loadingSpinner}>
            <div />
            <p>Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <h2 style={{ color: 'var(--text-dark)' }}>Order Not Found</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>
              The order you're looking for doesn't exist.
            </p>
            <Link to="/cart" className={styles.backButton}>
              <FiArrowLeft size={16} /> Back to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const deliveryAddress = order.address || {};
  const subtotal = order.subtotal || 0;
  const discount = order.discount || 0;
  const couponDiscount = order.couponDiscount || 0;
  const deliveryFee = order.deliveryFee || 0;
  const total = order.total || subtotal - discount + deliveryFee;

  console.log("Order details loaded:", deliveryAddress);

  return (
    <div>
      {/* Compact Countdown Timer - Single Line */}
      <div style={{
        background: timeLeft < 60 ? '#ff6b6b' : timeLeft < 120 ? '#ffa500' : '#4caf50',
        color: 'white',
        padding: '12px 20px',
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        ⏱️ Payment expires in: <span style={{ fontSize: '18px', marginLeft: '8px' }}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </span>
        {timeLeft < 60 && ' ⚠️ Hurry!'}
      </div>

      {/* Payment Expired Warning */}
      {paymentExpired && (
        <div style={{
          background: '#fee',
          border: '2px solid #f44',
          padding: '15px',
          margin: '10px auto 20px auto',
          maxWidth: '1200px',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          <strong style={{ color: '#c00' }}>⏰ Payment Window Expired</strong> - Your payment request has expired. Redirecting to cart...
        </div>
      )}

      {/* Main Content Grid */}
      <div className={`container ${styles.page}`}>
        {/* Left Section - Payment */}
        <div className={styles.mainSection}>

        {/* Delivery Address Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📍 Delivery Address</h2>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.addressPreview}>
              <h4>{deliveryAddress.label || 'Delivery Address'}</h4>
              <p>
                <strong>{deliveryAddress.fullName || 'Customer'}</strong>
              </p>
              <p>📞 {deliveryAddress.phone || 'N/A'}</p>
              <p>
                {deliveryAddress.line1}
                {deliveryAddress.line2 && `, ${deliveryAddress.line2}`}
              </p>
              <p>
                {deliveryAddress.city}, {deliveryAddress.state} – {deliveryAddress.pincode}
              </p>
              {deliveryAddress.landmark && (
                <p>Landmark: {deliveryAddress.landmark}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Gateway Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>💳 Complete Payment</h2>
          </div>
          <div className={styles.cardBody}>
            {paymentSuccess && (
              <div className={styles.successMessage}>
                <FiCheck size={18} />
                <span>Payment successful! Redirecting...</span>
              </div>
            )}

            {!paymentSuccess && (
              <RazorpayPayment
                orderId={orderId || ''}
                amount={total}
                userEmail={deliveryAddress.email || order.userEmail || ''}
                userPhone={deliveryAddress.phone || order.userPhone || ''}
                userName={deliveryAddress.fullName || order.userName || 'Customer'}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isProcessing={paymentProcessing}
              />
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={styles.sidebarSection}>
        {/* Order Summary */}
        <div className={styles.summaryCard}>
          <h3 style={{ marginBottom: '20px', color: '#333', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>Order Summary</h3>

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#666', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>Items ({order.items.length})</h4>
              {order.items.map((item: any, index: number) => (
                <div
                  key={index}
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
                  onClick={() => {
                    if (item.product?.id || item.product?._id) {
                      navigate(`/products/${item.product?.id || item.product?._id}`);
                    }
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
                  {item.product?.image && (
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'https://via.placeholder.com/60x60?text=Product';
                      }}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #ddd'
                      }}
                    />
                  )}
                  
                  {/* Item Details */}
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ 
                        margin: '0 0 6px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.product?.name || item.productName || `Item ${index + 1}`}
                      </h5>
                      <p style={{ 
                        margin: '0', 
                        fontSize: '12px', 
                        color: '#999',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                      }}>
                        <span>Qty: <strong>{item.quantity}</strong></span>
                        <span>{formatCurrency((item.product?.price || item.price || 0))}/unit</span>
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
                        {formatCurrency((item.product?.price || item.price || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ 
            height: '1px', 
            backgroundColor: '#e0e0e0', 
            margin: '16px 0' 
          }} />

          {/* Price Breakdown */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#666', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>Price Breakdown</h4>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <span style={{ color: '#666', fontSize: '13px' }}>Subtotal</span>
              <span style={{ color: '#333', fontWeight: '500', fontSize: '13px' }}>{formatCurrency(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '500' }}>Product Discount</span>
                <span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>-{formatCurrency(discount)}</span>
              </div>
            )}

            {couponDiscount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '500' }}>
                  Coupon {order.couponCode && <span style={{ fontWeight: '600' }}>({order.couponCode})</span>}
                </span>
                <span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}

            {deliveryFee > 0 ? (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: '#666', fontSize: '13px' }}>Delivery Fee</span>
                <span style={{ color: '#333', fontWeight: '500', fontSize: '13px' }}>{formatCurrency(deliveryFee)}</span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span style={{ color: '#666', fontSize: '13px' }}>Delivery Fee</span>
                <span style={{ color: '#10b981', fontWeight: '600', fontSize: '13px' }}>Free</span>
              </div>
            )}

            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 0',
              backgroundColor: '#f9f9f9',
              paddingLeft: '10px',
              paddingRight: '10px',
              borderRadius: '6px',
              marginTop: '8px'
            }}>
              <span style={{ color: '#333', fontWeight: 'bold', fontSize: '15px' }}>Total Amount</span>
              <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '16px' }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Guarantee Card */}
        <div className={styles.guaranteeCard}>
          <h4>✓ 100% Secure</h4>
          <p>🔒 256-bit encrypted payment</p>
          <p>✓ Authentic products guaranteed</p>
          <p>↩️ Easy returns & refunds</p>
          <p>📞 24/7 customer support</p>
        </div>

        {/* Trust Badges */}
        <div className={styles.secureCheckoutBadge}>
          💳 Powered by Razorpay
        </div>
      </div>
    </div>
    </div>
  );
};

export default Payment;
