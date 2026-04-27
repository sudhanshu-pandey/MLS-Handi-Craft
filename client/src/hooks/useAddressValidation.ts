/**
 * useAddressValidation Hook
 * Reusable validation logic for address forms
 */

import { useState, useCallback } from 'react'
import {
  validateField,
  validateAddressForm,
  isAddressFormValid,
  type AddressFormData,
  type FieldErrors,
} from '../utils/addressFieldValidation'

export interface UseAddressValidationResult {
  // State
  errors: FieldErrors
  touched: Record<string, boolean>
  isValid: boolean

  // Methods
  validateField: (fieldName: string, value: string | undefined) => void
  validateForm: (formData: AddressFormData) => boolean
  setFieldTouched: (fieldName: string) => void
  setFieldError: (fieldName: string, error: string | null) => void
  clearErrors: () => void
  resetValidation: () => void
  getFieldError: (fieldName: string) => string | null
  hasFieldError: (fieldName: string) => boolean
  isFieldTouched: (fieldName: string) => boolean
}

export const useAddressValidation = (): UseAddressValidationResult => {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  /**
   * Validate a single field
   */
  const validateFieldHandler = useCallback((fieldName: string, value: string | undefined) => {
    const error = validateField(fieldName, value)
    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }))
  }, [])

  /**
   * Validate entire form
   */
  const validateFormHandler = useCallback((formData: AddressFormData): boolean => {
    const formErrors = validateAddressForm(formData)
    setErrors(formErrors)
    return isAddressFormValid(formData)
  }, [])

  /**
   * Mark field as touched
   */
  const setFieldTouchedHandler = useCallback((fieldName: string) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true,
    }))
  }, [])

  /**
   * Manually set field error
   */
  const setFieldErrorHandler = useCallback((fieldName: string, error: string | null) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }))
  }, [])

  /**
   * Clear all errors
   */
  const clearErrorsHandler = useCallback(() => {
    setErrors({})
  }, [])

  /**
   * Reset all validation state
   */
  const resetValidationHandler = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  /**
   * Get error for specific field
   */
  const getFieldErrorHandler = useCallback((fieldName: string): string | null => {
    return errors[fieldName] || null
  }, [errors])

  /**
   * Check if field has error
   */
  const hasFieldErrorHandler = useCallback((fieldName: string): boolean => {
    return errors[fieldName] !== null && errors[fieldName] !== undefined
  }, [errors])

  /**
   * Check if field was touched
   */
  const isFieldTouchedHandler = useCallback((fieldName: string): boolean => {
    return touched[fieldName] === true
  }, [touched])

  /**
   * Check if entire form is valid
   */
  const isValid = Object.values(errors).every(error => error === null || error === undefined)

  return {
    // State
    errors,
    touched,
    isValid,

    // Methods
    validateField: validateFieldHandler,
    validateForm: validateFormHandler,
    setFieldTouched: setFieldTouchedHandler,
    setFieldError: setFieldErrorHandler,
    clearErrors: clearErrorsHandler,
    resetValidation: resetValidationHandler,
    getFieldError: getFieldErrorHandler,
    hasFieldError: hasFieldErrorHandler,
    isFieldTouched: isFieldTouchedHandler,
  }
}

export default useAddressValidation
