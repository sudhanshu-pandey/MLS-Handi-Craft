import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import KPICard from '../../components/common/KPICard'
import PageHeader from '../../components/common/PageHeader'
import { OrderStatusBadge } from '../../components/common/StatusBadge'
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters'
import { analyticsService } from '../../services/analyticsService'
import { orderService } from '../../services/orderService'
import { productService } from '../../services/productService'
import { useStockNotifications, LOW_STOCK_THRESHOLD } from '../../hooks/useStockNotifications'
import {
  generateKPIs,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
} from '../../utils/mockData'
import type { KPIData, RevenueData, CategoryRevenue, Order, Product } from '../../types'

const PERIOD_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
]

const PIE_COLORS = ['#f17010', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.dataKey === 'revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const EMPTY_KPI_DATA: KPIData = {
  totalRevenue: 0,
  revenueChange: 0,
  totalOrders: 0,
  ordersChange: 0,
  totalUsers: 0,
  usersChange: 0,
  avgOrderValue: 0,
  aovChange: 0,
  conversionRate: 0,
  conversionChange: 0,
  todayOrders: 0,
  monthOrders: 0,
}

export default function DashboardPage() {
  const [period, setPeriod] = useState(30)
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')
  const [isLoading, setIsLoading] = useState(true)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const [kpis, setKpis] = useState<KPIData>(EMPTY_KPI_DATA)
  const [revenueTrend, setRevenueTrend] = useState<RevenueData[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<RevenueData[]>([])
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const lowStockProducts = useMemo(
    () => products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock),
    [products],
  )
  const outOfStockCount = lowStockProducts.filter(p => p.stock === 0).length
  const actualLowCount = lowStockProducts.filter(p => p.stock > 0).length

  useStockNotifications(products)
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [orders]
  )

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [kpiRes, revenueRes, monthlyRes, categoryRes, orderRes, productRes] = await Promise.all([
        analyticsService.getKPIs(),
        analyticsService.getRevenueTrend('daily', period),
        analyticsService.getRevenueTrend('monthly', 365),
        analyticsService.getCategoryRevenue(),
        orderService.getAll({ limit: 500 }),
        productService.getAll({ limit: 500 }),
      ])

      setKpis(kpiRes.data || EMPTY_KPI_DATA)
      setRevenueTrend(revenueRes.data?.data || [])
      setMonthlyTrend((monthlyRes.data?.data || []).slice(-12))
      setCategoryRevenue(categoryRes.data?.data || [])
      setOrders(orderRes.data?.orders || [])
      setProducts(productRes.data?.products || [])
    } catch {
      // No fallback to mock data - show empty state instead
      setKpis(EMPTY_KPI_DATA)
      setRevenueTrend([])
      setMonthlyTrend([])
      setCategoryRevenue([])
      setOrders([])
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Loading dashboard data</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the latest reports and analytics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
        actions={
          <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
            <p>Last updated: {new Date().toLocaleTimeString('en-IN')}</p>
          </div>
        }
      />

      {/* Stock Alert Banners */}
      {!bannerDismissed && (outOfStockCount > 0 || actualLowCount > 0) && (
        <div className="space-y-2">
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="flex-1 min-w-0 text-sm text-red-700 dark:text-red-300">
                <span className="font-semibold">
                  {outOfStockCount} product{outOfStockCount > 1 ? 's' : ''} out of stock
                </span>
                {' — '}
                {lowStockProducts
                  .filter(p => p.stock === 0)
                  .slice(0, 3)
                  .map(p => p.name)
                  .join(', ')}
                {outOfStockCount > 3 ? ` +${outOfStockCount - 3} more` : ''}
              </p>
              <a
                href="/products"
                className="text-xs font-semibold text-red-700 dark:text-red-300 hover:underline whitespace-nowrap"
              >
                Restock now →
              </a>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-red-400 hover:text-red-600 flex-shrink-0"
                aria-label="Dismiss alert"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          {actualLowCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <p className="flex-1 min-w-0 text-sm text-yellow-700 dark:text-yellow-300">
                <span className="font-semibold">
                  {actualLowCount} product{actualLowCount > 1 ? 's are' : ' is'} running low
                </span>
                {' — '}
                {lowStockProducts
                  .filter(p => p.stock > 0)
                  .slice(0, 3)
                  .map(p => `${p.name} (${p.stock} left)`)
                  .join(', ')}
                {actualLowCount > 3 ? ` +${actualLowCount - 3} more` : ''}
              </p>
              <a
                href="/products"
                className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 hover:underline whitespace-nowrap"
              >
                View →
              </a>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          change={kpis.revenueChange}
          iconBg="bg-primary-100 dark:bg-primary-900/30"
          icon={<CurrencyRupeeIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
          subtitle={`${kpis.monthOrders} orders this month`}
        />
        <KPICard
          title="Total Orders"
          value={formatNumber(kpis.totalOrders)}
          change={kpis.ordersChange}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          icon={<ShoppingCartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          subtitle={`${kpis.todayOrders} today`}
        />
        <KPICard
          title="Active Users"
          value={formatNumber(kpis.totalUsers)}
          change={kpis.usersChange}
          iconBg="bg-green-100 dark:bg-green-900/30"
          icon={<UsersIcon className="w-5 h-5 text-green-600 dark:text-green-400" />}
          subtitle="Total registered"
        />
        <KPICard
          title="Avg Order Value"
          value={formatCurrency(kpis.avgOrderValue)}
          change={kpis.aovChange}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          icon={<ArrowTrendingUpIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          subtitle="Per transaction"
        />
        <KPICard
          title="Conversion Rate"
          value={`${kpis.conversionRate}%`}
          change={kpis.conversionChange}
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          icon={<ClipboardDocumentListIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          subtitle="Visitor to buyer"
        />
      </div>

      {/* Revenue Chart + Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Daily revenue over selected period</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${period === opt.value ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                {(['area', 'bar'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${chartType === type ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            {chartType === 'area' ? (
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f17010" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f17010" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} interval={Math.floor(revenueTrend.length / 6)} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f17010" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            ) : (
              <BarChart data={revenueTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} interval={Math.floor(revenueTrend.length / 6)} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#f17010" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Category Revenue Pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Revenue by Category</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">This month breakdown</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryRevenue}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="revenue"
              >
                {categoryRevenue.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryRevenue.map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-gray-600 dark:text-gray-400">{cat.category}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend Bar */}
      <div className="card p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Performance</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Last 12 months revenue & orders comparison</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} />
            <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
            <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar yAxisId="rev" dataKey="revenue" name="Revenue" fill="#f17010" radius={[3, 3, 0, 0]} opacity={0.9} />
            <Bar yAxisId="ord" dataKey="orders" name="Orders" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Latest 5 orders</p>
            </div>
            <a href="/orders" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="table-th">Order ID</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentOrders.map(order => (
                  <tr key={order._id} className="table-row">
                    <td className="table-td font-mono text-xs text-primary-600">#{order._id.slice(-6).toUpperCase()}</td>
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{(order.user as any)?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{(order.user as any)?.phone}</p>
                      </div>
                    </td>
                    <td className="table-td font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                    <td className="table-td"><OrderStatusBadge status={order.status as any} /></td>
                    <td className="table-td text-xs text-gray-500">{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Low Stock</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{lowStockProducts.length} items need restocking</p>
              </div>
            </div>
            <a href="/products" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View →</a>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">All products well stocked</p>
            ) : (
              lowStockProducts.map(product => (
                <div key={product._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {product.stock === 0 ? 'OUT' : `${product.stock} left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">Refreshing dashboard data...</div>
      )}
    </div>
  )
}
