/**
 * Address Field Validation Utility
 * Comprehensive validation for address form fields
 */

export interface FieldError {
  field: string
  message: string
}

export interface AddressFormData {
  name?: string
  phone?: string
  pincode: string
  line1: string
  city: string
  state: string
}

export interface FieldErrors {
  [key: string]: string | null
}

/**
 * Check if string is repetitive/fake (same character repeated)
 * Examples: "aaaa", "zzzz", "qqqq"
 */
const isRepetitiveString = (str: string): boolean => {
  const trimmed = str.trim().toLowerCase()
  if (trimmed.length < 3) return false
  // Check if all characters are the same
  return trimmed.split('').every(char => char === trimmed[0])
}

/**
 * Check if string has obvious repeating patterns (like "aabbaa", "ababab", "aabbaabb")
 * These are fake/meaningless patterns commonly used for testing
 */
const hasRepeatingPattern = (str: string): boolean => {
  const trimmed = str.trim().toLowerCase().replace(/\s/g, '')
  if (trimmed.length < 4) return false
  
  // Check for patterns where a sequence repeats exactly 2+ times
  // Examples: "aabbaa", "ababab", "aabbaabb", "123456123456", "abcabc"
  
  // Try different pattern lengths (1 to half the string length)
  for (let patternLen = 1; patternLen <= Math.floor(trimmed.length / 2); patternLen++) {
    const pattern = trimmed.substring(0, patternLen)
    
    // Check if entire string is made of repetitions of this pattern
    let isRepeatingPattern = true
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] !== pattern[i % patternLen]) {
        isRepeatingPattern = false
        break
      }
    }
    
    // If pattern repeats at least 2+ full times, and is not too short (>= 2 chars), it's suspicious
    if (isRepeatingPattern && patternLen >= 2 && trimmed.length >= patternLen * 2) {
      const repetitions = trimmed.length / patternLen
      // If pattern repeats 2+ times and is not just single characters
      if (repetitions >= 2 && !pattern.split('').every(c => c === pattern[0])) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Check if string contains only vowels or only consonants (fake data)
 * Examples: "aeiou", "bcdfg"
 */
const isOnlyVowelsOrConsonants = (str: string): boolean => {
  const trimmed = str.toLowerCase().replace(/\s/g, '')
  const vowels = 'aeiou'
  const isAllVowels = trimmed.split('').every(char => vowels.includes(char) || !char.match(/[a-z]/))
  const isAllConsonants = trimmed.split('').every(char => !vowels.includes(char) && char.match(/[a-z]/))
  return (isAllVowels && trimmed.length >= 3) || (isAllConsonants && trimmed.length >= 4)
}

/**
 * Check if string has meaningful words (not just random characters)
 * Rejects: random characters, nonsense patterns
 */
const hasMeaningfulContent = (str: string): boolean => {
  const trimmed = str.trim().toLowerCase()
  
  // Reject if mostly digits with few letters
  const digitCount = (trimmed.match(/\d/g) || []).length
  const letterCount = (trimmed.match(/[a-z]/g) || []).length
  if (letterCount > 0 && digitCount / letterCount > 0.8) {
    return false // Too many digits, not real address
  }
  
  // Reject completely random looking strings
  if (trimmed.length > 0 && !trimmed.match(/[a-z0-9]{2,}/)) {
    return false // No meaningful character sequences
  }
  
  return true
}

/**
 * Validate address line field - enhanced with fake address detection
 * Required, minimum 8 characters, must contain meaningful address components
 */
export const validateAddressLine = (line: string | undefined): string | null => {
  if (!line || line.trim().length === 0) {
    return 'Address is required'
  }
  
  const trimmed = line.trim()
  
  if (trimmed.length < 8) {
    return 'Address must be at least 8 characters (e.g., "123 Main Street")'
  }
  
  if (trimmed.length > 100) {
    return 'Address must not exceed 100 characters'
  }
  
  // Reject obvious fake patterns
  if (isRepetitiveString(trimmed)) {
    return 'Please enter a valid address (not repetitive characters)'
  }
  
  if (hasRepeatingPattern(trimmed)) {
    return 'Please enter a real address (not a repeating pattern like aabbaa or ababab)'
  }
  
  if (isOnlyVowelsOrConsonants(trimmed)) {
    return 'Please enter a valid address with proper words'
  }
  
  if (!hasMeaningfulContent(trimmed)) {
    return 'Please enter a real address with meaningful content'
  }
  
  // Reject common test/fake patterns
  const fakePatterns = [
    /^test/i,
    /^demo/i,
    /^fake/i,
    /^none/i,
    /^random/i,
    /^xxx/i,
    /^temp/i,
    /^asdf/i,
  ]
  
  if (fakePatterns.some(pattern => pattern.test(trimmed))) {
    return 'Please enter a valid residential/business address'
  }
  
  return null
}

/**
 * Validate name field - enhanced with fake name detection
 * Required, minimum 3 characters, letters and spaces only, meaningful names
 */
export const validateName = (name: string | undefined): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Name is required'
  }
  
  const trimmed = name.trim()
  
  if (trimmed.length < 3) {
    return 'Name must be at least 3 characters'
  }
  
  if (trimmed.length > 50) {
    return 'Name must not exceed 50 characters'
  }
  
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes'
  }
  
  // Reject repetitive names
  if (isRepetitiveString(trimmed)) {
    return 'Please enter a valid name (not repetitive characters)'
  }
  
  if (hasRepeatingPattern(trimmed)) {
    return 'Please enter a real name (not a repeating pattern)'
  }
  
  // Reject names with only vowels or only consonants
  if (isOnlyVowelsOrConsonants(trimmed)) {
    return 'Please enter a valid name'
  }
  
  // Must have at least 2 words or one word with at least 4 letters
  const words = trimmed.split(/\s+/).filter(w => w.length > 0)
  const hasMultipleWords = words.length >= 2
  const hasLongWord = words.some(w => w.replace(/['-]/g, '').length >= 4)
  
  if (!hasMultipleWords && !hasLongWord) {
    return 'Please enter your full name (first and last name recommended)'
  }
  
  // Reject obvious fake names
  const fakeNames = [
    /^test/i,
    /^demo/i,
    /^admin/i,
    /^user/i,
    /^john\s*doe/i,
    /^xxx/i,
    /^asdf/i,
  ]
  
  if (fakeNames.some(pattern => pattern.test(trimmed))) {
    return 'Please enter your actual name'
  }
  
  return null
}

/**
 * Validate phone number field - enhanced with fake number detection
 * Required, exactly 10 digits, numeric only, must be valid Indian format
 */
export const validatePhone = (phone: string | undefined): string | null => {
  if (!phone || phone.trim().length === 0) {
    return 'Phone number is required'
  }
  
  if (!/^\d+$/.test(phone)) {
    return 'Phone number must contain only digits'
  }
  
  if (phone.length !== 10) {
    return 'Phone number must be exactly 10 digits'
  }
  
  // Reject obviously fake phone numbers
  const fakePhonesPatterns = [
    /^0+$/, // all zeros
    /^1+$/, // all ones
    /^2+$/, // all twos
    /^9+$/, // all nines
    /^1111111111$/, // 1111111111
    /^0000000000$/, // 0000000000
    /^1234567890$/, // sequential
    /^9876543210$/, // reverse sequential
  ]
  
  if (fakePhonesPatterns.some(pattern => pattern.test(phone))) {
    return 'Please enter a valid phone number'
  }
  
  // Valid Indian mobile numbers usually start with 6-9
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return 'Please enter a valid Indian mobile number (starting with 6-9)'
  }
  
  return null
}

/**
 * Validate pincode field
 * Required, exactly 6 digits
 */
export const validatePincode = (pincode: string | undefined): string | null => {
  if (!pincode || pincode.trim().length === 0) {
    return 'Pincode is required'
  }
  if (!/^\d{6}$/.test(pincode)) {
    return 'Pincode must be exactly 6 digits'
  }
  // Block obviously fake pincodes
  const fakePincodes = ['000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999']
  if (fakePincodes.includes(pincode)) {
    return 'Please enter a valid pincode'
  }
  return null
}

/**
 * Validate address line field
 * Required, minimum 15 characters
 */
// REMOVED - see enhanced validateAddressLine above

/**
 * Validate city field
 * Required, auto-filled from pincode
 */
export const validateCity = (city: string | undefined): string | null => {
  if (!city || city.trim().length === 0) {
    return 'City is required'
  }
  return null
}

/**
 * Validate state field
 * Required, auto-filled from pincode
 */
export const validateState = (state: string | undefined): string | null => {
  if (!state || state.trim().length === 0) {
    return 'State is required'
  }
  return null
}

/**
 * Validate a single field
 */
export const validateField = (fieldName: string, value: string | undefined): string | null => {
  switch (fieldName) {
    case 'name':
      return validateName(value)
    case 'phone':
      return validatePhone(value)
    case 'pincode':
      return validatePincode(value)
    case 'line1':
      return validateAddressLine(value)
    case 'city':
      return validateCity(value)
    case 'state':
      return validateState(value)
    default:
      return null
  }
}

/**
 * Validate entire address form
 * Returns all field errors
 */
export const validateAddressForm = (formData: AddressFormData): FieldErrors => {
  const errors: FieldErrors = {
    name: validateName(formData.name),
    phone: validatePhone(formData.phone),
    pincode: validatePincode(formData.pincode),
    line1: validateAddressLine(formData.line1),
    city: validateCity(formData.city),
    state: validateState(formData.state),
  }
  return errors
}

/**
 * Check if entire form is valid
 */
export const isAddressFormValid = (formData: AddressFormData): boolean => {
  const errors = validateAddressForm(formData)
  return Object.values(errors).every(error => error === null)
}

/**
 * Get all validation errors as array
 */
export const getAddressFormErrors = (formData: AddressFormData): FieldError[] => {
  const errors = validateAddressForm(formData)
  return Object.entries(errors)
    .filter(([, error]) => error !== null)
    .map(([field, message]) => ({ field, message: message! }))
}

/**
 * Format phone number as user types (optional)
 * Converts "9876543210" to "987-654-3210"
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
}
