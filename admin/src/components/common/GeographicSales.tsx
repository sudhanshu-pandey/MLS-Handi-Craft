import { useEffect, useMemo, useState } from 'react'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { INDIA_STATES } from '../../data/indiaStates'

export interface StateSalesData {
  state: string
  code: string
  purchases: number
  revenue: number
  customers: number
  revenue_change?: number
  purchases_change?: number
}

interface GeographicSalesProps {
  data: StateSalesData[]
  isLoading?: boolean
  mode?: 'light' | 'dark'
}

type MetricKey = 'purchases' | 'revenue' | 'customers'
type GeoPosition = [number, number]

type IndiaGeometry =
  | { type: 'Polygon'; coordinates: GeoPosition[][] }
  | { type: 'MultiPolygon'; coordinates: GeoPosition[][][] }

type IndiaFeature = {
  type: 'Feature'
  properties: {
    NAME_1?: string
    [key: string]: unknown
  }
  geometry: IndiaGeometry
}

type IndiaFeatureCollection = {
  type: 'FeatureCollection'
  features: IndiaFeature[]
}

type MappedFeature = {
  name: string
  code?: string
  path: string
  center: { x: number; y: number }
  metric: number
}

const METRIC_OPTIONS: Array<{ key: MetricKey; label: string; legendLabel: string }> = [
  { key: 'purchases', label: 'Net Units', legendLabel: 'Net Units' },
  { key: 'revenue', label: 'Revenue', legendLabel: 'Revenue' },
  { key: 'customers', label: 'Customers', legendLabel: 'Customers' },
]

const CALLOUT_COLORS = ['#f04d23', '#7c3aed', '#d946ef', '#f97316', '#ef4444', '#16a34a', '#8b5cf6', '#ec4899']
const LABEL_OFFSETS = [
  { dx: 56, dy: -54 },
  { dx: 42, dy: -12 },
  { dx: 36, dy: 26 },
  { dx: 42, dy: 62 },
  { dx: 120, dy: 36 },
  { dx: 18, dy: 68 },
  { dx: -180, dy: 54 },
  { dx: -178, dy: 86 },
]

const STATE_LABEL_CODES = ['JK', 'HP', 'PB', 'DL', 'RJ', 'GJ', 'MH', 'KA', 'KL', 'TN', 'TS', 'AP', 'MP', 'UP', 'BR', 'WB', 'AS', 'AR', 'OD', 'JH', 'CG', 'SK']

const FEATURE_NAME_ALIASES: Record<string, string> = {
  uttaranchal: 'UT',
  orissa: 'OD',
  'jammu and kashmir': 'JK',
  'jammu & kashmir': 'JK',
  nctofdelhi: 'DL',
  delhi: 'DL',
}

const normalizeName = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '')
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export default function GeographicSales({ data = [], isLoading = false, mode = 'dark' }: GeographicSalesProps) {
  const [hoveredStateCode, setHoveredStateCode] = useState<string | null>(null)
  const [pinnedStateCode, setPinnedStateCode] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('purchases')
  const [searchQuery, setSearchQuery] = useState('')
  const [geoJson, setGeoJson] = useState<IndiaFeatureCollection | null>(null)
  const [geoJsonError, setGeoJsonError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadGeoJson = async () => {
      try {
        setGeoJsonError(null)
        const response = await fetch('/geo/india-states.geojson', { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Failed to load India map data')
        }

        const payload = await response.json()
        setGeoJson(payload as IndiaFeatureCollection)
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') {
          return
        }

        setGeoJsonError('Unable to load India map boundaries.')
      }
    }

    loadGeoJson()

    return () => controller.abort()
  }, [])

  const svgWidth = 860
  const svgHeight = 910
  const padding = 40

  const stateDataMap = useMemo(() => {
    const map = new Map<string, StateSalesData>()
    data.forEach(item => map.set(item.code, item))
    return map
  }, [data])

  const geoNameToCode = useMemo(() => {
    const map = new Map<string, string>()

    INDIA_STATES.forEach(state => {
      map.set(normalizeName(state.name), state.code)
    })

    Object.entries(FEATURE_NAME_ALIASES).forEach(([featureName, stateCode]) => {
      map.set(normalizeName(featureName), stateCode)
    })

    return map
  }, [])

  const metricValue = (stateCode?: string) => {
    if (!stateCode) {
      return 0
    }

    const metrics = stateDataMap.get(stateCode)
    if (!metrics) {
      return 0
    }

    return selectedMetric === 'purchases'
      ? metrics.purchases
      : selectedMetric === 'revenue'
        ? metrics.revenue
        : metrics.customers
  }

  const maxSelectedMetric = useMemo(() => {
    return Math.max(...INDIA_STATES.map(item => metricValue(item.code)), 1)
  }, [selectedMetric, stateDataMap])

  const geoBounds = useMemo(() => {
    if (!geoJson?.features?.length) {
      return {
        minLng: 68,
        maxLng: 97,
        minLat: 6,
        maxLat: 37,
      }
    }

    let minLng = Number.POSITIVE_INFINITY
    let maxLng = Number.NEGATIVE_INFINITY
    let minLat = Number.POSITIVE_INFINITY
    let maxLat = Number.NEGATIVE_INFINITY

    const updateBounds = (point: GeoPosition) => {
      const [lng, lat] = point
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }

    geoJson.features.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates.forEach(ring => {
          ring.forEach(updateBounds)
        })
      } else {
        feature.geometry.coordinates.forEach(polygon => {
          polygon.forEach(ring => {
            ring.forEach(updateBounds)
          })
        })
      }
    })

    return {
      minLng,
      maxLng,
      minLat,
      maxLat,
    }
  }, [geoJson])

  const projectPoint = (point: GeoPosition) => {
    const { minLng, maxLng, minLat, maxLat } = geoBounds
    const x = padding + ((point[0] - minLng) / (maxLng - minLng)) * (svgWidth - padding * 2)
    const y = padding + ((maxLat - point[1]) / (maxLat - minLat)) * (svgHeight - padding * 2)
    return { x, y }
  }

  const projectedStateAnchors = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    INDIA_STATES.forEach(state => {
      const projected = projectPoint([state.lng, state.lat])
      map.set(state.code, projected)
    })
    return map
  }, [geoBounds])

  const mappedFeatures = useMemo<MappedFeature[]>(() => {
    const ringToPath = (ring: GeoPosition[]) => {
      return ring
        .map((point, index) => {
          const projected = projectPoint(point)
          return `${index === 0 ? 'M' : 'L'} ${projected.x} ${projected.y}`
        })
        .join(' ') + ' Z'
    }

    const polygonToPath = (polygon: GeoPosition[][]) => polygon.map(ring => ringToPath(ring)).join(' ')

    const getCenterFromRing = (ring: GeoPosition[]) => {
      const projectedPoints = ring.map(point => projectPoint(point))
      const sum = projectedPoints.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 })
      return {
        x: sum.x / projectedPoints.length,
        y: sum.y / projectedPoints.length,
      }
    }

    return (geoJson?.features ?? []).map(feature => {
      const featureName = feature.properties.NAME_1 || 'Unknown'
      const code = geoNameToCode.get(normalizeName(featureName))
      const metric = metricValue(code)

      const path = feature.geometry.type === 'Polygon'
        ? polygonToPath(feature.geometry.coordinates)
        : feature.geometry.coordinates.map(polygon => polygonToPath(polygon)).join(' ')

      const firstRing = feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates[0]
        : feature.geometry.coordinates[0][0]

      return {
        name: featureName,
        code,
        path,
        center: getCenterFromRing(firstRing),
        metric,
      }
    })
  }, [geoBounds, geoJson, selectedMetric, stateDataMap])

  const isDarkMode = mode === 'dark'
  const mapBackground = isDarkMode ? '#0f172a' : '#f3f5f4'
  const mapTextColor = isDarkMode ? '#f8fafc' : '#262f2a'
  const gridStroke = isDarkMode ? 'rgba(148,163,184,0.24)' : 'rgba(15,23,42,0.08)'
  const borderColor = isDarkMode ? '#334155' : '#d7e5dd'

  const selectedMetricLabel = METRIC_OPTIONS.find(option => option.key === selectedMetric)?.legendLabel ?? 'Net Units'

  const getColorForMetric = (metric: number) => {
    if (metric <= 0) {
      return isDarkMode ? '#243244' : '#d9e4de'
    }

    const ratio = metric / maxSelectedMetric
    if (ratio > 0.85) return '#137f3f'
    if (ratio > 0.7) return '#228d4c'
    if (ratio > 0.5) return '#3ea466'
    if (ratio > 0.3) return '#69bc89'
    if (ratio > 0.15) return '#98d2af'
    return '#cce8d7'
  }

  const selectedMetricFormatter = (value: number) => {
    return selectedMetric === 'revenue' ? formatCurrency(value) : formatNumber(value)
  }

  const totalPurchases = useMemo(() => data.reduce((sum, item) => sum + item.purchases, 0), [data])
  const totalRevenue = useMemo(() => data.reduce((sum, item) => sum + item.revenue, 0), [data])
  const totalActiveStates = data.filter(item => item.purchases > 0).length

  const rankedStates = useMemo(() => {
    return data
      .slice()
      .sort((a, b) => metricValue(b.code) - metricValue(a.code))
      .slice(0, CALLOUT_COLORS.length)
      .map((stateItem, index) => ({
        ...stateItem,
        calloutLabel: `${stateItem.code}: ${selectedMetricFormatter(metricValue(stateItem.code))}`,
        badgeColor: CALLOUT_COLORS[index],
        offset: LABEL_OFFSETS[index],
      }))
  }, [data, selectedMetric, stateDataMap])

  const activeStateCode = pinnedStateCode ?? hoveredStateCode
  const activeStateMetrics = activeStateCode ? stateDataMap.get(activeStateCode) ?? null : null
  const activeRevenueChange = activeStateMetrics?.revenue_change ?? 0

  const matchingStateCodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return new Set(INDIA_STATES.map(state => state.code))
    }

    return new Set(
      INDIA_STATES
        .filter(state => {
          const name = state.name.toLowerCase()
          return name.includes(query) || normalizeName(name).includes(normalizeName(query)) || state.code.toLowerCase().includes(query)
        })
        .map(state => state.code)
    )
  }, [searchQuery])

  const matchingCount = matchingStateCodes.size
  const legendTicks = [0, Math.round(maxSelectedMetric / 3), Math.round((maxSelectedMetric * 2) / 3), maxSelectedMetric]

  if (isLoading || !geoJson) {
    return (
      <div className="bg-white rounded-3xl p-8 h-full flex items-center justify-center border border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-slate-300">Loading geographic data...</p>
          {geoJsonError && <p className="mt-2 text-xs text-rose-500 dark:text-rose-300">{geoJsonError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-[24px] border border-gray-200 bg-[#f4f5f4] p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="mt-1 text-[38px] leading-tight font-semibold text-[#2a2f2b] dark:text-white">Your sales across different states</h3>
        </div>
        <div className="min-w-[300px] rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-950/80">
          <p className="text-sm font-semibold text-[#4b544f] dark:text-slate-200 text-right">{selectedMetricLabel}</p>
          <div className="mt-1 h-4 w-full rounded-full bg-gradient-to-r from-[#d8e9dd] via-[#78b68f] to-[#0c7b3a]" />
          <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-[#5b645f] dark:text-slate-300">
            {legendTicks.map((tick, index) => (
              <span key={`${tick}-${index}`}>{formatNumber(tick)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {METRIC_OPTIONS.map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedMetric(option.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${selectedMetric === option.key ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex w-full max-w-sm items-center gap-2 md:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={event => {
              setSearchQuery(event.target.value)
              setPinnedStateCode(null)
            }}
            className="input-field py-2 text-sm"
            placeholder="Search state (name or code)"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-secondary px-3 py-2 text-xs"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-[#f2f3f2] p-3 dark:border-slate-700 dark:bg-slate-950">
        <div className="flex justify-center overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[680px] max-w-4xl" style={{ background: mapBackground }}>
            <rect x={padding} y={padding} width={svgWidth - padding * 2} height={svgHeight - padding * 2} fill="transparent" stroke={borderColor} strokeWidth="1" rx="20" />

            {mappedFeatures.map(feature => {
              const isHovered = feature.code ? hoveredStateCode === feature.code : false
              const isPinned = feature.code ? pinnedStateCode === feature.code : false
              const matchesQuery = !searchQuery || (feature.code ? matchingStateCodes.has(feature.code) : true)
              const strokeColor = isPinned ? '#0f172a' : isHovered ? '#f04d23' : isDarkMode ? '#dbe8e1' : '#edf4f0'
              const fillColor = getColorForMetric(feature.metric)
              const showLabel = feature.metric > 0 && feature.metric / maxSelectedMetric > 0.18 && feature.code ? STATE_LABEL_CODES.includes(feature.code) : false

              return (
                <g key={`${feature.name}-${feature.code ?? 'na'}`}>
                  <path
                    d={feature.path}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isPinned ? 2 : 1.1}
                    opacity={matchesQuery ? 1 : 0.25}
                    style={{ transition: 'all 180ms ease' }}
                    onMouseEnter={() => {
                      if (feature.code) {
                        setHoveredStateCode(feature.code)
                      }
                    }}
                    onMouseLeave={() => setHoveredStateCode(null)}
                    onClick={() => {
                      const clickedCode = feature.code
                      if (clickedCode) {
                        setPinnedStateCode(current => (current === clickedCode ? null : clickedCode))
                      }
                    }}
                    className={feature.code ? 'cursor-pointer' : ''}
                  />

                  {(isHovered || isPinned) && (
                    <text
                      x={feature.center.x}
                      y={feature.center.y}
                      textAnchor="middle"
                      className="text-[11px] font-semibold"
                      fill={mapTextColor}
                    >
                      {feature.name}
                    </text>
                  )}

                  {showLabel && !isHovered && !isPinned && (
                    <text
                      x={feature.center.x}
                      y={feature.center.y}
                      textAnchor="middle"
                      className="text-[10px] font-semibold"
                      fill={isDarkMode ? '#cbd5e1' : '#37423c'}
                    >
                      {feature.name}
                    </text>
                  )}
                </g>
              )
            })}

            {rankedStates.map((stateItem, index) => {
              const anchor = projectedStateAnchors.get(stateItem.code)
              if (!anchor) {
                return null
              }

              const width = stateItem.calloutLabel.length * 7 + 18
              const offset = stateItem.offset
              const rawX = anchor.x + offset.dx
              const rawY = anchor.y + offset.dy
              const labelX = clamp(rawX, padding + 8, svgWidth - padding - width - 8)
              const labelY = clamp(rawY, padding + 8, svgHeight - padding - 26)

              return (
                <g key={`${stateItem.code}-${stateItem.calloutLabel}-${index}`} pointerEvents="none">
                  <path
                    d={`M ${anchor.x} ${anchor.y} L ${labelX - 6} ${labelY + 13}`}
                    stroke={stateItem.badgeColor}
                    strokeWidth="1.8"
                    opacity="0.8"
                  />
                  <polygon
                    points={`${anchor.x},${anchor.y} ${anchor.x - 8},${anchor.y - 6} ${anchor.x - 4},${anchor.y + 7}`}
                    fill={stateItem.badgeColor}
                    opacity="0.95"
                  />
                  <rect
                    x={labelX}
                    y={labelY}
                    rx={6}
                    ry={6}
                    width={width}
                    height={26}
                    fill={stateItem.badgeColor}
                    opacity="0.95"
                  />
                  <text
                    x={labelX + width / 2}
                    y={labelY + 17}
                    textAnchor="middle"
                    className="text-[11px] font-semibold"
                    fill="#ffffff"
                  >
                    {stateItem.calloutLabel}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {!isLoading && data.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-slate-600 dark:text-slate-300">
          No sales data found for the selected period. Try a different time window or verify that orders include a valid state in the shipping address.
        </div>
      )}

      {activeStateMetrics && (
        <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Focused State</p>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{activeStateMetrics.state}</h4>
              <span className="mt-2 inline-block rounded-full bg-emerald-600 px-2 py-1 text-xs text-white">{activeStateMetrics.code}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:bg-slate-900 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Net Units</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{formatNumber(activeStateMetrics.purchases)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:bg-slate-900 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Revenue</p>
                <p className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(activeStateMetrics.revenue)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:bg-slate-900 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Customers</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{formatNumber(activeStateMetrics.customers)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-gray-600 dark:text-slate-300">
              Metric Rank Signal:
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">{selectedMetricFormatter(metricValue(activeStateMetrics.code))}</span>
            </p>
            {activeRevenueChange !== 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                <span>Revenue Change:</span>
                <span className={`font-semibold ${activeRevenueChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {activeRevenueChange > 0 ? '+' : ''}
                  {activeRevenueChange}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
        <p>
          Active Metric: <span className="font-semibold text-gray-900 dark:text-white">{selectedMetricLabel}</span>
        </p>
        <p>
          Search Matches: <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(matchingCount)}</span>
        </p>
        <p>
          Pinned State: <span className="font-semibold text-gray-900 dark:text-white">{pinnedStateCode ?? 'None'}</span>
        </p>
      </div>
    </div>
  )
}
