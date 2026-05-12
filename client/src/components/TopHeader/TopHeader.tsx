import { useEffect, useState } from 'react'
import styles from './TopHeader.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const FALLBACK_TEXT = '🎉  Prepaid Orders Get Extra 5% OFF  |  Faster Dispatch  |  No COD Hassles  🎉'

interface AnnouncementItem { text: string }

const TopHeader = () => {
  const [items, setItems] = useState<string[]>([])
  const [speed, setSpeed] = useState(20)
  const [spacing, setSpacing] = useState(50)
  const [separator, setSeparator] = useState('  |  ')

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await fetch(`${API_URL}/announcements/active`)
        const json = await res.json()
        const announcements: AnnouncementItem[] = json.data || []
        const settings = json.settings || {}
        if (settings.speed) setSpeed(settings.speed)
        if (settings.spacing) setSpacing(settings.spacing)
        if (settings.separator) setSeparator(settings.separator)
        if (announcements.length > 0) {
          setItems(announcements.map(a => a.text))
        }
      } catch {
        // keep fallback
      }
    }
    fetchAnnouncement()
  }, [])

  const displayText = items.length > 0 ? items : [FALLBACK_TEXT]

  return (
    <div className={styles.topHeader}>
      <div className={styles.tickerWrapper}>
        <p className={styles.promotionText} style={{ animationDuration: `${speed}s` }}>
          {displayText.map((t, i) => (
            <span key={i}>
              {t}
              {i < displayText.length - 1 && (
                <span style={{ display: 'inline-block', padding: `0 ${spacing / 2}px`, textAlign: 'center' }}>{separator}</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}

export default TopHeader
