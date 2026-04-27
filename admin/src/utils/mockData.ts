import { format, subDays, subMonths } from 'date-fns'
import type { KPIData, RevenueData, CategoryRevenue } from '../types'

export function generateRevenueTrend(days = 30): RevenueData[] {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i)
    const base = 15000 + Math.random() * 25000
    const weekend = [0, 6].includes(date.getDay()) ? 1.4 : 1
    return {
      date: format(date, 'MMM dd'),
      revenue: Math.round(base * weekend),
      orders: Math.round((base * weekend) / 850),
    }
  })
}

export function generateMonthlyTrend(months = 12): RevenueData[] {
  return Array.from({ length: months }, (_, i) => {
    const date = subMonths(new Date(), months - 1 - i)
    const base = 400000 + Math.random() * 300000
    return {
      date: format(date, 'MMM yyyy'),
      revenue: Math.round(base),
      orders: Math.round(base / 800),
    }
  })
}

export function generateCategoryRevenue(): CategoryRevenue[] {
  const categories = [
    { category: 'Pottery', pct: 28 },
    { category: 'Textiles', pct: 22 },
    { category: 'Jewelry', pct: 18 },
    { category: 'Paintings', pct: 15 },
    { category: 'Woodcraft', pct: 10 },
    { category: 'Others', pct: 7 },
  ]
  const total = 2450000
  return categories.map(c => ({
    ...c,
    revenue: Math.round(total * c.pct / 100),
    orders: Math.round(total * c.pct / 100 / 820),
    percentage: c.pct,
  }))
}

export function generateKPIs(): KPIData {
  return {
    totalRevenue: 2456780,
    revenueChange: 12.5,
    totalOrders: 3247,
    ordersChange: 8.2,
    totalUsers: 12849,
    usersChange: 15.3,
    avgOrderValue: 756,
    aovChange: 4.1,
    conversionRate: 3.8,
    conversionChange: 0.5,
    todayOrders: 47,
    monthOrders: 428,
  }
}

export const MOCK_PRODUCTS = [
  { _id: 'p1', name: 'Madhubani Painting', category: 'Paintings', price: 2499, stock: 12, rating: 4.8, reviewCount: 124, images: ['https://picsum.photos/seed/p1/200'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: 'Traditional art', originalPrice: 2999 },
  { _id: 'p2', name: 'Brass Dhokra Figurine', category: 'Metalcraft', price: 1899, stock: 5, rating: 4.6, reviewCount: 89, images: ['https://picsum.photos/seed/p2/200'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: 'Tribal art', originalPrice: 2199 },
  { _id: 'p3', name: 'Kashmiri Shawl', category: 'Textiles', price: 3499, stock: 2, rating: 4.9, reviewCount: 201, images: ['https://picsum.photos/seed/p3/200'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: 'Handwoven', originalPrice: 4299 },
  { _id: 'p4', name: 'Blue Pottery Vase', category: 'Pottery', price: 1249, stock: 18, rating: 4.5, reviewCount: 67, images: ['https://picsum.photos/seed/p4/200'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: 'Jaipur pottery', originalPrice: 1499 },
  { _id: 'p5', name: 'Warli Art Panel', category: 'Paintings', price: 1799, stock: 8, rating: 4.7, reviewCount: 93, images: ['https://picsum.photos/seed/p5/200'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: 'Tribal wall art', originalPrice: 2099 },
  { _id: 'p6', name: 'Channapatna Toy Set', category: 'Woodcraft', price: 899, stock: 25, rating: 4.4, reviewCount: 156, images: ['https://picsum.photos/seed/p6/200'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: 'Karnataka toy', originalPrice: 1099 },
]

export const MOCK_ORDERS = [
  { _id: 'o1', user: { name: 'Rahul Sharma', phone: '9876543210' }, items: [{ name: 'Madhubani Painting', quantity: 1, price: 2499, image: '' }], total: 2499, status: 'delivered', paymentStatus: 'success', paymentMethod: 'razorpay', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), subtotal: 2499, deliveryFee: 0, discount: 0, deliveryAddress: { fullName: 'Rahul Sharma', phone: '9876543210', addressLine1: '123 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' } },
  { _id: 'o2', user: { name: 'Priya Patel', phone: '9874563210' }, items: [{ name: 'Kashmiri Shawl', quantity: 2, price: 3499, image: '' }], total: 6998, status: 'shipped', paymentStatus: 'success', paymentMethod: 'upi', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString(), subtotal: 6998, deliveryFee: 0, discount: 0, deliveryAddress: { fullName: 'Priya Patel', phone: '9874563210', addressLine1: '456 Park St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' } },
  { _id: 'o3', user: { name: 'Amit Kumar', phone: '9823456710' }, items: [{ name: 'Blue Pottery Vase', quantity: 1, price: 1249, image: '' }], total: 1249, status: 'pending', paymentStatus: 'pending', paymentMethod: 'cod', createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString(), subtotal: 1249, deliveryFee: 49, discount: 0, deliveryAddress: { fullName: 'Amit Kumar', phone: '9823456710', addressLine1: '789 Civil Lines', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' } },
  { _id: 'o4', user: { name: 'Sunita Devi', phone: '9712345678' }, items: [{ name: 'Brass Dhokra Figurine', quantity: 3, price: 1899, image: '' }], total: 5697, status: 'confirmed', paymentStatus: 'success', paymentMethod: 'card', createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString(), subtotal: 5697, deliveryFee: 0, discount: 0, deliveryAddress: { fullName: 'Sunita Devi', phone: '9712345678', addressLine1: '12 Gandhi Nagar', city: 'Patna', state: 'Bihar', pincode: '800001' } },
  { _id: 'o5', user: { name: 'Vikram Singh', phone: '9654321087' }, items: [{ name: 'Warli Art Panel', quantity: 1, price: 1799, image: '' }], total: 1799, status: 'cancelled', paymentStatus: 'failed', paymentMethod: 'razorpay', createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString(), subtotal: 1799, deliveryFee: 49, discount: 0, deliveryAddress: { fullName: 'Vikram Singh', phone: '9654321087', addressLine1: '55 Nehru St', city: 'Pune', state: 'Maharashtra', pincode: '411001' } },
]

export const MOCK_USERS = [
  { _id: 'u1', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com', gender: 'male', isBlocked: false, createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'u2', name: 'Priya Patel', phone: '9874563210', email: 'priya@example.com', gender: 'female', isBlocked: false, createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'u3', name: 'Amit Kumar', phone: '9823456710', email: 'amit@example.com', gender: 'male', isBlocked: false, createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'u4', name: 'Sunita Devi', phone: '9712345678', email: 'sunita@example.com', gender: 'female', isBlocked: true, createdAt: new Date(Date.now() - 120 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'u5', name: 'Vikram Singh', phone: '9654321087', email: 'vikram@example.com', gender: 'male', isBlocked: false, createdAt: new Date(Date.now() - 150 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
]
