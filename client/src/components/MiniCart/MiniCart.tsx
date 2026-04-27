import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { removeItem, type CartItem } from '../../store/slices/cartSlice'
import { formatCurrency } from '../../utils/commerce'
import useProducts from '../../hooks/useProducts'
import styles from './MiniCart.module.css'

const MiniCart = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dispatch = useAppDispatch()
  const items = useAppSelector((state) => state.cart.items)
  const cartItemCount = useAppSelector((state) => state.cart.itemCount)
  const navigate = useNavigate()
  const { allProducts, loadProducts } = useProducts()

  // Load products on mount
  useEffect(() => {
    if (allProducts.length === 0) {
      loadProducts(1, 1000)
    }
  }, [allProducts.length, loadProducts])

  const activeItems = useMemo(
    () => {
      return items
        .map((item: CartItem) => {
          const itemIdStr = String(item.productId)
          // First try to find product by ID match
          let product = allProducts.find((p: any) => {
            const pid = p.id !== undefined ? String(p.id) : null
            const p_id = p._id !== undefined ? String(p._id) : null
            return pid === itemIdStr || p_id === itemIdStr
          })
          
          // If product found, use it; otherwise use stored product details or placeholder
          if (product) {
            return { product, quantity: item.quantity }
          } else if (item.productName || item.productPrice !== undefined) {
            // Use stored product details in cart item
            return {
              product: {
                id: item.productId,
                _id: item.productId,
                name: item.productName || `Product ${item.productId}`,
                price: item.productPrice ?? 0,
                image: item.productImage || '/images/products/placeholder.svg'
              },
              quantity: item.quantity
            }
          } else {
            // Fallback placeholder
            return {
              product: {
                id: item.productId,
                _id: item.productId,
                name: `Product ${item.productId}`,
                price: 0,
                image: '/images/products/placeholder.svg'
              },
              quantity: item.quantity
            }
          }
        })
    },
    [items, allProducts],
  )

  const totalItems = activeItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
  const totalAmount = activeItems.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0)

  const close = () => setIsOpen(false)

  const handleTriggerClick = () => {
    // Mobile: toggle bottom-sheet. Desktop: navigate directly to /cart (hover already shows preview).
    if (window.innerWidth < 768) {
      setIsOpen((prev) => !prev)
    } else {
      navigate('/cart')
    }
  }

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={close} aria-hidden="true" />}

      <div
        className={styles.miniCart}
        onMouseEnter={() => { if (window.innerWidth >= 768) setIsOpen(true) }}
        onMouseLeave={() => { if (window.innerWidth >= 768) setIsOpen(false) }}
        data-testid="mini-cart"
      >
        <button
          type="button"
          className={`${styles.trigger} ${cartItemCount > 0 ? styles.triggerActive : ''}`.trim()}
          onClick={handleTriggerClick}
          aria-label={`Cart, ${cartItemCount} items`}
        >
          🛒
          <span className={styles.cartLabel}>Cart</span>
          {cartItemCount > 0 && (
            <span className={styles.count}>{cartItemCount > 99 ? '99+' : cartItemCount}</span>
          )}
        </button>

        {isOpen && (
          <div className={styles.dropdown} role="dialog" aria-label="Cart preview">
            <div className={styles.dropdownHeader}>
              <span className={styles.dropdownTitle}>
                🛒 My Cart
                {totalItems > 0 && <span className={styles.headerCount}> ({totalItems})</span>}
              </span>
              <button type="button" className={styles.closeBtn} onClick={close} aria-label="Close">✕</button>
            </div>

            {activeItems.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🛍️</span>
                <p className={styles.emptyText}>Your cart is empty</p>
                <Link className={`${styles.btn} ${styles.primary}`.trim()} to="/products" onClick={close}>
                  Shop Now
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.itemList}>
                  {activeItems.slice(0, 5).map(({ product, quantity }: { product: any; quantity: number }) => (
                    <div className={styles.item} key={product.id || product._id}>
                      <Link to={`/products/${product.id || product._id}`} onClick={close}>
                        <img src={product.image} alt={product.name} className={styles.itemImg} loading="lazy" />
                      </Link>
                      <div className={styles.itemInfo}>
                        <Link to={`/products/${product.id || product._id}`} className={styles.itemName} onClick={close}>
                          {product.name}
                        </Link>
                        <p className={styles.itemMeta}>Qty: {quantity} · {formatCurrency(product.price)}</p>
                      </div>
                      <div className={styles.itemRight}>
                        <strong className={styles.itemTotal}>{formatCurrency(product.price * quantity)}</strong>
                        <button type="button" className={styles.removeBtn} onClick={() => dispatch(removeItem(product.id || product._id))} aria-label={`Remove ${product.name}`}>✕</button>
                      </div>
                    </div>
                  ))}
                  {activeItems.length > 5 && (
                    <p className={styles.moreItems}>+{activeItems.length - 5} more items in cart</p>
                  )}
                </div>

                <div className={styles.footer}>
                  {totalAmount > 2499 && (
                    <p className={styles.freeShipping}>🎉 Free delivery on this order!</p>
                  )}
                  <div className={styles.footerRow}>
                    <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                    <strong>{formatCurrency(totalAmount)}</strong>
                  </div>
                  <div className={styles.actions}>
                    <Link className={styles.btn} to="/cart" onClick={close}>View Cart</Link>
                    <Link className={`${styles.btn} ${styles.primary}`.trim()} to="/checkout" onClick={close}>Checkout →</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default MiniCart
