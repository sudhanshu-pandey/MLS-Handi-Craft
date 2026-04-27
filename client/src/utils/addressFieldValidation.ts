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
 * Validate name field
 * Required, minimum 3 characters, letters and spaces only
 */
export const validateName = (name: string | undefined): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Name is required'
  }
  if (name.trim().length < 3) {
    return 'Name must be at least 3 characters'
  }
  if (name.trim().length > 50) {
    return 'Name must not exceed 50 characters'
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes'
  }
  return null
}

/**
 * Validate phone number field
 * Required, exactly 10 digits, numeric only
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
export const validateAddressLine = (line: string | undefined): string | null => {
  if (!line || line.trim().length === 0) {
    return 'Address is required'
  }
  if (line.trim().length < 8) {
    return 'Address must be at least 8 characters'
  }
  if (line.trim().length > 100) {
    return 'Address must not exceed 100 characters'
  }
  return null
}

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
