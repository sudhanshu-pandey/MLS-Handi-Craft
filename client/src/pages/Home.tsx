import { useEffect, useState } from 'react'
import CategoryGrid from '../components/CategoryGrid/CategoryGrid'
import BannerCarousel from '../components/BannerCarousel/BannerCarousel'
import BenefitsSection from '../components/BenefitsSection/BenefitsSection'
import TestimonialCarousel from '../components/TestimonialCarousel/TestimonialCarousel'
import ProductCard from '../components/ProductCard/ProductCard'
import useProducts from '../hooks/useProducts'
import useCategories from '../hooks/useCategories'
import styles from './pages.module.css'
import './Home.css'

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  image: string
  rating: number
}

const Home = () => {
  const { loadProducts, getFirstProducts, loading, error } = useProducts()
  const { categories } = useCategories()
  const products = getFirstProducts(6)

  // Fetch products on component mount
  useEffect(() => {
    loadProducts(1, 20)
  }, [loadProducts])

  const [benefits] = useState([
    {
      id: 1,
      icon: '🔒',
      title: '100% Secure',
      description: 'Payment Protection',
    },
    {
      id: 2,
      icon: '💵',
      title: 'Cash On Delivery',
      description: 'Get First, Pay Later',
    },
    {
      id: 3,
      icon: '↩️',
      title: 'Easy Return',
      description: 'Easy Return & Refund',
    },
    {
      id: 4,
      icon: '🚚',
      title: 'Free Shipping',
      description: 'Free Delivery Across India',
    },
  ])

  const [testimonials] = useState<Testimonial[]>([
    {
      id: 1,
      name: 'Hari Krishna',
      role: 'Business Man',
      content:
        'Good collection of Indian made handicrafts and really great prices. No need to go far off places like Janpath if looking to gift Indian handicrafts/souvenirs.',
      image: '/images/avatars/avatar-hk.svg',
      rating: 5,
    },
    {
      id: 2,
      name: 'Priya Sharma',
      role: 'Interior Designer',
      content:
        'Excellent quality products with authentic craftsmanship. The customer service is outstanding and delivery is always on time.',
      image: '/images/avatars/avatar-ps.svg',
      rating: 5,
    },
    {
      id: 3,
      name: 'Rajesh Patel',
      role: 'Entrepreneur',
      content:
        'Best place to buy traditional handicrafts. The prices are competitive and the products are exactly as pictured.',
      image: '/images/avatars/avatar-rp.svg',
      rating: 5,
    },
  ])

  return (
    <div>
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Categories Section */}
      <CategoryGrid categories={categories} />

      {/* New Arrivals Section */}
      <section className={styles.arrivals}>
        <div className="container">
          <h2 className={styles.sectionTitle}>New Arrivals</h2>
          
          {error && (
            <div style={{ padding: '20px', color: '#d32f2f', textAlign: 'center', marginBottom: '20px' }}>
              ❌ Failed to load products: {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              ⏳ Loading products...
            </div>
          ) : (
            <>
              <div className={styles.productsGrid}>
                {products.map((product: any) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={{
                      id: product.id,
                      _id: product._id,
                      name: product.name,
                      price: product.price,
                      originalPrice: product.originalPrice,
                      image: product.image,
                      category: product.category,
                      sale: product.sale,
                      stock: product.stock,
                      rating: product.rating,
                      reviewCount: product.reviewCount
                    }}
                  />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
                <a href="/products" className="btn btn-primary">
                  View All Products
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <BenefitsSection benefits={benefits} />

      {/* Testimonials Section */}
      <TestimonialCarousel testimonials={testimonials} />
    </div>
  )
}

export default Home
