import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { addNewAddress, updateAddressAsync, deleteAddressAsync, fetchAddresses } from '../store/slices/addressSlice'
import { applyCoupon, removeCoupon } from '../store/slices/couponSlice'
import { useAuth } from '../context/AuthContext'
import useProducts from '../hooks/useProducts'
import LoginModal from '../components/LoginModal/LoginModal'
import AddressForm from '../components/AddressForm/AddressForm'
import { formatCurrency, sumCartValue, sumOriginalCartValue } from '../utils/commerce'
import { verifyCoupon } from '../api/coupon.api'
import api from '../services/api'
import styles from './commerce.module.css'
import './Checkout.css'

const Checkout = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isLoggedIn, login } = useAuth()
  
  // Use Redux cart, addresses, and coupon
  const reduxCart = useAppSelector((state) => state.cart.items)
  const { addresses: reduxAddresses, loading: addressesLoading } = useAppSelector((state: any) => state.address)
  const reduxCoupon = useAppSelector((state) => state.coupon)
  const { allProducts, loadProducts } = useProducts()

  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [donationAmount, setDonationAmount] = useState(0)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [customDonation, setCustomDonation] = useState('')

  // Load products on mount
  useEffect(() => {
    if (allProducts.length === 0) {
      loadProducts(1, 1000)
    }
  }, [allProducts.length, loadProducts])

  // Load addresses when logged in
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(fetchAddresses() as any)
    }
  }, [isLoggedIn, dispatch])

  const activeItems = useMemo(
    () => {
      return reduxCart
        .map((entry: any) => {
          const itemIdStr = String(entry.productId)
          const product = allProducts.find((p: any) => {
            const pid = p.id !== undefined ? String(p.id) : null
            const p_id = p._id !== undefined ? String(p._id) : null
            return pid === itemIdStr || p_id === itemIdStr
          })
          return product ? { product, quantity: entry.quantity } : null
        })
        .filter((entry: any): entry is { product: any; quantity: number } => entry !== null)
    },
    [reduxCart, allProducts],
  )

  const subtotal = sumCartValue(activeItems)
  const originalTotal = sumOriginalCartValue(activeItems)
  const discount = Math.max(0, originalTotal - subtotal)
  const couponDiscount = reduxCoupon.code ? reduxCoupon.discountAmount : 0
  const deliveryFee = subtotal > 2499 || subtotal === 0 ? 0 : 49
  const finalTotal = subtotal - couponDiscount + deliveryFee + donationAmount

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) {
      setCouponError('Enter a coupon code')
      return
    }

    setCouponLoading(true)
    setCouponError('')

    try {
      // Verify coupon from backend
      const response = await verifyCoupon(code, subtotal)

      if (!response.success) {
        setCouponError(response.message)
        dispatch(removeCoupon())
        return
      }

      // Apply coupon with discount details from backend
      dispatch(applyCoupon({
        code: response.data?.code || code,
        discountPct: response.data?.discountValue || 0,
        discountAmount: response.data?.discountAmount || 0,
      }))
      setCouponCode('')
    } catch (error) {
      setCouponError('Failed to apply coupon. Please try again.')
      dispatch(removeCoupon())
    } finally {
      setCouponLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoginOpen(true)
    }
  }, [isLoggedIn])

  useEffect(() => {
    const defaultAddress = reduxAddresses.find((entry: any) => entry.isDefault) ?? reduxAddresses[0]
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress._id || defaultAddress.id)
      setShowAddForm(false)
    }
    // Only show form if addresses are loaded and empty
    if (reduxAddresses.length === 0 && !addressesLoading) {
      setShowAddForm(true)
    }
  }, [reduxAddresses, selectedAddressId, addressesLoading])

  const handleAddressSubmit = async (address: any) => {
    try {
      if (editingAddress?._id) {
        // Update existing address
        await dispatch(updateAddressAsync({ addressId: editingAddress._id, data: address }) as any)
      } else {
        // Add new address
        await dispatch(addNewAddress(address) as any)
      }
      setSelectedAddressId(address._id || address.id)
      setEditingAddress(null)
      setShowAddForm(false)
    } catch (error: any) {
      // Error handled by Redux state
    }
  }

  const handleProceedToPayment = async () => {
    if (!selectedAddressId || activeItems.length === 0) {
      return
    }

    setIsProcessing(true)

    const estimated = new Date()
    estimated.setDate(estimated.getDate() + 5)

    // Prepare order items
    const orderItems = activeItems.map((entry: any) => ({
      productId: entry.product.id || entry.product._id,
      productName: entry.product.name,
      quantity: entry.quantity,
      price: entry.product.price,
    }))

    // Get address details
    const selectedAddress = reduxAddresses.find((a: any) => a._id === selectedAddressId || a.id === selectedAddressId)

    try {
      // Create order with pending payment status
      const orderResponse = await api.request('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: orderItems,
          total: finalTotal,
          subtotal: originalTotal,
          discount: discount,
          deliveryFee: deliveryFee,
          couponCode: reduxCoupon.code || null,
          couponDiscount: couponDiscount,
          donationAmount: donationAmount,
          paymentMethod: 'razorpay',
          paymentStatus: 'pending',
          estimatedDelivery: estimated.toISOString(),
          address: selectedAddress,
        }),
      })
      
      const newOrder = orderResponse.order

      // Don't clear cart yet - wait for payment to complete
      // Clear Redux cart and local storage will happen after successful payment in Payment.tsx

      // Redirect to payment page
      navigate(`/payment/${newOrder._id}`)
    } catch (error: any) {
      console.error('Error creating order:', error)
      setIsProcessing(false)
    }
  }

  if (activeItems.length === 0) {
    return (
      <div className={`container ${styles.page}`} data-testid="checkout-page">
        <div className={styles.card} style={{ padding: 30 }}>
          <h2 style={{ color: 'var(--text-dark)', marginBottom: 20 }}>No items available for checkout</h2>
          <Link to="/cart" className={styles.primaryBtn}>Go to cart</Link>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className={`container ${styles.page}`} data-testid="checkout-page">
        <div className={styles.card} style={{ padding: 16 }}>
          <h2 style={{ color: 'var(--text-dark)' }}>Login required</h2>
          <p>Please login to continue checkout.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={styles.primaryBtn} onClick={() => setIsLoginOpen(true)} data-testid="checkout-login-btn">
              Login to continue
            </button>
            <Link to="/cart" className={styles.ghostBtn}>Back to cart</Link>
          </div>
        </div>
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(identifier, provider = 'mobile') => {
            login(provider === 'google' ? '9999999999' : identifier)
            setIsLoginOpen(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className={`container ${styles.page}`} style={{ paddingBottom: '0px' }} data-testid="checkout-page">
      <h1 style={{ marginBottom: 16 }}>Checkout</h1>

      <div className={styles.tabs}>
        <span className={`${styles.tab} ${styles.tabActive}`.trim()}>1. Address & Summary</span>
        <span className={`${styles.tab}`.trim()}>2. Payment (Next)</span>
      </div>

      <div className={styles.checkoutGrid}>
        {/* Left Column: Address Selection */}
        <section className={styles.card} style={{ padding: 14 }}>
          <h3 style={{ marginBottom: 10 }}>Delivery address</h3>

          {addressesLoading ? (
            <p style={{ padding: '12px', textAlign: 'center', color: 'var(--text-light)' }}>Loading saved addresses...</p>
          ) : reduxAddresses.length > 0 ? (
            reduxAddresses.map((address: any) => (
              <article className={styles.softCard} style={{ padding: 12, marginBottom: 10 }} key={address._id || address.id}>
                <div className={styles.row}>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', flex: 1 }}>
                    <input
                      type="radio"
                      name="selected-address"
                      style={{ marginTop: 4 }}
                      checked={selectedAddressId === (address._id || address.id)}
                      onChange={() => {
                        setSelectedAddressId(address._id || address.id)
                        setShowAddForm(false)
                        setEditingAddress(null)
                      }}
                    />
                    <div>
                      <strong style={{ color: 'var(--text-dark)' }}>{address.label}</strong>
                      {address.isDefault && (
                        <span style={{ marginLeft: 6, fontSize: 11, padding: '2px 6px', borderRadius: 999, background: 'color-mix(in srgb, var(--primary) 14%, var(--bg-white))', color: 'var(--primary)', fontWeight: 700 }}>Default</span>
                      )}
                      {address.name && <p style={{ margin: '2px 0', fontWeight: 600 }}>{address.name}</p>}
                      {address.phone && <p style={{ margin: '2px 0', fontSize: '12px', color: 'var(--text-light)' }}>📞 {address.phone}</p>}
                      <p style={{ margin: '2px 0' }}>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                      <p style={{ margin: '2px 0' }}>{address.city}, {address.state} – {address.pincode}</p>
                      {address.landmark && <p style={{ margin: '2px 0', fontSize: '12px', color: 'var(--text-light)' }}>Landmark: {address.landmark}</p>}
                    </div>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => { setEditingAddress(address); setShowAddForm(true); setSelectedAddressId('') }}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className={styles.ghostBtn} 
                      onClick={() => dispatch(deleteAddressAsync(address._id || address.id) as any)}
                      disabled={addressesLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p style={{ padding: '12px', textAlign: 'center', color: 'var(--text-light)' }}>No saved addresses. Add one below.</p>
          )}

          {!showAddForm && (
            <button
              type="button"
              style={{ marginTop: 6, marginBottom: 12, background: 'none', border: '1.5px dashed var(--primary)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
              onClick={() => { setShowAddForm(true); setEditingAddress(null) }}
              data-testid="add-new-address-btn"
            >
              + Add new address
            </button>
          )}

          {showAddForm && (
            <div style={{ marginTop: 10 }}>
              <h3 style={{ marginBottom: 12 }}>{editingAddress ? 'Edit address' : 'Add new address'}</h3>
              <AddressForm
                initialAddress={editingAddress ?? {}}
                submitLabel={editingAddress ? 'Update address' : 'Save address'}
                onSubmit={handleAddressSubmit}
                onCancel={() => { setShowAddForm(false); setEditingAddress(null) }}
              />
            </div>
          )}
        </section>

        {/* Right Column: Full Order Summary */}
        <aside className={styles.card} style={{ padding: 14 }}>
          <h3 style={{ marginBottom: 12 }}>Order summary</h3>

          {/* Items List */}
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>Items ({activeItems.length})</div>
            {activeItems.map(({ product, quantity }: any) => (
              <div key={product.id || product._id} className={styles.row} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-dark)' }}>{product.name} × {quantity}</span>
                <span style={{ fontSize: 13 }}>{formatCurrency(product.price * quantity)}</span>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
            <div className={styles.row} style={{ fontSize: 13, marginBottom: 6 }}>
              <span>Subtotal</span>
              <span>{formatCurrency(originalTotal)}</span>
            </div>
            {discount > 0 && (
              <div className={styles.row} style={{ fontSize: 13, marginBottom: 6, color: '#10b981' }}>
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className={styles.row} style={{ fontSize: 13, marginBottom: 6, color: '#10b981' }}>
                <span>Coupon ({reduxCoupon.code})</span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className={styles.row} style={{ fontSize: 13, marginBottom: 6 }}>
                <span>Delivery</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            {deliveryFee === 0 && (
              <div className={styles.row} style={{ fontSize: 13, marginBottom: 6, color: '#10b981' }}>
                <span>Delivery</span>
                <span>Free</span>
              </div>
            )}
          </div>

          {/* Coupon Section */}
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
            {reduxCoupon.code ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f5e9', padding: '8px 10px', borderRadius: '6px', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2e7d32' }}>🎉 {reduxCoupon.code} applied – {reduxCoupon.discountPct}% off</span>
                <button type="button" onClick={() => dispatch(removeCoupon())} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#2e7d32' }}>×</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(event) => { setCouponCode(event.target.value); setCouponError('') }}
                    onKeyDown={(event) => event.key === 'Enter' && !couponLoading && handleApplyCoupon()}
                    disabled={couponLoading}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button 
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      opacity: couponLoading ? 0.6 : 1
                    }}
                  >
                    {couponLoading ? 'Verifying...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>{couponError}</p>}
              </div>
            )}
          </div>

          {/* Donation Section */}
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={() => setShowDonationModal(true)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px dashed var(--primary)',
                backgroundColor: 'rgba(var(--primary-rgb), 0.02)',
                color: 'var(--primary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              🤝 Add Donation
            </button>
            {donationAmount > 0 && (
              <div style={{ marginTop: 8, padding: '8px 10px', backgroundColor: '#e8f5e9', borderRadius: '6px', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#2e7d32', fontWeight: 600, fontSize: '13px' }}>
                  ✓ {formatCurrency(donationAmount)} will be donated
                </p>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className={styles.row} style={{ color: 'var(--text-dark)', fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
            <span>Grand total</span>
            <span>{formatCurrency(finalTotal)}</span>
          </div>

          {!selectedAddressId && reduxAddresses.length > 0 && (
            <p style={{ color: 'var(--error-color)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>Please select a delivery address.</p>
          )}
          {!selectedAddressId && reduxAddresses.length === 0 && (
            <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 12 }}>Add an address to continue.</p>
          )}

          <button
            type="button"
            className={styles.primaryBtn}
            style={{ width: '100%', opacity: !selectedAddressId || showAddForm || isProcessing ? 0.5 : 1 }}
            disabled={!selectedAddressId || showAddForm || isProcessing}
            onClick={handleProceedToPayment}
            data-testid="proceed-payment-btn"
          >
            {isProcessing ? 'Processing...' : 'Continue to Payment'}
          </button>
        </aside>
      </div>

      {/* Donation Modal */}
      {showDonationModal && (
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
          zIndex: 999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Support Handcrafts 🤝</h3>
              <button
                type="button"
                onClick={() => {
                  setShowDonationModal(false)
                  setCustomDonation('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              Your donation helps support artisans and sustain traditional crafts.
            </p>

            {/* Preset Amounts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[100, 200, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setDonationAmount(amount)
                    setCustomDonation('')
                    setShowDonationModal(false)
                  }}
                  style={{
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd'
                    e.currentTarget.style.backgroundColor = '#f9f9f9'
                  }}
                >
                  ₹{amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Custom Amount
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  value={customDonation}
                  onChange={(e) => setCustomDonation(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
                />
                <button
                  type="button"
                  onClick={() => {
                    const amount = parseInt(customDonation)
                    if (amount > 0) {
                      setDonationAmount(amount)
                      setShowDonationModal(false)
                      setCustomDonation('')
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Add
                </button>
              </div>
            </div>

            {/* No Donation Option */}
            <button
              type="button"
              onClick={() => {
                setShowDonationModal(false)
                setCustomDonation('')
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#666',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8e8e8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            >
              Maybe Later
            </button>

            {/* Current Donation Display */}
            {donationAmount > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#e8f5e9',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, color: '#2e7d32', fontWeight: 600 }}>
                  ✓ {formatCurrency(donationAmount)} will be donated
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Checkout


