import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { setCategories } from '../../store/slices/filterSlice'
import useCategories from '../../hooks/useCategories'
import styles from './Footer.module.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { categories } = useCategories()
  const topCategories = categories.length
    ? categories.slice(0, 3)
    : [
        { _id: 'fallback-metalcraft', name: 'Metalcraft', slug: 'metalcraft', image: '', active: true },
        { _id: 'fallback-pottery', name: 'Pottery', slug: 'pottery', image: '', active: true },
        { _id: 'fallback-textiles', name: 'Textiles', slug: 'textiles', image: '', active: true },
      ]

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
    navigate('/products')
  }

  return (
    <>
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
            {topCategories.map((category) => (
              <li key={category._id}>
                <Link to="/products" onClick={() => handleCategoryClick(category.name)}>
                  {category.name}
                </Link>
              </li>
            ))}
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
          <a
            className={styles.whatsappLink}
            href="https://wa.me/918595651616?text=Hello%20MLS%20Handicrafts%2C%20I%20would%20like%20to%20know%20more%20about%20your%20products."
            target="_blank"
            rel="noreferrer noopener"
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <span>💬</span>
          </a>
        </div>
      </div>
    </footer>
  </>
  )
}

export default Footer
