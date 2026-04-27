import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, Address } from '../../context/AuthContext'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { addItem, removeItem as removeFromCart } from '../../store/slices/cartSlice'
import { removeItem as removeFromWishlist } from '../../store/slices/wishlistSlice'
import { addNewAddress, updateAddressAsync, deleteAddressAsync, setDefaultAddressAsync } from '../../store/slices/addressSlice'
import useProducts from '../../hooks/useProducts'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import useAddressValidation from '../../hooks/useAddressValidation'
import { getStockCount } from '../../utils/commerce'
import api from '../../services/api'
import styles from './ProfileModal.module.css'
import { fetchOrders } from '../../store/slices/orderSlice'
import { useToast } from '../../context/ToastContext'

type Tab = 'profile' | 'addresses' | 'orders' | 'wishlist'

type ProfileModalProps = {
  isOpen: boolean
  onClose: () => void
}

const AVATAR_INITIALS = (name: string) => {
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase()
}

const getStatusColor = (status: string): string => {
  if (status === 'delivered') return 'delivered'
  if (status === 'shipped' || status === 'out_for_delivery') return 'shipped'
  if (status === 'ordered' || status === 'packed') return 'processing'
  return 'processing'
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const dispatch = useAppDispatch()
  const { userProfile, logout, updateProfile } = useAuth()
  const wishlistItems = useAppSelector((state) => state.wishlist.items)
  const orders = useAppSelector((state) => state.orders.orders)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const modalRef = useRef<HTMLDivElement>(null)

  // Fetch fresh user profile data when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchUserProfile = async () => {
      try {
        const response = await api.getUserProfile()
        if (response.user) {
          const dbProfile = response.user
          updateProfile({
            name: dbProfile.name || userProfile?.name || 'User',
            email: dbProfile.email || userProfile?.email || '',
            gender: dbProfile.gender || userProfile?.gender || '',
            dob: dbProfile.dob || userProfile?.dob || '',
          })
        }
      } catch (error) {
        // Continue with existing profile if fetch fails
      }
    }

    fetchUserProfile()
    dispatch(fetchOrders() as any)
  }, [isOpen, dispatch])

  useEffect(() => {
    if (!isOpen) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !userProfile) return null

  const handleLogout = () => {
    logout()
    onClose()
    window.location.href = '/'
  }

  const initials = AVATAR_INITIALS(userProfile.name)

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <aside
        ref={modalRef}
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        aria-modal="true"
        role="dialog"
        aria-label="User profile"
      >
        {/* --- Header --- */}
        <div className={styles.drawerHeader}>
          <div className={styles.avatarRing}>
            <div className={styles.avatar}>{initials}</div>
            <span className={styles.onlineDot} aria-hidden="true" />
          </div>
          <div className={styles.userMeta}>
            <h2 className={styles.userName}>{userProfile.name}</h2>
            <p className={styles.userMobile}>+91 {userProfile.mobile.replace(/^\+91/, '').trim()}</p>
            <p className={styles.userEmail}>{userProfile.email}</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close profile">
            ✕
          </button>
        </div>

        {/* --- Tabs --- */}
        <nav className={styles.tabs} aria-label="Profile sections">
          {(['profile', 'addresses', 'orders', 'wishlist'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className={styles.tabIcon}>{TAB_ICONS[tab]}</span>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </nav>

        {/* --- Content --- */}
        <div className={styles.content}>
          {activeTab === 'profile' && <ProfileTab profile={userProfile} wishlistCount={wishlistItems.length} orders={orders} />}
          {activeTab === 'addresses' && <AddressesTab addresses={userProfile.addresses} />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'wishlist' && <WishlistTab onClose={onClose} />}
        </div>

        {/* --- Footer Logout --- */}
        <div className={styles.drawerFooter}>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <span>⎋</span> Sign Out
          </button>
        </div>
      </aside>
    </div>
  )
}

/* ─── Sub-tabs ──────────────────────────────────────────── */

const TAB_ICONS: Record<Tab, string> = {
  profile: '👤',
  addresses: '📍',
  orders: '📦',
  wishlist: '❤️',
}

const TAB_LABELS: Record<Tab, string> = {
  profile: 'Profile',
  addresses: 'Addresses',
  orders: 'Orders',
  wishlist: 'Wishlist',
}

const ProfileTab = ({ profile, wishlistCount, orders }: { profile: NonNullable<ReturnType<typeof useAuth>['userProfile']>, wishlistCount: number, orders: any[] }) => {
  const { updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editData, setEditData] = useState({
    name: profile.name || '',
    email: profile.email || '',
    gender: profile.gender || '',
    dob: profile.dob || '',
  })

  // Sync editData with profile only when NOT editing (to avoid overwriting user input)
  useEffect(() => {
    if (!isEditing) {
      setEditData({
        name: profile.name || '',
        email: profile.email || '',
        gender: profile.gender || '',
        dob: profile.dob || '',
      })
    }
  }, [profile, isEditing])

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleEditClick = () => {
    // Ensure editData has the latest profile data before entering edit mode
    setEditData({
      name: profile.name || '',
      email: profile.email || '',
      gender: profile.gender || '',
      dob: profile.dob || '',
    })
    setErrors({})
    setIsEditing(true)
  }

  // Validation functions
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate full name (minimum 3 characters)
    if (editData.name.trim().length < 3) {
      newErrors.name = 'Full name must be at least 3 characters'
    }

    // Validate email (only if provided)
    if (editData.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatMobileNumber = (mobile: string): string => {
    // Remove all spaces and duplicates to get clean number
    const cleanNumber = mobile.replace(/\s+/g, '').replace(/^\+91\+91/, '+91')
    
    // If it already has +91, keep it with one space; otherwise add +91
    if (cleanNumber.startsWith('+91')) {
      return `+91 ${cleanNumber.slice(3)}`
    }
    
    // If no +91, add it
    return `+91 ${cleanNumber}`
  }

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)
      const response = await api.request('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          gender: editData.gender,
          dob: editData.dob,
        })
      })

      if (response.user) {
        updateProfile({
          name: response.user.name,
          email: response.user.email,
          gender: response.user.gender,
          dob: response.user.dob,
        })
        setIsEditing(false)
        setErrors({})
      }
    } catch (error) {
      alert('Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className={styles.sectionTitle}>Personal Details</h3>
        {!isEditing && (
          <button 
            type="button" 
            className={styles.secondaryBtn}
            onClick={handleEditClick}
            style={{ fontSize: 12 }}
          >
            ✎ Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className={styles.fieldGrid}>
          <div className={styles.editField}>
            <label>Full Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              className={`${styles.editInput} ${errors.name ? styles.editInputError : ''}`}
            />
            {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
          </div>
          <div className={styles.editField}>
            <label>Email</label>
            <input
              type="email"
              value={editData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              className={`${styles.editInput} ${errors.email ? styles.editInputError : ''}`}
            />
            {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
          </div>
          <div className={styles.editField}>
            <label>Gender</label>
            <select
              value={editData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className={styles.editInput}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className={styles.editField}>
            <label>Date of Birth</label>
            <input
              type="date"
              value={editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('dob', e.target.value)}
              className={styles.editInput}
            />
          </div>
          <div className={styles.editField}>
            <label>Mobile</label>
            <input
              type="text"
              value={formatMobileNumber(profile.mobile)}
              disabled
              className={styles.editInput}
              style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
            />
          </div>
        </div>
      ) : (
        <div className={styles.fieldGrid}>
          <FieldRow label="Full Name" value={profile.name} icon="👤" />
          <FieldRow label="Mobile" value={formatMobileNumber(profile.mobile)} icon="📱" />
          <FieldRow label="Email" value={profile.email || '-'} icon="✉️" />
          <FieldRow label="Gender" value={profile.gender || '-'} icon="⚧" />
          <FieldRow label="Date of Birth" value={profile.dob ? formatDob(profile.dob) : '-'} icon="🎂" />
        </div>
      )}

      {isEditing && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSaveProfile}
            disabled={isSaving}
            style={{ flex: 1 }}
          >
            {isSaving ? '💾 Saving...' : '✓ Save Changes'}
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => {
              setIsEditing(false)
              setEditData({
                name: profile.name || '',
                email: profile.email || '',
                gender: profile.gender || '',
                dob: profile.dob || '',
              })
              setErrors({})
            }}
            disabled={isSaving}
            style={{ flex: 1 }}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{orders.length}</span>
          <span className={styles.statLabel}>Orders</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{wishlistCount}</span>
          <span className={styles.statLabel}>Wishlist</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>₹{orders.reduce((total, order) => total + (order.total || 0), 0).toLocaleString('en-IN')}</span>
          <span className={styles.statLabel}>Total Spent</span>
        </div>
      </div>
    </div>
  )
}

const AddressesTab = ({ addresses }: { addresses: Address[] }) => {
  const dispatch = useAppDispatch()
  const { addresses: reduxAddresses, loading } = useAppSelector((state: any) => state.address)
  const validation = useAddressValidation()
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    label: 'Home',
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle')
  const [cityLocked, setCityLocked] = useState(false)
  const [stateLocked, setStateLocked] = useState(false)
  const debouncedPincode = useDebouncedValue(formData.pincode, 400)
  
  // Auto-fill city and state from pincode
  useEffect(() => {
    if (!debouncedPincode || !/^\d{6}$/.test(debouncedPincode)) {
      setPincodeStatus('idle')
      setCityLocked(false)
      setStateLocked(false)
      return
    }

    const lookupPincode = async () => {
      try {
        setPincodeStatus('loading')
        const response = await api.lookupPincode(debouncedPincode)
        
        if (response.success && response.data) {
          setFormData(prev => ({
            ...prev,
            city: response.data.city || '',
            state: response.data.state || '',
          }))
          setCityLocked(true)
          setStateLocked(true)
          setPincodeStatus('found')
        } else {
          setPincodeStatus('not_found')
          setCityLocked(false)
          setStateLocked(false)
        }
      } catch (err) {
        setPincodeStatus('not_found')
        setCityLocked(false)
        setStateLocked(false)
      }
    }

    lookupPincode()
  }, [debouncedPincode])
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFieldBlur = (fieldName: string) => {
    validation.setFieldTouched(fieldName)
    validation.validateField(fieldName, formData[fieldName as keyof typeof formData])
  }

  const handleAddAddress = async () => {
    setError(null)
    
    // Validate form
    if (!validation.validateForm(formData)) {
      setError('Please correct the errors below')
      return
    }

    try {
      if (editingAddressId) {
        await dispatch(updateAddressAsync({ addressId: editingAddressId, data: formData }) as any)
        setEditingAddressId(null)
      } else {
        await dispatch(addNewAddress(formData) as any)
      }
      // Reset form
      setFormData({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', landmark: '' })
      setCityLocked(false)
      setStateLocked(false)
      setPincodeStatus('idle')
      validation.resetValidation()
      setIsAddingAddress(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save address')
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        await dispatch(deleteAddressAsync(addressId) as any)
      } catch (err: any) {
        setError(err.message || 'Failed to delete address')
      }
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      await dispatch(setDefaultAddressAsync(addressId) as any)
    } catch (err: any) {
      setError(err.message || 'Failed to set default address')
    }
  }

  const displayAddresses = reduxAddresses.length > 0 ? reduxAddresses : addresses || []

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Saved Addresses</h3>
      
      {error && (
        <div style={{ padding: '8px 12px', background: 'rgba(211, 47, 47, 0.15)', color: '#d32f2f', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Address List */}
      <div className={styles.addressList}>
        {displayAddresses.map((addr: any) => (
          <div key={addr._id || addr.id} className={`${styles.addressCard} ${addr.isDefault ? styles.addressDefault : ''}`}>
            <div className={styles.addressTop}>
              <span className={styles.addressLabel}>{addr.label}</span>
              {addr.isDefault && <span className={styles.defaultBadge}>Default</span>}
            </div>
            {addr.name && <p className={styles.addressText} style={{ fontWeight: 600 }}>{addr.name}</p>}
            {addr.phone && <p className={styles.addressText} style={{ fontSize: '12px', color: 'var(--text-light)' }}>📞 {addr.phone}</p>}
            <p className={styles.addressText}>
              {addr.line1}, {addr.line2}
            </p>
            <p className={styles.addressText}>
              {addr.city}, {addr.state} – {addr.pincode}
            </p>
            {addr.landmark && <p className={styles.addressText} style={{ fontSize: '12px', color: 'var(--text-light)' }}>Landmark: {addr.landmark}</p>}
            
            <div className={styles.addressActions}>
              <button 
                type="button" 
                className={styles.addrBtn}
                onClick={() => {
                  setEditingAddressId(addr._id || addr.id)
                  setFormData({
                    label: addr.label,
                    name: addr.name || '',
                    phone: addr.phone || '',
                    line1: addr.line1,
                    line2: addr.line2,
                    city: addr.city,
                    state: addr.state,
                    pincode: addr.pincode,
                    landmark: addr.landmark || '',
                  })
                  setIsAddingAddress(true)
                }}
              >
                Edit
              </button>
              {!addr.isDefault && (
                <button 
                  type="button" 
                  className={styles.addrBtn}
                  onClick={() => handleSetDefault(addr._id || addr.id)}
                  disabled={loading}
                >
                  Set Default
                </button>
              )}
              {!addr.isDefault && (
                <button 
                  type="button" 
                  className={`${styles.addrBtn} ${styles.addrBtnDanger}`}
                  onClick={() => handleDeleteAddress(addr._id || addr.id)}
                  disabled={loading}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Address Form */}
      {isAddingAddress && (
        <div style={{ marginTop: '16px', padding: '12px', border: '1px solid rgba(125, 46, 79, 0.2)', borderRadius: '8px', background: 'rgba(125, 46, 79, 0.05)' }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--text-dark)' }}>
            {editingAddressId ? 'Edit Address' : 'Add New Address'}
          </h4>
          
          <div style={{ display: 'grid', gap: '10px', marginBottom: '12px' }}>
            {/* Label */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>
                Label (Home, Office, etc)
              </label>
              <select
                name="label"
                value={formData.label}
                onChange={handleAddressChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid rgba(125, 46, 79, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              >
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Name */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleAddressChange}
                onBlur={() => handleFieldBlur('name')}
                placeholder="Your full name"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: validation.hasFieldError('name') ? '1px solid #d32f2f' : '1px solid rgba(125, 46, 79, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: validation.hasFieldError('name') ? 'rgba(211, 47, 47, 0.05)' : 'transparent',
                }}
              />
              {validation.hasFieldError('name') && (
                <span style={{ fontSize: '11px', color: '#d32f2f', marginTop: '2px', display: 'block' }}>
                  {validation.getFieldError('name')}
                </span>
              )}
            </div>

            {/* Phone */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleAddressChange}
                onBlur={() => handleFieldBlur('phone')}
                placeholder="10-digit mobile number"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: validation.hasFieldError('phone') ? '1px solid #d32f2f' : '1px solid rgba(125, 46, 79, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: validation.hasFieldError('phone') ? 'rgba(211, 47, 47, 0.05)' : 'transparent',
                }}
              />
              {validation.hasFieldError('phone') && (
                <span style={{ fontSize: '11px', color: '#d32f2f', marginTop: '2px', display: 'block' }}>
                  {validation.getFieldError('phone')}
                </span>
              )}
            </div>

            {/* Line 1 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>
                Address Line 1 *
              </label>
              <input
                type="text"
                name="line1"
                value={formData.line1}
                onChange={handleAddressChange}
                onBlur={() => handleFieldBlur('line1')}
                placeholder="Street address"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: validation.hasFieldError('line1') ? '1px solid #d32f2f' : '1px solid rgba(125, 46, 79, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: validation.hasFieldError('line1') ? 'rgba(211, 47, 47, 0.05)' : 'transparent',
                }}
              />
              {validation.hasFieldError('line1') && (
                <span style={{ fontSize: '11px', color: '#d32f2f', marginTop: '2px', display: 'block' }}>
                  {validation.getFieldError('line1')}
                </span>
              )}
            </div>

            {/* Line 2 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>
                Address Line 2
              </label>
              <input
                type="text"
                name="line2"
                value={formData.line2}
                onChange={handleAddressChange}
                placeholder="Apartment, suite, etc (optional)"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid rgba(125, 46, 79, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            
            {/* Pincode */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>
                Pincode *
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleAddressChange}
                onBlur={() => handleFieldBlur('pincode')}
                placeholder="6-digit pincode"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: validation.hasFieldError('pincode') ? '1px solid #d32f2f' : '1px solid rgba(125, 46, 79, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: validation.hasFieldError('pincode') ? 'rgba(211, 47, 47, 0.05)' : 'transparent',
                }}
              />
              {validation.hasFieldError('pincode') && (
                <span style={{ fontSize: '11px', color: '#d32f2f', marginTop: '2px', display: 'block' }}>
                  {validation.getFieldError('pincode')}
                </span>
              )}
              {!validation.hasFieldError('pincode') && (
                <>
                  {pincodeStatus === 'loading' && (
                    <span style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px', display: 'block' }}>🔄 Looking up pincode...</span>
                  )}
                  {pincodeStatus === 'found' && (
                    <span style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px', display: 'block' }}>✓ Pincode verified</span>
                  )}
                  {pincodeStatus === 'not_found' && formData.pincode && /^\d{6}$/.test(formData.pincode) && (
                    <span style={{ fontSize: '11px', color: '#ff9800', marginTop: '2px', display: 'block' }}>⚠ Pincode not found, enter city & state manually</span>
                  )}
                </>
              )}
            </div>

            {/* City & State */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleAddressChange}
                  onBlur={() => handleFieldBlur('city')}
                  placeholder="City"
                  disabled={cityLocked}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: validation.hasFieldError('city') ? '1px solid #d32f2f' : '1px solid rgba(125, 46, 79, 0.3)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    backgroundColor: cityLocked ? 'rgba(125, 46, 79, 0.08)' : validation.hasFieldError('city') ? 'rgba(211, 47, 47, 0.05)' : 'transparent',
                    cursor: cityLocked ? 'not-allowed' : 'text',
                    opacity: cityLocked ? 0.7 : 1,
                  }}
                />
                {validation.hasFieldError('city') && (
                  <span style={{ fontSize: '11px', color: '#d32f2f', marginTop: '2px', display: 'block' }}>
                    {validation.getFieldError('city')}
                  </span>
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleAddressChange}
                  onBlur={() => handleFieldBlur('state')}
                  placeholder="State"
                  disabled={stateLocked}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: validation.hasFieldError('state') ? '1px solid #d32f2f' : '1px solid rgba(125, 46, 79, 0.3)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    backgroundColor: stateLocked ? 'rgba(125, 46, 79, 0.08)' : validation.hasFieldError('state') ? 'rgba(211, 47, 47, 0.05)' : 'transparent',
                    cursor: stateLocked ? 'not-allowed' : 'text',
                    opacity: stateLocked ? 0.7 : 1,
                  }}
                />
                {validation.hasFieldError('state') && (
                  <span style={{ fontSize: '11px', color: '#d32f2f', marginTop: '2px', display: 'block' }}>
                    {validation.getFieldError('state')}
                  </span>
                )}
              </div>
            </div>

            {/* Landmark */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>
                Landmark
              </label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleAddressChange}
                placeholder="Nearby landmark (optional)"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid rgba(125, 46, 79, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleAddAddress}
              disabled={loading || !validation.isValid}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: loading || !validation.isValid ? 'rgba(125, 46, 79, 0.4)' : 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: loading || !validation.isValid ? 'not-allowed' : 'pointer',
                opacity: loading || !validation.isValid ? 0.6 : 1,
                fontSize: '13px',
              }}
            >
              {loading ? 'Saving...' : (editingAddressId ? 'Update Address' : 'Add Address')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingAddress(false)
                setEditingAddressId(null)
                setFormData({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', landmark: '' })
                setCityLocked(false)
                setStateLocked(false)
                setPincodeStatus('idle')
                setError(null)
                validation.resetValidation()
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'transparent',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add New Address Button */}
      {!isAddingAddress && (
        <button 
          type="button" 
          className={styles.addAddressBtn}
          onClick={() => {
            setIsAddingAddress(true)
            setEditingAddressId(null)
            setFormData({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', landmark: '' })
            setError(null)
          }}
          style={{ marginTop: '12px' }}
        >
          + Add New Address
        </button>
      )}
    </div>
  )
}

const OrdersTab = () => {
  const navigate = useNavigate()
  const orders = useAppSelector((state) => state.orders.orders)
  const loading = useAppSelector((state) => state.orders.loading)
  const error = useAppSelector((state) => state.orders.error)

  // Filter only orders with successful payment
  const successfulOrders = orders.filter((order: any) => order.paymentStatus === 'success')

  if (loading) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent Orders</h3>
        <p style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>Loading orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent Orders</h3>
        <p style={{ textAlign: 'center', padding: '1rem', color: '#d32f2f' }}>⚠️ {error}</p>
      </div>
    )
  }

  if (successfulOrders.length === 0) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recent Orders</h3>
        <p style={{ textAlign: 'center', padding: '1rem', color: '#999' }}>No completed orders yet</p>
      </div>
    )
  }

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const handleOrderClick = (orderId: string) => {
    navigate(`/order-tracking/${orderId}`)
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Recent Orders</h3>
      <div className={styles.orderList}>
        {successfulOrders.map((order: any) => (
          <div 
            key={order._id} 
            className={styles.orderCard}
            onClick={() => handleOrderClick(order._id)}
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = ''
              e.currentTarget.style.transform = ''
            }}
          >
            <div className={styles.orderTop}>
              <span className={styles.orderId}>{order._id.slice(-8).toUpperCase()}</span>
              <span className={`${styles.orderStatus} ${styles[`status_${getStatusColor(order.status)}`]}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
              </span>
            </div>
            
            {/* Display all product names in the order */}
            <div className={styles.orderItems}>
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, idx: number) => {
                  return (
                    <p key={idx} className={styles.orderItem}>
                      {item.product?.name || item.productName || 'Product'} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                    </p>
                  )
                })
              ) : (
                <p className={styles.orderItem}>No items</p>
              )}
            </div>
            
            <div className={styles.orderMeta}>
              <span className={styles.orderDate}>📅 {formatDate(order.createdAt)}</span>
              <span className={styles.orderAmount}>{formatCurrency(order.total)}</span>
            </div>
            <div className={styles.orderActions} onClick={(e) => e.stopPropagation()}>
              <button type="button" className={styles.addrBtn} onClick={() => handleOrderClick(order._id)}>Track</button>
              <button type="button" className={styles.addrBtn}>Invoice</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const WishlistTab = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useAppDispatch()
  const wishlistItems = useAppSelector((state) => state.wishlist.items)
  const { allProducts, loadProducts } = useProducts()
  const { showToast } = useToast()

  // Load products on mount
  useEffect(() => {
    if (allProducts.length === 0) {
      loadProducts(1, 1000)
    }
  }, [allProducts.length, loadProducts])
  
  const wishlistProducts = wishlistItems
    .map((item: any) => {
      const itemIdStr = String(item.productId)
      return allProducts.find((p: any) => {
        const pid = p.id !== undefined ? String(p.id) : null
        const p_id = p._id !== undefined ? String(p._id) : null
        return pid === itemIdStr || p_id === itemIdStr
      })
    })
    .filter((p: any): p is any => p !== undefined)

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>My Wishlist</h3>
      {wishlistProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          <p>Your wishlist is empty</p>
        </div>
      ) : (
        <div className={styles.wishList}>
          {wishlistProducts.map((product: any) => {
            // Find the original wishlist item to get the correct productId
            const originalWishlistItem = wishlistItems.find((item: any) => {
              const itemIdStr = String(item.productId)
              const pid = product.id !== undefined ? String(product.id) : null
              const p_id = product._id !== undefined ? String(product._id) : null
              return pid === itemIdStr || p_id === itemIdStr
            })
            const productId = originalWishlistItem?.productId || product.id || product._id
            
            return (
            <div key={productId} className={styles.wishCard}>
              <div className={styles.wishInfo}>
                <p className={styles.wishName}>{product.name}</p>
                <p className={styles.wishCat}>{product.category}</p>
                <p className={styles.wishPrice}>₹{product.price}</p>
              </div>
              <div className={styles.wishActions}>
                <button 
                  type="button" 
                  className={styles.wishCartBtn}
                  onClick={() => {
                    // Check stock before adding to cart
                    const stockCount = product.stock !== undefined ? product.stock : getStockCount(productId);
                    
                    if (stockCount <= 0) {
                      showToast('❌ This item is out of stock', 'error');
                      return;
                    }
                    
                    // Add to active cart (not as savedForLater) with product details
                    dispatch(addItem({ 
                      productId, 
                      quantity: 1,
                      productName: product.name,
                      productPrice: product.price,
                      productImage: product.image || product.images?.[0]
                    }));
                    // Remove from wishlist
                    dispatch(removeFromWishlist(productId));
                    // Show success and close modal
                    showToast('✓ Added to cart');
                    setTimeout(() => onClose(), 500);
                  }}
                >
                  Add to Cart
                </button>
                <button 
                  type="button" 
                  className={styles.wishRemoveBtn}
                  onClick={() => {
                    // Remove from both Redux wishlist and cart savedForLater
                    dispatch(removeFromWishlist(productId));
                    dispatch(removeFromCart(productId));
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Helpers ─────────────────────────────────────────────── */

const FieldRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className={styles.fieldRow}>
    <span className={styles.fieldIcon}>{icon}</span>
    <div>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  </div>
)

const formatDob = (dob: string) => {
  const d = new Date(dob)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default ProfileModal
