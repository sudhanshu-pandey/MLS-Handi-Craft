import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/auth/LoginPage'
import ErrorBoundary from './components/common/ErrorBoundary'
import PageSkeleton from './components/common/PageSkeleton'

const Dashboard = lazy(() => import('./pages/dashboard/DashboardPage'))
const ProductsPage = lazy(() => import('./pages/products/ProductsPage'))
const ProductFormPage = lazy(() => import('./pages/products/ProductFormPage'))
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/orders/OrderDetailPage'))
const UsersPage = lazy(() => import('./pages/users/UsersPage'))
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'))
const CategoriesPage = lazy(() => import('./pages/categories/CategoriesPage'))
const BannersPage = lazy(() => import('./pages/banners/BannersPage'))
const CouponsPage = lazy(() => import('./pages/coupons/CouponsPage'))
const SalesMapPage = lazy(() => import('./pages/map/MapPage'))
const CalculatorPage = lazy(() => import('./pages/calculator/CalculatorPage'))

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/edit/:id" element={<ProductFormPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="sales-map" element={<SalesMapPage />} />
            <Route path="calculator" element={<CalculatorPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
