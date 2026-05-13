import { useState, useEffect } from 'react'
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

  useEffect(() => {
    // Animation runs automatically
  }, [])

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
      {/* Animated Background Elements */}
      <div className={styles.animatedBg}>
        <div className={styles.waveSvg}></div>
        {/* Floating product emojis */}
        <div className={styles.floatingEmojis}>
          <div className={`${styles.floatingEmoji} ${styles.emoji1}`}>🪔</div>
          <div className={`${styles.floatingEmoji} ${styles.emoji2}`}>⚱️</div>
          <div className={`${styles.floatingEmoji} ${styles.emoji3}`}>🏺</div>
          <div className={`${styles.floatingEmoji} ${styles.emoji4}`}>👑</div>
          <div className={`${styles.floatingEmoji} ${styles.emoji5}`}>🧵</div>
          <div className={`${styles.floatingEmoji} ${styles.emoji6}`}>🪔</div>
          <div className={`${styles.floatingEmoji} ${styles.emoji7}`}>🎀</div>
          <div className={`${styles.floatingEmoji} ${styles.emoji8}`}>✨</div>
          <div className={`${styles.floatingEmoji} ${styles.emoji9}`}>💎</div>
          <div className={`${styles.floatingEmoji} ${styles.emoji10}`}>🌿</div>
        </div>
      </div>

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
          <div className={styles.columnHeader}>
            <span className={styles.decorativeEmoji}>🌈</span>
            <h4>About MLS Handicrafts</h4>
          </div>
          <p>Authentic Indian handicrafts bringing tradition and artistry to your home. Premium quality, handcrafted with love.</p>
          <div className={styles.socialLinks}>
            <a href="#" title="Facebook">f</a>
            <a href="#" title="Instagram">📷</a>
            <a href="#" title="Twitter">𝕏</a>
            <a href="#" title="LinkedIn">in</a>
          </div>
        </div>

        {/* Column 2: Explore */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.decorativeEmoji}>🛍️</span>
            <h4>Explore</h4>
          </div>
          <ul>
            <li><Link to="/products">Home</Link></li>
            <li><button onClick={() => handleCategoryClick('Metalcraft')}>Metalcraft</button></li>
            <li><button onClick={() => handleCategoryClick('Pottery')}>Pottery</button></li>
            <li><button onClick={() => handleCategoryClick('Textiles')}>Textiles</button></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Column 3: Quick Links */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.decorativeEmoji}>⚡</span>
            <h4>Quick Links</h4>
          </div>
          <ul>
            <li><a href="/">Contact Information</a></li>
            <li><a href="/">Privacy Policy</a></li>
            <li><a href="/">Refund Policy</a></li>
            <li><a href="/">Terms of Service</a></li>
            <li><a href="/">Shipping Policy</a></li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.decorativeEmoji}>💬</span>
            <h4>Support</h4>
          </div>
          <ul>
            <li><a href="/">Shipping Info</a></li>
            <li><a href="/">Returns & Exchange</a></li>
            <li><a href="/">FAQ</a></li>
            <li><a href="/">Track Order</a></li>
            <li><a href="/">Size Guide</a></li>
          </ul>
        </div>

        {/* Column 5: Contact & Subscribe */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.decorativeEmoji}>📮</span>
            <h4>Contact & Info</h4>
          </div>
          <div className={styles.contactInfo}>
            <p><a href="mailto:info@mlshandicrafts.com">info@mlshandicrafts.com</a></p>
            <p><a href="tel:+918595651616">+91 8595 651 616</a></p>
            <p>Mon - Sat: 10AM - 6PM IST</p>
          </div>
          <div className={styles.payments}>
            <span title="Visa">💳</span>
            <span title="Mastercard">💳</span>
            <span title="UPI">📲</span>
            <span title="Google Pay">�</span>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className={styles.trustSection}>
        <div className={styles.trustBadge}>
          <span>🔒 100% SECURE PAYMENTS</span>
        </div>
        <div className={styles.paymentMethods}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 64'%3E%3Crect fill='%23FFF' width='100' height='64' rx='4'/%3E%3C/svg%3E" alt="Visa" title="Visa" />
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 64'%3E%3Crect fill='%23FFF' width='100' height='64' rx='4'/%3E%3C/svg%3E" alt="Mastercard" title="Mastercard" />
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 64'%3E%3Crect fill='%23FFF' width='100' height='64' rx='4'/%3E%3C/svg%3E" alt="PayPal" title="PayPal" />
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 64'%3E%3Crect fill='%23FFF' width='100' height='64' rx='4'/%3E%3C/svg%3E" alt="Google Pay" title="Google Pay" />
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
