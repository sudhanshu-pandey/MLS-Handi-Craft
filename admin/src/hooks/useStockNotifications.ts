import { useEffect } from 'react'
import { useAppDispatch } from '../redux/hooks'
import { addNotification } from '../redux/slices/notificationSlice'
import type { Product } from '../types'

export const LOW_STOCK_THRESHOLD = 10

const SESSION_KEY = 'hc_stock_notified'

function loadNotified(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveNotified(set: Set<string>): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]))
  } catch { /* ignore quota/security errors */ }
}

/**
 * Watches the products list and dispatches low-stock / out-of-stock
 * notifications to the Redux store. Each product+severity pair is only
 * notified once per browser session (deduped via sessionStorage).
 */
export function useStockNotifications(products: Product[]): void {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!products.length) return

    const notified = loadNotified()
    let changed = false

    // Process most-critical first (out-of-stock ➜ lowest stock)
    const alertProducts = products
      .filter(p => p.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock)

    for (const product of alertProducts) {
      const severity = product.stock === 0 ? 'oos' : 'low'
      const key = `${product._id}:${severity}`

      if (notified.has(key)) continue

      notified.add(key)
      changed = true

      dispatch(
        addNotification({
          id: `stock-${product._id}-${Date.now()}`,
          type: 'stock',
          title: product.stock === 0 ? 'Out of Stock' : 'Low Stock Alert',
          message:
            product.stock === 0
              ? `${product.name} is completely out of stock`
              : `${product.name} — only ${product.stock} unit${product.stock === 1 ? '' : 's'} remaining`,
          isRead: false,
          createdAt: new Date().toISOString(),
        }),
      )
    }

    if (changed) saveNotified(notified)
  }, [products, dispatch])
}
