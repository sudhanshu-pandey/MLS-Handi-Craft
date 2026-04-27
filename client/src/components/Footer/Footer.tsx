import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { setCategories } from '../../store/slices/filterSlice'
import styles from './Footer.module.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  const handleCategoryClick = (categoryName: string) => {
    dispatch(setCategories([categoryName]))
    navigate('/products')
  }

  return (
    <footer className={styles.footer}>
      {/* Newsletter Section */}
      <div className={styles.newsletter}>
        <div className={styles.newsletterContent}>
          <div className={styles.newsletterText}>
            <h3>Subscribe to Our Newsletter</h3>
            <p>Get exclusive offers, new arrivals & crafts stories delivered to your inbox</p>
          </div>
          <form className={styles.newsletterForm} onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">{subscribed ? '✓ Subscribed!' : 'Subscribe'}</button>
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className={styles.footerMain}>
        {/* Column 1: About */}
        <div className={styles.column}>
          <h4>About MLS Handicrafts</h4>
          <p>Authentic Indian handicrafts bringing tradition and artistry to your home. Premium quality, handcrafted with love.</p>
          <div className={styles.socialLinks}>
            <a href="#" title="Facebook">f</a>
            <a href="#" title="Instagram">📷</a>
            <a href="#" title="Twitter">𝕏</a>
            <a href="#" title="LinkedIn">in</a>
          </div>
        </div>

        {/* Column 2: Products */}
        <div className={styles.column}>
          <h4>Shop</h4>
          <ul>
            <li><Link to="/products">All Products</Link></li>
            <li><button onClick={() => handleCategoryClick('Brass Handicrafts')}>Brass Handicrafts</button></li>
            <li><button onClick={() => handleCategoryClick('Wooden Handicrafts')}>Wooden Handicrafts</button></li>
            <li><button onClick={() => handleCategoryClick('Marble Handicrafts')}>Marble Handicrafts</button></li>
            <li><button onClick={() => handleCategoryClick('Table Lamps')}>Table Lamps</button></li>
          </ul>
        </div>

        {/* Column 3: Support */}
        <div className={styles.column}>
          <h4>Support</h4>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><a href="/">Shipping Info</a></li>
            <li><a href="/">Returns & Exchange</a></li>
            <li><a href="/">FAQ</a></li>
            <li><a href="/">Track Order</a></li>
          </ul>
        </div>

        {/* Column 4: Company */}
        <div className={styles.column}>
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><a href="/">Privacy Policy</a></li>
            <li><a href="/">Terms & Conditions</a></li>
            <li><a href="/">Shipping Policy</a></li>
            <li><a href="/">Careers</a></li>
          </ul>
        </div>

        {/* Column 5: Contact */}
        <div className={styles.column}>
          <h4>Contact</h4>
          <div className={styles.contactInfo}>
            <p><a href="mailto:info@mlshandicrafts.com">info@mlshandicrafts.com</a></p>
            <p><a href="tel:+918595651616">+91 8595 651 616</a></p>
            <p>Mon - Sat: 10AM - 6PM IST</p>
          </div>
          <div className={styles.payments}>
            <span title="Credit Card">💳</span>
            <span title="Debit Card">🏦</span>
            <span title="UPI">📲</span>
            <span title="Net Banking">🌐</span>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className={styles.trustSection}>
        <div className={styles.trustBadge}>
          <span>🔒 Secure SSL Encrypted</span>
          <span>🚚 Free Shipping on 500+</span>
          <span>↩️ Easy Returns (30 days)</span>
          <span>💵 COD Available</span>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className={styles.footerBottom}>
        <div className={styles.footerBottomContent}>
          <p>&copy; {currentYear} MLS Handicrafts. All rights reserved.</p>
          <div className={styles.bottomLinks}>
            <a href="/">Sitemap</a>
            <span>•</span>
            <a href="/">Privacy</a>
            <span>•</span>
            <a href="/">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
