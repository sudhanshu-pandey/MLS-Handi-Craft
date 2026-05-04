import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAppDispatch } from './store/hooks'
import { loadWishlist } from './store/slices/wishlistSlice'
import { loadWishlistFromLocalStorage } from './store/middleware/cartPersistence'
import { ToastProvider } from './context/ToastContext'
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

  // Load wishlist from localStorage on app start
  // Cart is now loaded from database on login only
  useEffect(() => {
    const wishlistData = loadWishlistFromLocalStorage()
    if (wishlistData.length > 0) {
      dispatch(loadWishlist(wishlistData))
    }
  }, [dispatch])

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
