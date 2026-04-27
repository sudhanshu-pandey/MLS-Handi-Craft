import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { loadCart } from './store/slices/cartSlice'
import { loadWishlist } from './store/slices/wishlistSlice'
import { loadCartFromLocalStorage, loadWishlistFromLocalStorage } from './store/middleware/cartPersistence'
import { ToastProvider } from './context/ToastContext'
import api from './services/api'
import TopHeader from './components/TopHeader/TopHeader.tsx'
import Navbar from './components/Navbar/Navbar.tsx'
import Header from './components/Header/Header.tsx'
import Footer from './components/Footer/Footer.tsx'
import ScrollToTop from './components/ScrollToTop/ScrollToTop.tsx'

const Home = lazy(() => import('./pages/Home.tsx'))
const Products = lazy(() => import('./pages/Products.tsx'))
const ProductDetails = lazy(() => import('./pages/ProductDetails.tsx'))
const Cart = lazy(() => import('./pages/Cart.tsx'))
const About = lazy(() => import('./pages/About.tsx'))
const Contact = lazy(() => import('./pages/Contact.tsx'))
const Donate = lazy(() => import('./pages/Donate.tsx'))
const Checkout = lazy(() => import('./pages/Checkout.tsx'))
const Payment = lazy(() => import('./pages/Payment.tsx'))
const OrderTracking = lazy(() => import('./pages/OrderTracking.tsx'))

function App() {
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector((state) => state.cart.items)

  // Load cart and wishlist from localStorage on app start
  useEffect(() => {
    const cartData = loadCartFromLocalStorage()
    if (cartData.length > 0) {
      dispatch(loadCart(cartData))
    }

    const wishlistData = loadWishlistFromLocalStorage()
    if (wishlistData.length > 0) {
      dispatch(loadWishlist(wishlistData))
    }
  }, [dispatch])

  // Listen for login event and sync cart to database
  useEffect(() => {
    const handleUserLogin = async () => {
      try {
        if (cartItems.length > 0) {
          await api.request('/cart/sync', {
            method: 'POST',
            body: JSON.stringify({ items: cartItems }),
          })
        }
      } catch (error) {
        // Cart sync failed
      }
    }

    window.addEventListener('userLoggedIn', handleUserLogin)
    return () => window.removeEventListener('userLoggedIn', handleUserLogin)
  }, [cartItems])

  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <div className="app">
          <TopHeader />
          <Header />
          <Navbar />
          
          <main>
            <Suspense fallback={<div className="container" style={{ padding: '26px 0' }}>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment/:orderId" element={<Payment />} />
                <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/donate" element={<Donate />} />
              </Routes>
            </Suspense>
          </main>
          
          <Footer />
        </div>
      </Router>
    </ToastProvider>
  )
}

export default App
