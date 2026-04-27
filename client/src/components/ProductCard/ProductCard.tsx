import { memo } from 'react'
import { Link } from 'react-router-dom'
import QuantityControl from '../QuantityControl/QuantityControl'
import styles from './ProductCard.module.css'

interface Product {
  id?: number
  _id?: string | number
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  sale?: boolean
  stock?: number
  rating?: number
  reviewCount?: number
}

interface ProductCardProps {
  product: Product
}

const ProductCard = memo(({ product }: ProductCardProps) => {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0
  
  // Use numeric id if available, otherwise use MongoDB _id as string
  const productId = product.id || (typeof product._id === 'string' ? product._id : String(product._id))
  const navigateId = product.id || product._id

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <Link to={`/products/${navigateId}`} aria-label={`View ${product.name}`}>
          <img 
            src={product.image} 
            alt={product.name} 
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = 'https://via.placeholder.com/300x300?text=Product+Image';
            }}
          />
        </Link>
        {product.sale && <span className={styles.saleBadge}>SALE!</span>}
        <span className={styles.category}>{product.category}</span>
      </div>
      <div className={styles.content}>
        <h3>{product.name}</h3>
        <div className={styles.priceSection}>
          {product.originalPrice && (
            <>
              <span className={styles.originalPrice}>
                ₹{product.originalPrice.toLocaleString()}
              </span>
              <span className={styles.discount}>-{discount}%</span>
            </>
          )}
          <p className={styles.price}>₹{product.price.toLocaleString()}</p>
          <p className={styles.gst}>inc. GST</p>
        </div>
        <div className={styles.rating}>
          <span className={styles.stars}>
            {'⭐'.repeat(Math.round(product.rating || 0))}
            {'☆'.repeat(5 - Math.round(product.rating || 0))}
          </span>
          <span className={styles.ratingText}>
            {product.rating ? product.rating.toFixed(1) : '0'} ({product.reviewCount || 0} reviews)
          </span>
        </div>
        <div className={styles.buttonGroup}>
          <QuantityControl 
            productId={productId}
            stock={product.stock}
            productName={product.name}
            productPrice={product.price}
            productImage={product.image}
          />
          <Link to={`/products/${navigateId}`} className={styles.viewButton}>
            View
          </Link>
        </div>
      </div>
    </div>
  )
})

ProductCard.displayName = 'ProductCard'

export default ProductCard
