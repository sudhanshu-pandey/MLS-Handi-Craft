import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addItem, updateQuantity } from '../store/slices/cartSlice'
import { addItem as addToWishlist, removeItem as removeFromWishlist } from '../store/slices/wishlistSlice'
import useProducts from '../hooks/useProducts'
import useReviews from '../hooks/useReviews'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import LoginModal from '../components/LoginModal/LoginModal'
import {
  calculateDiscountPercent,
  estimateDeliveryByPincode,
  formatCurrency,
  getStockCount,
} from '../utils/commerce'
import styles from './commerce.module.css'
import './ProductDetails.css'
type TabKey = 'description' | 'specifications' | 'reviews' | 'faq'
type PendingAction = 'add' | 'buy' | null

const faqs = [
  { q: 'Is this product handmade?', a: 'Yes, every item is handmade by verified artisan clusters.' },
  { q: 'Is COD available?', a: 'Yes, COD is available for selected pincodes during checkout.' },
  { q: 'Can I return this product?', a: 'Easy 7-day returns for damaged/incorrect items.' },
]

const productImages = (baseImage: string | undefined, additionalImages?: string[]) => {
  // Use AWS images from product data
  const images: string[] = [];
  
  // Add main image
  if (baseImage) {
    images.push(baseImage);
  }
  
  // Add additional images if available
  if (additionalImages && additionalImages.length > 0) {
    images.push(...additionalImages.filter(img => img && img !== baseImage));
  }
  
  // If no images, return placeholder
  if (images.length === 0) {
    images.push('https://via.placeholder.com/500x500?text=Product+Image');
  }
  
  return images;
}

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoggedIn, login } = useAuth()
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector((state) => state.cart.items)
  const wishlistItems = useAppSelector((state) => state.wishlist.items)
  const { loadProductById, getProductById } = useProducts()
  
  // Handle both numeric IDs and MongoDB ObjectId strings
  const productId = id || ''
  const numericId = Number(productId)
  const [product, setProduct] = useState<any>(null)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Get current cart quantity for this product
  const cartQuantity = useMemo(() => {
    const cartItem = cartItems.find(
      (item: any) =>
        item.productId === numericId ||
        item.productId === productId ||
        String(item.productId) === String(productId) ||
        String(item.productId) === String(numericId)
    )
    return cartItem?.quantity ?? 0
  }, [cartItems, numericId, productId])

  // Fetch product by ID on mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Load all products to ensure we have data
        await loadProductById(productId)
        
        // Try to find product - first by numeric ID, then by string ID
        let fetchedProduct = getProductById(numericId)
        
        if (!fetchedProduct) {
          fetchedProduct = getProductById(productId)
        }
        
        setProduct(fetchedProduct)
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }
    
    if (productId) {
      fetchProduct()
    }
  }, [productId, numericId, loadProductById, getProductById])

  // Sync isWishlisted state with Redux wishlist
  useEffect(() => {
    const isInWishlist = wishlistItems.some((item: any) => {
      const itemIdStr = String(item.productId)
      const productIdStr = String(productId)
      return itemIdStr === productIdStr || item.productId === productId
    })
    setIsWishlisted(isInWishlist)
  }, [wishlistItems, productId])

  // Scroll to top when product details page loads
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const [selectedImage, setSelectedImage] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('description')
  const [quantity, setQuantity] = useState(1)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '', images: [] as File[] })
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [openFaq, setOpenFaq] = useState<number[]>([0])
  const [pincodeInput, setPincodeInput] = useState('')
  const [purchasedToast, setPurchasedToast] = useState('')
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [viewerCount, setViewerCount] = useState(() => {
    // Use numeric ID if valid, otherwise use string ID for viewer count generation
    const idForCount = !isNaN(numericId) && numericId > 0 ? numericId : productId
    return 6 + (typeof idForCount === 'string' ? idForCount.charCodeAt(0) : idForCount) % 18
  })
  
  // Use dynamic reviews hook
  const { reviews, loading: reviewsLoading, sortType, setSortType, addReview: addReviewToBackend } = useReviews(productId)

  const debouncedPincode = useDebouncedValue(pincodeInput, 350)
  // Use actual stock from product API if available, otherwise fallback to calculated value
  const stockCount = product?.stock !== undefined ? product.stock : getStockCount(!isNaN(numericId) && numericId > 0 ? numericId : productId)
  const images = product ? productImages(product.image, product.images) : []

  // State for delivery info
  const [deliveryInfo, setDeliveryInfo] = useState({
    isServiceable: false,
    shippingCost: 0,
    estimatedDate: '',
    estimatedDays: 0,
    message: 'Enter a valid pincode',
    city: '',
    state: '',
  })
  const [deliveryLoading, setDeliveryLoading] = useState(false)

  // Fetch delivery estimate from API when pincode changes
  useEffect(() => {
    if (!debouncedPincode || debouncedPincode.length < 6) {
      setDeliveryInfo({
        isServiceable: false,
        shippingCost: 0,
        estimatedDate: '',
        estimatedDays: 0,
        message: 'Enter a valid pincode',
        city: '',
        state: '',
      })
      return
    }

    setDeliveryLoading(true)
    estimateDeliveryByPincode(debouncedPincode).then(info => {
      setDeliveryInfo(info)
      setDeliveryLoading(false)
    }).catch(error => {
      console.error('Error fetching delivery estimate:', error)
      setDeliveryInfo({
        isServiceable: false,
        shippingCost: 0,
        estimatedDate: '',
        estimatedDays: 0,
        message: 'Unable to fetch delivery estimate',
        city: '',
        state: '',
      })
      setDeliveryLoading(false)
    })
  }, [debouncedPincode])

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!product) {
      return
    }
    // Analytics tracking can be added back later
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericId])

  useEffect(() => {
    const buyers = ['Riya from Jaipur', 'Aman from Delhi', 'Sanya from Pune', 'Dev from Kochi']
    const interval = window.setInterval(() => {
      const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)]
      setPurchasedToast(`${randomBuyer} recently purchased this`) 
      window.setTimeout(() => setPurchasedToast(''), 2600)
    }, 7000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    // Simulate viewer count fluctuation
    const interval = window.setInterval(() => {
      setViewerCount((current) => {
        const delta = Math.random() > 0.5 ? 1 : -1
        return Math.max(3, Math.min(40, current + delta))
      })
    }, 4000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const loginRequired = searchParams.get('login') === '1'
    const intent = searchParams.get('intent')

    if (!loginRequired || isLoggedIn) {
      return
    }

    if (intent === 'add' || intent === 'buy') {
      setPendingAction(intent)
    }
    setIsLoginOpen(true)
  }, [isLoggedIn, searchParams])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const setQuantitySafe = (next: number) => {
    setQuantity(Math.max(1, Math.min(stockCount, next)))
  }

  const handleAddToCart = () => {
    if (!product) {
      return
    }
    // Check if out of stock first
    if (stockCount <= 0) {
      setToast('❌ This item is out of stock')
      return
    }
    if (!isLoggedIn) {
      setPendingAction('add')
      setIsLoginOpen(true)
      setToast('Please login to continue')
      return
    }
    // Use product.id if available, otherwise use _id
    const productId = product.id || product._id
    // Calculate total quantity if added
    const totalQuantity = cartQuantity + quantity
    
    // Check stock availability
    if (totalQuantity > stockCount) {
      setToast(`❌ Cannot add! Only ${stockCount} in stock. You already have ${cartQuantity} in cart.`)
      return
    }
    
    // If item already in cart, update the total quantity
    // Otherwise, add it as a new item
    if (cartQuantity > 0) {
      // Item exists - update total quantity
      dispatch(updateQuantity({ productId, quantity: totalQuantity }))
      setToast(`✓ Updated to ${totalQuantity} in cart`)
    } else {
      // Item doesn't exist - add it
      dispatch(addItem({ 
        productId, 
        quantity,
        productName: product.name,
        productPrice: product.price,
        productImage: product.images?.[0] || product.image
      }))
      setToast(`✓ Added ${quantity} to cart`)
    }
    // Reset quantity for next add
    setQuantity(1)
  }

  const handleBuyNow = () => {
    if (!product) {
      return
    }
    // Check if out of stock first
    if (stockCount <= 0) {
      setToast('❌ This item is out of stock')
      return
    }
    if (!isLoggedIn) {
      setPendingAction('buy')
      setIsLoginOpen(true)
      setToast('Please login to continue')
      return
    }
    
    // Check stock availability
    if (quantity > stockCount) {
      setToast(`❌ Cannot buy! Only ${stockCount} in stock available.`)
      return
    }
    
    // Use product.id if available, otherwise use _id
    const productId = product.id || product._id
    dispatch(addItem({ 
      productId, 
      quantity,
      productName: product.name,
      productPrice: product.price,
      productImage: product.images?.[0] || product.image
    }))
    navigate('/checkout')
  }

  const continuePendingAction = (action: PendingAction) => {
    if (!product || !action) {
      return
    }

    // Use product.id if available, otherwise use _id
    const productId = product.id || product._id

    if (action === 'add') {
      // Calculate total quantity if added
      const totalQuantity = cartQuantity + quantity
      
      // Check stock availability
      if (totalQuantity > stockCount) {
        setToast(`❌ Cannot add! Only ${stockCount} in stock. You already have ${cartQuantity} in cart.`)
        return
      }
      
      // If item already in cart, update the total quantity
      if (cartQuantity > 0) {
        dispatch(updateQuantity({ productId, quantity: totalQuantity }))
        setToast(`✓ Updated to ${totalQuantity} in cart`)
      } else {
        dispatch(addItem({ 
          productId, 
          quantity,
          productName: product.name,
          productPrice: product.price,
          productImage: product.images?.[0] || product.image
        }))
        setToast(`✓ Added ${quantity} to cart`)
      }
      setQuantity(1)
      return
    }
    
    // For buy now, check if quantity is available
    if (quantity > stockCount) {
      setToast(`❌ Cannot buy! Only ${stockCount} in stock available.`)
      return
    }
    
    dispatch(addItem({ 
      productId, 
      quantity,
      productName: product.name,
      productPrice: product.price,
      productImage: product.images?.[0] || product.image
    }))
    navigate('/checkout')
  }

  const handleLoginSuccess = (identifier: string, provider: 'mobile' | 'google' = 'mobile') => {
    login(provider === 'google' ? '9999999999' : identifier)
    const action = pendingAction
    setPendingAction(null)
    setIsLoginOpen(false)

    if (searchParams.get('login') === '1') {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('login')
      nextParams.delete('intent')
      setSearchParams(nextParams, { replace: true })
    }

    continuePendingAction(action)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast('Product link copied')
    } catch {
      setToast('Unable to copy link')
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setToast('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setPincodeInput('110001')
      },
      () => setToast('Could not fetch location'),
      { timeout: 6000 },
    )
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const totalFiles = reviewForm.images.length + newFiles.length

    // Max 5 images per review
    if (totalFiles > 5) {
      setToast('Maximum 5 images allowed per review')
      return
    }

    // Validate file sizes (max 5MB each)
    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setToast(`File ${file.name} is too large (max 5MB)`)
        return
      }
      if (!file.type.startsWith('image/')) {
        setToast(`File ${file.name} is not a valid image`)
        return
      }
    }

    // Create previews for new files
    const newPreviews: string[] = []
    let loadedCount = 0

    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        loadedCount++
        if (loadedCount === newFiles.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setReviewForm((current) => ({
      ...current,
      images: [...current.images, ...newFiles],
    }))
  }

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setReviewForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }))
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <h2 style={{ margin: '20px 0' }}>Product not found</h2>
        <Link to="/products" className={styles.primaryBtn}>Back to products</Link>
      </div>
    )
  }

  const discount = calculateDiscountPercent(product.price, product.originalPrice)

  return (
    <div className={`container ${styles.page}`} data-testid="product-detail-page">
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        <Link to="/products">Products</Link>
        <span>›</span>
        <span>{product.category}</span>
        <span>›</span>
        <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{product.name}</span>
      </nav>
      {loading ? (
        <div className={styles.grid}>
          <div className={`${styles.card} ${styles.skeleton}`} style={{ minHeight: 520 }} />
          <div className={`${styles.card} ${styles.skeleton}`} style={{ minHeight: 520 }} />
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            <section className={styles.card}>
              <div className={styles.gallery}>
                <div className={styles.thumbs}>
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={`${styles.thumbBtn} ${selectedImage === index ? styles.activeThumb : ''}`.trim()}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img 
                        src={image} 
                        alt={`${product.name} thumbnail ${index + 1}`} 
                        loading="lazy"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = 'https://via.placeholder.com/80x80?text=Image';
                        }}
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.mainImage}
                  onClick={() => setIsFullscreen(true)}
                  data-testid="pdp-main-image"
                >
                  <img 
                    src={images[selectedImage]} 
                    alt={product.name} 
                    loading="lazy"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'https://via.placeholder.com/500x500?text=Product+Image';
                    }}
                  />
                  <span className={styles.zoomHint}>Zoom + Fullscreen</span>
                </button>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.info}>
                <h1 className={styles.title}>{product.name}</h1>

                {/* Stock Status - Prominent Display */}
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: stockCount === 0 ? '#ffcdd2' : stockCount <= 3 ? '#ffebee' : '#e8f5e9',
                  border: `2px solid ${stockCount === 0 ? '#d32f2f' : stockCount <= 3 ? '#ef5350' : '#66bb6a'}`,
                  borderRadius: '6px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '700',
                    color: stockCount === 0 ? '#b71c1c' : stockCount <= 3 ? '#c62828' : '#2e7d32'
                  }}>
                    {stockCount === 0 ? '📦 OUT OF STOCK' : stockCount <= 3 ? `⚠️ Only ${stockCount} left in stock!` : `✓ ${stockCount} in stock`}
                  </p>
                  {stockCount === 0 && (
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '12px',
                      color: '#b71c1c',
                      fontWeight: '500'
                    }}>
                      Currently unavailable. Check back later
                    </p>
                  )}
                  {stockCount > 0 && stockCount <= 3 && (
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '12px',
                      color: '#c62828',
                      fontWeight: '500'
                    }}>
                      Hurry! Limited availability
                    </p>
                  )}
                </div>

                <div className={styles.priceRow}>
                  <span className={styles.price}>{formatCurrency(product.price)}</span>
                  {product.originalPrice && (
                    <span className={styles.strike}>{formatCurrency(product.originalPrice)}</span>
                  )}
                  {discount > 0 && <span className={styles.badge}>{discount}% OFF</span>}
                  {product.sale && <span className={styles.badge}>Festival Offer</span>}
                </div>

                <div className={styles.row}>
                  <p className={styles.rating}>⭐ {product.rating ?? 4.6} ({product.reviews ?? 128} reviews)</p>
                </div>

                {cartQuantity > 0 && (
                  <div className={styles.row} style={{ padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '4px', border: '1px solid #4caf50', marginBottom: '16px' }}>
                    <span style={{ color: '#2e7d32', fontWeight: 600, fontSize: '14px' }}>
                      ✓ {cartQuantity} {cartQuantity === 1 ? 'item' : 'items'} in your cart
                    </span>
                  </div>
                )}

                <div className={styles.row}>
                  <span className={styles.viewerPill}>
                    <span className={styles.viewerDot} />
                    {viewerCount} people viewing this right now
                  </span>
                  {stockCount <= 5 && (
                    <span className={styles.stockLow} style={{ fontSize: 13 }}>🔥 Selling fast</span>
                  )}
                </div>

                <div className={styles.deliveryBox}>
                  <p style={{ color: 'var(--text-dark)', fontWeight: 700 }}>Delivery estimator</p>
                  <div className={styles.inlineForm}>
                    <input
                      className={styles.input}
                      value={pincodeInput}
                      onChange={(event) => setPincodeInput(event.target.value)}
                      placeholder="Enter pincode"
                      inputMode="numeric"
                      maxLength={6}
                      data-testid="pincode-input"
                    />
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setToast('Pincode updated')}
                    >
                      Save
                    </button>
                  </div>
                  <button type="button" className={styles.ghostBtn} onClick={detectLocation}>Use my location</button>
                  {deliveryLoading ? (
                    <p style={{ color: '#1e88e5', fontSize: '14px' }}>
                      ⏳ Fetching delivery details...
                    </p>
                  ) : deliveryInfo.isServiceable ? (
                    <div>
                      <p style={{ color: 'var(--text-dark)' }}>
                        Arrives by <strong>{deliveryInfo.estimatedDate}</strong> • {deliveryInfo.message}
                      </p>
                      {deliveryInfo.city && (
                        <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>
                          📍 {deliveryInfo.city}, {deliveryInfo.state}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p>{deliveryInfo.message}</p>
                  )}
                </div>

                <div className={styles.row}>
                  <div className={styles.qtyWrap} data-testid="quantity-selector">
                    <button type="button" className={styles.qtyBtn} onClick={() => setQuantitySafe(quantity - 1)}>-</button>
                    <span className={styles.qtyVal} data-testid="quantity-value">{quantity}</span>
                    <button type="button" className={styles.qtyBtn} onClick={() => setQuantitySafe(quantity + 1)}>+</button>
                  </div>
                  <span className={styles.stockLow}>Limited Stock</span>
                </div>

                <div className={styles.actions}>
                  <button 
                    type="button" 
                    className={styles.actionBtn} 
                    onClick={handleAddToCart} 
                    disabled={stockCount === 0}
                    style={stockCount === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    data-testid="add-to-cart-btn"
                  >
                    {stockCount === 0 ? '📦 Out of Stock' : 'Add to Cart'}
                  </button>
                  <button 
                    type="button" 
                    className={styles.secondaryBtn} 
                    onClick={handleBuyNow}
                    disabled={stockCount === 0}
                    style={stockCount === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    data-testid="buy-now-btn"
                  >
                    {stockCount === 0 ? 'Out of Stock' : 'Buy Now'}
                  </button>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={() => {
                      const productIdToWishlist = product.id || product._id || productId
                      if (isWishlisted) {
                        dispatch(removeFromWishlist(productIdToWishlist))
                        setToast('Removed from wishlist')
                      } else {
                        dispatch(addToWishlist(productIdToWishlist))
                        setToast('Added to wishlist')
                      }
                    }}
                  >
                    {isWishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
                  </button>
                  <button type="button" className={styles.ghostBtn} onClick={handleShare}>Share</button>
                </div>

                <div className={styles.trustRow}>
                  <div className={styles.trustItem}>🔐 Secure Payment</div>
                  <div className={styles.trustItem}>↩️ Easy 7-day Return</div>
                  <div className={styles.trustItem}>💵 COD Available</div>
                  <div className={styles.trustItem}>✅ Authentic Handicraft</div>
                </div>
              </div>
            </section>
          </div>

          <section className={styles.tabsSection}>
            <div className={styles.tabs}>
              {(['description', 'specifications', 'reviews', 'faq'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`.trim()}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className={`${styles.card} ${styles.panel}`}>
              {activeTab === 'description' && (
                <>
                  <p>{product.description ?? 'Premium artisan-crafted product designed for lasting elegance.'}</p>
                  <div className={styles.expand}>
                    <button type="button" className={styles.expandHead}>
                      Material & Craft
                      <span>✓</span>
                    </button>
                    <div className={styles.expandBody}>Handmade by rural artisans using traditional techniques.</div>
                  </div>
                </>
              )}

              {activeTab === 'specifications' && (
                <>
                  {product?.specifications ? (
                    <>
                      {product.specifications.dimension && (
                        <div className={styles.expand}>
                          <button type="button" className={styles.expandHead}>
                            <span>Dimension</span>
                            <span>▾</span>
                          </button>
                          <div className={styles.expandBody}>{product.specifications.dimension}</div>
                        </div>
                      )}
                      {product.specifications.weight && (
                        <div className={styles.expand}>
                          <button type="button" className={styles.expandHead}>
                            <span>Weight</span>
                            <span>▾</span>
                          </button>
                          <div className={styles.expandBody}>{product.specifications.weight}</div>
                        </div>
                      )}
                      {product.specifications.category && (
                        <div className={styles.expand}>
                          <button type="button" className={styles.expandHead}>
                            <span>Category</span>
                            <span>▾</span>
                          </button>
                          <div className={styles.expandBody}>{product.specifications.category}</div>
                        </div>
                      )}
                      {product.specifications.countryOfOrigin && (
                        <div className={styles.expand}>
                          <button type="button" className={styles.expandHead}>
                            <span>Country of origin</span>
                            <span>▾</span>
                          </button>
                          <div className={styles.expandBody}>{product.specifications.countryOfOrigin}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p>No specifications available for this product.</p>
                  )}
                </>
              )}

              {activeTab === 'reviews' && (
                <>
                  {/* Rating Breakdown */}
                  <div className={styles.reviewBreakdown}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length
                      const percent = reviews.length ? Math.round((count / reviews.length) * 100) : 0
                      return (
                        <div className={styles.breakRow} key={star}>
                          <span>{star}★</span>
                          <div className={styles.bar}><div className={styles.fill} style={{ width: `${percent}%` }} /></div>
                          <span>{count}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Reviews Header with Sort */}
                  <div className={styles.row}>
                    <strong style={{ color: 'var(--text-dark)' }}>Customer reviews</strong>
                    <select 
                      value={sortType} 
                      onChange={(event) => setSortType(event.target.value as 'latest' | 'highest')} 
                      className={styles.input} 
                      style={{ maxWidth: 220 }}
                    >
                      <option value="latest">Sort: Latest</option>
                      <option value="highest">Sort: Highest rating</option>
                    </select>
                  </div>

                  {/* Reviews Loading State */}
                  {reviewsLoading && <p style={{ textAlign: 'center', color: '#999' }}>Loading reviews...</p>}

                  {/* Reviews List */}
                  {!reviewsLoading && reviews.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>No reviews yet. Be the first to review!</p>
                  ) : (
                    reviews.map((review) => (
                      <article className={styles.reviewItem} key={review._id}>
                        <div className={styles.row}>
                          <strong style={{ color: 'var(--text-dark)' }}>{review.name}</strong>
                          <span>{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p style={{ color: 'var(--text-dark)' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                        <p>{review.comment}</p>
                        {review.images && review.images.length > 0 && (
                          <div className={styles.reviewImages}>
                            {review.images.map((img, idx) => (
                              <img 
                                key={`${review._id}-${idx}`} 
                                src={img} 
                                alt="review" 
                                className={styles.reviewImage} 
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </article>
                    ))
                  )}

                  {/* Add Review Form */}
                  <form 
                    className={styles.softCard} 
                    style={{ padding: 12, display: 'grid', gap: 8 }} 
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!reviewForm.name.trim() || !reviewForm.comment.trim()) {
                        setToast('Please complete review details')
                        return
                      }
                      try {
                        // Convert images to base64
                        const imageUrls: string[] = []
                        for (const file of reviewForm.images) {
                          const base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader()
                            reader.onload = () => resolve(reader.result as string)
                            reader.readAsDataURL(file)
                          })
                          imageUrls.push(base64)
                        }

                        await addReviewToBackend({
                          rating: reviewForm.rating,
                          comment: reviewForm.comment.trim(),
                          name: reviewForm.name.trim(),
                          images: imageUrls,
                        })
                        setReviewForm({ name: '', rating: 5, comment: '', images: [] })
                        setImagePreviews([])
                        setToast('Review submitted successfully!')
                      } catch (err) {
                        setToast('Failed to submit review')
                      }
                    }}
                  >
                    <strong style={{ color: 'var(--text-dark)' }}>Add review</strong>
                    <input 
                      className={styles.input} 
                      placeholder="Your name" 
                      value={reviewForm.name} 
                      onChange={(event) => setReviewForm((current) => ({ ...current, name: event.target.value }))} 
                      required
                    />
                    <select 
                      className={styles.input} 
                      value={reviewForm.rating} 
                      onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                    >
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Stars</option>)}
                    </select>
                    <textarea 
                      className={styles.input} 
                      rows={3} 
                      placeholder="Write your review" 
                      value={reviewForm.comment} 
                      onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                      minLength={10}
                      required
                    />
                    
                    {/* Image Upload Section */}
                    <div style={{ display: 'grid', gap: 8 }}>
                      <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)' }}>
                        Add Photos/Videos (Optional)
                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400, marginTop: 4 }}>
                          Max 5 images, 5MB each
                        </span>
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      />
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: 8,
                      }}>
                        {imagePreviews.map((preview, index) => (
                          <div
                            key={`${index}-preview`}
                            style={{
                              position: 'relative',
                              width: '100%',
                              paddingBottom: '100%',
                              overflow: 'hidden',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <img
                              src={preview}
                              alt={`review preview ${index + 1}`}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                background: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                width: '24px',
                                height: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                padding: 0,
                                margin: '4px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button type="submit" className={styles.primaryBtn}>Submit Review</button>
                  </form>
                </>
              )}

              {activeTab === 'faq' && (
                <>
                  {faqs.map((item, index) => {
                    const opened = openFaq.includes(index)
                    return (
                      <div key={item.q} className={styles.expand}>
                        <button
                          type="button"
                          className={styles.expandHead}
                          onClick={() => setOpenFaq((current) => (opened ? current.filter((entry) => entry !== index) : [...current, index]))}
                        >
                          <span>{item.q}</span>
                          <span>{opened ? '−' : '+'}</span>
                        </button>
                        {opened && <div className={styles.expandBody}>{item.a}</div>}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </section>       

          <div className={styles.stickyBuy}>
            <div>
              <strong style={{ color: 'var(--text-dark)' }}>{formatCurrency(product.price)}</strong>
              <p style={{ margin: 0 }}>{stockCount <= 3 ? `Only ${stockCount} left in stock` : 'In stock'}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={styles.secondaryBtn} onClick={handleAddToCart}>Add to Cart</button>
              <button type="button" className={styles.primaryBtn} onClick={handleBuyNow}>Buy Now</button>
            </div>
          </div>
        </>
      )}

      {isFullscreen && (
        <button type="button" className={styles.modal} onClick={() => setIsFullscreen(false)}>
          <div className={styles.modalContent}>
            <img 
              src={images[selectedImage]} 
              alt="Fullscreen preview" 
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = 'https://via.placeholder.com/800x800?text=Product+Image';
              }}
            />
          </div>
        </button>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
      {purchasedToast && <div className={styles.popup}>{purchasedToast}</div>}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false)
          setPendingAction(null)
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}

export default ProductDetails
