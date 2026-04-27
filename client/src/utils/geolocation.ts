/**
 * Geolocation utilities for getting user's location and state
 */

export interface LocationData {
  latitude: number
  longitude: number
  state?: string
  city?: string
  country?: string
}

/**
 * Get user's current geolocation using browser Geolocation API
 */
export const getUserGeolocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 3600000, // Cache for 1 hour
      }
    )
  })
}

/**
 * Get state from latitude and longitude using reverse geocoding
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export const getStateFromCoordinates = async (lat: number, lon: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch location data')
    }

    const data = await response.json()

    // Extract state from address
    // In India, the state is usually in the "state" field
    const state = data.address?.state || data.address?.region || null
    return state
  } catch (error) {
    console.warn('Failed to get state from coordinates:', error)
    return null
  }
}

/**
 * Get user's location and state in one call
 */
export const getUserLocationWithState = async (): Promise<LocationData | null> => {
  try {
    const location = await getUserGeolocation()
    const state = await getStateFromCoordinates(location.latitude, location.longitude)

    return {
      ...location,
      state: state || undefined,
    }
  } catch (error) {
    console.warn('Failed to get user location:', error)
    return null
  }
}

/**
 * Get user's state from IP using a free IP geolocation API
 * Fallback method when browser geolocation is not available
 */
export const getStateFromIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/')

    if (!response.ok) {
      throw new Error('Failed to fetch IP location')
    }

    const data = await response.json()

    // Check if user is in India
    if (data.country_code === 'IN') {
      return data.region || null
    }

    return null
  } catch (error) {
    console.warn('Failed to get state from IP:', error)
    return null
  }
}

/**
 * Get user's state (tries browser geolocation first, then IP-based)
 */
export const getUserState = async (): Promise<string | null> => {
  // Try browser geolocation first
  const location = await getUserLocationWithState()
  if (location?.state) {
    return location.state
  }

  // Fallback to IP-based geolocation
  return getStateFromIP()
}
