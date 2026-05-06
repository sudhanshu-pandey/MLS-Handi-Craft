// India states data with coordinates for map visualization
export interface StateData {
  name: string
  code: string
  lat: number
  lng: number
}

export const INDIA_STATES: StateData[] = [
  // Northern States
  { name: 'Jammu & Kashmir', code: 'JK', lat: 34.13, lng: 77.59 },
  { name: 'Himachal Pradesh', code: 'HP', lat: 32.06, lng: 77.17 },
  { name: 'Punjab', code: 'PB', lat: 31.14, lng: 75.34 },
  { name: 'Haryana', code: 'HR', lat: 29.06, lng: 77.04 },
  { name: 'Uttar Pradesh', code: 'UP', lat: 27.59, lng: 77.89 },
  { name: 'Uttarakhand', code: 'UT', lat: 30.07, lng: 79.02 },
  { name: 'Delhi', code: 'DL', lat: 28.61, lng: 77.23 },
  
  // Eastern States
  { name: 'Bihar', code: 'BR', lat: 25.59, lng: 85.53 },
  { name: 'Jharkhand', code: 'JH', lat: 23.61, lng: 85.27 },
  { name: 'West Bengal', code: 'WB', lat: 24.49, lng: 88.03 },
  { name: 'Odisha', code: 'OD', lat: 20.76, lng: 84.67 },
  
  // Central States
  { name: 'Madhya Pradesh', code: 'MP', lat: 22.98, lng: 78.55 },
  { name: 'Chhattisgarh', code: 'CG', lat: 21.28, lng: 81.63 },
  
  // Western States
  { name: 'Rajasthan', code: 'RJ', lat: 27.39, lng: 73.88 },
  { name: 'Gujarat', code: 'GJ', lat: 22.26, lng: 71.19 },
  { name: 'Maharashtra', code: 'MH', lat: 19.75, lng: 75.71 },
  { name: 'Goa', code: 'GA', lat: 15.30, lng: 73.83 },
  
  // Southern States
  { name: 'Karnataka', code: 'KA', lat: 15.33, lng: 75.71 },
  { name: 'Telangana', code: 'TG', lat: 18.11, lng: 79.05 },
  { name: 'Andhra Pradesh', code: 'AP', lat: 15.91, lng: 78.68 },
  { name: 'Tamil Nadu', code: 'TN', lat: 11.13, lng: 79.20 },
  { name: 'Kerala', code: 'KL', lat: 10.85, lng: 76.27 },
  
  // Northeastern States
  { name: 'Assam', code: 'AS', lat: 26.15, lng: 92.74 },
  { name: 'Meghalaya', code: 'ML', lat: 25.47, lng: 91.37 },
  { name: 'Manipur', code: 'MN', lat: 24.66, lng: 93.91 },
  { name: 'Mizoram', code: 'MZ', lat: 23.19, lng: 92.94 },
  { name: 'Nagaland', code: 'NL', lat: 26.16, lng: 94.56 },
  { name: 'Tripura', code: 'TR', lat: 23.83, lng: 91.28 },
  { name: 'Arunachal Pradesh', code: 'AR', lat: 28.62, lng: 95.71 },
  { name: 'Sikkim', code: 'SK', lat: 27.53, lng: 88.51 },
]
