/**
 * State to Color Mapping for India
 * Maps Indian states/UTs to their representative colors based on cultural/regional significance
 */

export type ThemeColorKey =
  | 'brown'
  | 'terracotta'
  | 'olive'
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'teal'
  | 'crimson'
  | 'indigo'
  | 'cocoa'
  | 'mustard'
  | 'wine'

export const stateColorMapping: Record<string, ThemeColorKey> = {
  // Yellow states -> Mustard
  'Andhra Pradesh': 'mustard',
  'Karnataka': 'mustard',
  'Punjab': 'mustard',

  // Green states -> Green
  'Arunachal Pradesh': 'green',
  'Assam': 'green',
  'Chhattisgarh': 'green',
  'Haryana': 'green',
  'Himachal Pradesh': 'green',
  'Jharkhand': 'green',
  'Kerala': 'green',
  'Manipur': 'green',
  'Meghalaya': 'green',
  'Mizoram': 'green',
  'Nagaland': 'green',
  'Sikkim': 'green',
  'Tripura': 'green',
  'Uttarakhand': 'green',

  // Saffron states -> Orange/Terracotta
  'Bihar': 'orange',
  'Madhya Pradesh': 'terracotta',
  'Maharashtra': 'terracotta',
  'Uttar Pradesh': 'orange',

  // White states -> Indigo (neutral/formal)
  'Goa': 'blue',
  'Gujarat': 'indigo',
  'Odisha': 'indigo',
  'Tamil Nadu': 'indigo',

  // Blue states -> Blue/Teal
  'West Bengal': 'blue',

  // Pink states -> Crimson/Wine
  'Rajasthan': 'crimson',
  'Telangana': 'wine',

  // Union Territories
  'Andaman and Nicobar Islands': 'blue',
  'Chandigarh': 'indigo',
  'Dadra and Nagar Haveli and Daman and Diu': 'orange',
  'Lakshadweep': 'blue',
  'Delhi': 'indigo',
  'Puducherry': 'indigo',
  'Ladakh': 'teal',
}

/**
 * Get theme color for a given state
 * @param state - State/UT name
 * @returns ThemeColorKey
 */
export const getColorForState = (state: string): ThemeColorKey => {
  if (!state) return 'wine'

  // Normalize state name (trim and title case)
  const normalizedState = state.trim()

  // Try exact match first
  if (stateColorMapping[normalizedState]) {
    return stateColorMapping[normalizedState]
  }

  // Try case-insensitive match
  for (const [key, value] of Object.entries(stateColorMapping)) {
    if (key.toLowerCase() === normalizedState.toLowerCase()) {
      return value
    }
  }

  // If state not found, return default
  return 'wine'
}

/**
 * Get all available states
 */
export const getAllStates = (): string[] => {
  return Object.keys(stateColorMapping).sort()
}
