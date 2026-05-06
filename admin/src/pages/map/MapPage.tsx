import { useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon, ArrowDownTrayIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import PageHeader from '../../components/common/PageHeader'
import GeographicSales, { type StateSalesData } from '../../components/common/GeographicSales.tsx'
import { analyticsService } from '../../services/analyticsService'
import { formatCurrency, formatNumber } from '../../utils/formatters'

const FILTER_OPTIONS = [30, 90, 180] as const

type PaymentMixItem = {
  method: string
  orders: number
  revenue: number
  percentage: number
}

type StateSalesSummary = {
  periodDays: number
  from: string
  to: string
  totalPurchases: number
  totalRevenue: number
  totalCustomers: number
  activeStates: number
  revenueChange: number
  purchasesChange: number
  paymentMix: PaymentMixItem[]
  topState: StateSalesData | null
}

export default function MapPage() {
  const [selectedDays, setSelectedDays] = useState<30 | 90 | 180>(30)
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light')
  const [isLoading, setIsLoading] = useState(true)
  const [stateSales, setStateSales] = useState<StateSalesData[]>([])
  const [summary, setSummary] = useState<StateSalesSummary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const getErrorMessage = (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response
      if (response?.data?.message) {
        return response.data.message
      }
    }

    if (error instanceof Error && error.message) {
      return error.message
    }

    return 'Unable to load map data'
  }

  const loadStateSales = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await analyticsService.getStateWiseSales(undefined, undefined, selectedDays)
      setStateSales(response.data?.data || [])
      setSummary(response.data?.summary || null)
    } catch (error) {
      setStateSales([])
      setSummary(null)
      setLoadError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStateSales()
  }, [selectedDays])

  const totalPurchases = useMemo(() => stateSales.reduce((sum, state) => sum + state.purchases, 0), [stateSales])
  const totalRevenue = useMemo(() => stateSales.reduce((sum, state) => sum + state.revenue, 0), [stateSales])
  const totalCustomers = useMemo(() => stateSales.reduce((sum, state) => sum + state.customers, 0), [stateSales])
  const averagePurchases = useMemo(
    () => (stateSales.length ? Math.round(totalPurchases / stateSales.length) : 0),
    [stateSales.length, totalPurchases]
  )
  const topStates = useMemo(() => {
    return [...stateSales].sort((a, b) => b.purchases - a.purchases).slice(0, 7)
  }, [stateSales])
  const topState = summary?.topState || topStates[0]
  const topPaymentMethod = summary?.paymentMix?.[0] || null

  const signedPercent = (value: number | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '0%'
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatMethodName = (method: string) => {
    const value = method.trim().toLowerCase()
    if (!value) return 'Unknown'
    if (value === 'cod') return 'COD'
    if (value === 'upi') return 'UPI'
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="State Sales Intelligence"
        subtitle="Advanced India state analytics with interactive focus, trend deltas, payment-mix intelligence, and export-ready reporting."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary text-xs inline-flex items-center gap-2"
              onClick={loadStateSales}
            >
              <ArrowPathIcon className="w-4 h-4" /> Refresh
            </button>
            <button
              type="button"
              className="btn-secondary text-xs inline-flex items-center gap-2"
              onClick={() => setMapTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            >
              {mapTheme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />} {mapTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
            <button
              type="button"
              className="btn-primary text-xs inline-flex items-center gap-2"
              onClick={() => {
                const csv = ['State,Code,Purchases,Revenue,Customers,PurchasesChange,RevenueChange']
                  .concat(stateSales.map(s => `${s.state},${s.code},${s.purchases},${s.revenue},${s.customers},${s.purchases_change ?? 0},${s.revenue_change ?? 0}`))
                  .join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'state-sales-map.csv'
                link.click()
                URL.revokeObjectURL(url)
              }}
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
            </button>
          </div>
        )}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="card border border-gray-200 bg-gradient-to-br from-white to-emerald-50 p-5 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Total Purchases</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{formatNumber(totalPurchases)}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Growth: {signedPercent(summary?.purchasesChange)}</p>
        </div>
        <div className="card border border-gray-200 bg-gradient-to-br from-white to-emerald-50 p-5 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Total Revenue</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalRevenue)}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Growth: {signedPercent(summary?.revenueChange)}</p>
        </div>
        <div className="card border border-gray-200 bg-gradient-to-br from-white to-emerald-50 p-5 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Unique Customers</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{formatNumber(totalCustomers)}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Active states: {formatNumber(summary?.activeStates ?? stateSales.length)}</p>
        </div>
        <div className="card border border-gray-200 bg-gradient-to-br from-white to-emerald-50 p-5 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Avg Purchases / State</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{formatNumber(averagePurchases)}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Window: Last {selectedDays} days</p>
        </div>
        <div className="card border border-gray-200 bg-gradient-to-br from-white to-emerald-50 p-5 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Top State</p>
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{topState ? topState.state : 'No data yet'}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">{topState ? `${formatNumber(topState.purchases)} orders | ${signedPercent(topState.purchases_change)}` : 'Awaiting data'}</p>
        </div>
      </section>

      <section className="space-y-5">
        <div className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Reporting Window</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">State-wise Distribution</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {FILTER_OPTIONS.map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedDays(days)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${selectedDays === days ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'}`}
                >
                  Last {days} Days
                </button>
              ))}
              <span className={`ml-1 rounded-full px-3 py-1 text-xs font-semibold ${mapTheme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-amber-100 text-amber-800'}`}>
                {mapTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
          </div>

          {loadError ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
              {loadError}
            </div>
          ) : (
            <GeographicSales data={stateSales} isLoading={isLoading} mode={mapTheme} />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card border border-gray-200 p-5 dark:border-slate-700">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Advanced Insights</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Market Pulse</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
              {topState
                ? `${topState.state} leads with ${formatNumber(topState.purchases)} purchases and ${formatCurrency(topState.revenue)} revenue (${signedPercent(topState.revenue_change)} revenue trend).`
                : 'Waiting for enough data to generate insights.'}
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
              Coverage across <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(stateSales.length)} states</span> with
              average <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(averagePurchases)}</span> purchases per state.
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
              Preferred payment channel: <span className="font-semibold text-gray-900 dark:text-white">{topPaymentMethod ? formatMethodName(topPaymentMethod.method) : 'N/A'}</span>
              {topPaymentMethod ? ` (${topPaymentMethod.percentage.toFixed(2)}% of orders)` : ''}.
            </p>
          </div>
          <div className="card border border-gray-200 p-5 dark:border-slate-700">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Top Performing States</p>
            <div className="mt-3 space-y-2">
              {topStates.slice(0, 4).map((state, index) => (
                <div key={state.code} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800">
                  <span className="font-medium text-gray-900 dark:text-white">{index + 1}. {state.state}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{formatNumber(state.purchases)} orders | {signedPercent(state.purchases_change)}</span>
                </div>
              ))}
              {topStates.length === 0 && <p className="text-sm text-gray-500 dark:text-slate-400">No state sales data available.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
