// Quick Test - Add this to any component to test location-based theming

import { useEffect, useState } from 'react'
import { getUserState } from '../utils/geolocation'
import { getColorForState } from '../utils/stateColorMap'

export const LocationThemeDebug = () => {
  const [state, setState] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const test = async () => {
      try {
        const userState = await getUserState()
        setState(userState)
        if (userState) {
          const themeColor = getColorForState(userState)
          setColor(themeColor)
        }
      } catch (error) {
        console.error('Location detection failed:', error)
      } finally {
        setLoading(false)
      }
    }

    test()
  }, [])

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '20px' }}>
      <h3>Location-Based Theme Debug</h3>
      {loading ? (
        <p>Detecting location...</p>
      ) : (
        <>
          <p><strong>Detected State:</strong> {state || 'Not detected'}</p>
          <p><strong>Mapped Color:</strong> {color || 'Default (wine)'}</p>
          <p style={{ fontSize: '12px', color: '#999' }}>
            Check browser console for detailed logs
          </p>
        </>
      )}
    </div>
  )
}

