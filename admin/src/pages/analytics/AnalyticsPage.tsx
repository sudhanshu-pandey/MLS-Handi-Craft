import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import PageHeader from '../../components/common/PageHeader'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { analyticsService } from '../../services/analyticsService'
import type { KPIData, RevenueData, CategoryRevenue, Order } from '../../types'

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

const PIE_COLORS = ['#f17010', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#06b6d4']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.dataKey === 'revenue' ? formatCurrency(p.value) : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<30 | 90 | 180>(30)
  const [isLoading, setIsLoading] = useState(true)
  const [kpis, setKpis] = useState<KPIData>(EMPTY_KPI_DATA)
  const [revenueTrend, setRevenueTrend] = useState<RevenueData[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<RevenueData[]>([])
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const [kpiRes, revenueRes, monthlyRes, categoryRes, orderRes] = await Promise.all([
        analyticsService.getKPIs(),
        analyticsService.getRevenueTrend('daily', period),
        analyticsService.getRevenueTrend('monthly', 365),
        analyticsService.getCategoryRevenue(),
        analyticsService.getOrderStats(500),
      ])

      setKpis(kpiRes.data || EMPTY_KPI_DATA)
      setRevenueTrend(revenueRes.data?.data || [])
      setMonthlyTrend((monthlyRes.data?.data || []).slice(-12))
      setCategoryRevenue(categoryRes.data?.data || [])
      setOrders(orderRes.data?.orders || [])
    } catch {
      setKpis(EMPTY_KPI_DATA)
      setRevenueTrend([])
      setMonthlyTrend([])
      setCategoryRevenue([])
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const paymentMethodData = useMemo(() => {
    const counts: Record<string, number> = {}
    orders.forEach(o => { counts[o.paymentMethod] = (counts[o.paymentMethod] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }))
  }, [orders])

  const funnelData = useMemo(() => {
    const totalOrders = orders.length
    const confirmed = orders.filter(o => o.status === 'confirmed').length
    const shipped = orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const cancelled = orders.filter(o => o.status === 'cancelled').length

    return [
      { name: 'Orders', value: totalOrders, fill: '#3b82f6' },
      { name: 'Confirmed', value: confirmed, fill: '#8b5cf6' },
      { name: 'Shipped', value: shipped, fill: '#f17010' },
      { name: 'Delivered', value: delivered, fill: '#10b981' },
      { name: 'Cancelled', value: cancelled, fill: '#ef4444' },
    ]
  }, [orders])

  const conversionRate = kpis.conversionRate.toFixed(1)
  const cartAbandonRate = orders.length > 0 ? ((funnelData[4].value / funnelData[0].value) * 100).toFixed(1) : '0.0'

  const exportCSV = () => {
    const rows = revenueTrend.map(d => `${d.date},${d.revenue},${d.orders}`)
    const csv = ['Date,Revenue,Orders', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'analytics.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Loading analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Fetching the latest revenue, order, and category metrics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Detailed insights about your store performance"
        actions={
          <>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              {([30, 90, 180] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  {p === 30 ? '30D' : p === 90 ? '3M' : '6M'}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="btn-secondary text-sm">
              <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
            </button>
          </>
        }
      />

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue), change: `+${kpis.revenueChange}%`, positive: true },
          { label: 'Total Orders', value: formatNumber(kpis.totalOrders), change: `+${kpis.ordersChange}%`, positive: true },
          { label: 'Conversion Rate', value: `${conversionRate}%`, change: 'Lifetime', positive: true },
          { label: 'Cart Abandonment', value: `${cartAbandonRate}%`, change: 'Cart → Purchase', positive: false },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className={`text-xs mt-0.5 ${s.positive ? 'text-green-600' : 'text-red-500'}`}>{s.change}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">Refreshing analytics data...</div>
      )}

      {/* Revenue over time */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Revenue Trend ({period} Days)</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Daily revenue performance</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f17010" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f17010" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} interval={Math.floor(revenueTrend.length / 7)} />
            <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${formatNumber(v)}`} />
            <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#f17010" strokeWidth={2} fill="url(#revGrad2)" />
            <Area yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" strokeWidth={2} fill="url(#ordGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category Revenue + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Revenue by Category</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Category contribution breakdown</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryRevenue} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `₹${formatNumber(v)}`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                {categoryRevenue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Payment Methods</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Order distribution by payment</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentMethodData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {paymentMethodData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {paymentMethodData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-gray-600 dark:text-gray-400">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel Analysis */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Conversion Funnel</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">From visitor to purchase</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const total = funnelData[0]?.value || 1
              const pct = total > 0 ? ((stage.value / total) * 100).toFixed(1) : '0.0'
              return (
                <div key={stage.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{stage.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{stage.value.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${pct}%`, backgroundColor: stage.fill }}
                    />
                  </div>
                  {i < funnelData.length - 1 && funnelData[i].value > 0 && (
                    <p className="text-xs text-red-500 mt-0.5 text-right">
                      Drop: {(((funnelData[i].value - funnelData[i + 1].value) / funnelData[i].value) * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" name="Orders" radius={[0, 4, 4, 0]}>
                  {funnelData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
