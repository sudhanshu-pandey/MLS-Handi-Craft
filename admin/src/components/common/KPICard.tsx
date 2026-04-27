import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import type { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string
  change: number
  icon: ReactNode
  iconBg?: string
  subtitle?: string
  isLoading?: boolean
}

export default function KPICard({ title, value, change, icon, iconBg = 'bg-primary-100 dark:bg-primary-900/30', subtitle, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-16 h-5 rounded-full" />
        </div>
        <div className="skeleton h-7 w-24 rounded mb-1" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>
    )
  }

  const isPositive = change >= 0

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
          isPositive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}
