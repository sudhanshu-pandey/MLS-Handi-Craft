import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import styles from './Header.module.css'
import LoginModal from '../LoginModal/LoginModal'
import ProfileModal from '../ProfileModal/ProfileModal'
import SearchBar from '../SearchBar/SearchBar'
import ColorPalette from '../ColorPalette/ColorPalette'
import { useAuth } from '../../context/AuthContext'
import MiniCart from '../MiniCart/MiniCart'

const Header = () => {
  const { isLoggedIn, userProfile, login, logout } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const navRef = useRef<HTMLElement | null>(null)

  const handleLoginSuccess = (identifier: string, provider: 'mobile' | 'google' = 'mobile') => {
    login(provider === 'google' ? '9999999999' : identifier)
    setTimeout(() => setIsLoginOpen(false), 1200)
  }

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
    navigate('/')
  }

  const isActive = (path: string): boolean => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // Close mobile menu on outside click / escape
  useEffect(() => {
    if (!isMenuOpen) return
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (navRef.current && !(navRef.current as HTMLElement).contains(e.target as Node)) setIsMenuOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false) }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => { document.removeEventListener('mousedown', handleOutsideClick); document.removeEventListener('keydown', handleEscape) }
  }, [isMenuOpen])

  const initials = userProfile
    ? (() => {
        const parts = userProfile.name.trim().split(' ')
        return parts.length >= 2
          ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
          : parts[0].slice(0, 2).toUpperCase()
      })()
    : ''

  return (
    <header className={styles.header} role="banner" ref={navRef}>
      {/* Top row: Logo + Search + Actions */}
      <div className={styles.headerContainer}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <a href="/" className={styles.logoLink} title="Go to homepage">
            <img
              src="/images/amazon-store/amazon-store-logo.png"
              alt="MLS HANDICRAFTS"
              className={styles.logoImage}
            />
          </a>
          <div className={styles.brandText}>
            <h1 className={styles.brandName}>🇮🇳 MLS Handicrafts 🇮🇳</h1>
            <p className={styles.brandTagline}>GIFT · DECOR · DIVINE</p>
          </div>
        </div>

        {/* Center: Nav Links + Search */}
        <div className={styles.centerGroup}>
          <button
            type="button"
            className={`${styles.hamburger} ${isMenuOpen ? styles.hamburgerOpen : ''}`.trim()}
            onClick={() => setIsMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span /><span /><span />
          </button>

          <div className={`${styles.menuLinks} ${isMenuOpen ? styles.menuOpen : ''}`.trim()}>
            <Link to="/" className={`${styles.navLink} ${isActive('/') ? styles.activeLink : ''}`} onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/products" className={`${styles.navLink} ${isActive('/products') ? styles.activeLink : ''}`} onClick={() => setIsMenuOpen(false)}>Products</Link>
            <Link to="/about" className={`${styles.navLink} ${isActive('/about') ? styles.activeLink : ''}`} onClick={() => setIsMenuOpen(false)}>About Us</Link>
            <Link to="/contact" className={`${styles.navLink} ${isActive('/contact') ? styles.activeLink : ''}`} onClick={() => setIsMenuOpen(false)}>Contact Us</Link>
            <Link to="/donate" className={`${styles.navLink} ${styles.donateLink} ${isActive('/donate') ? styles.activeDonate : ''}`} onClick={() => setIsMenuOpen(false)}>Donate Us</Link>
          </div>
        </div>

        {/* Right: Search + Cart + Actions */}
        <div className={styles.headerActions}>
          <div className={styles.searchBarInline}>
            <SearchBar isOpen={true} />
          </div>

          <div className={styles.cartLink}>
            <MiniCart />
          </div>

          <div className={styles.themeControl}>
            <ColorPalette />
          </div>

          {isLoggedIn && userProfile ? (
            <div className={styles.authActions}>
              <button type="button" className={styles.profileBtn} onClick={() => setIsProfileOpen(true)} aria-label="Open profile" title={userProfile.name}>
                <span className={styles.avatarInitials}>{initials}</span>
              </button>
              <button type="button" className={styles.logoutBtn} onClick={handleLogout} aria-label="Logout" title="Logout">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.logoutSvg}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <button type="button" className={styles.loginLink} onClick={() => setIsLoginOpen(true)}>Login</button>
          )}
        </div>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={handleLoginSuccess} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
  )
}

export default Header
