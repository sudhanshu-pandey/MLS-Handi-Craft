import { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input'
import countryLabels from 'react-phone-number-input/locale/en.json'
import { useAuth } from '../../context/AuthContext'
import styles from './LoginModal.module.css'
import { fetchAddresses } from '../../store/slices/addressSlice'
import { useAppDispatch } from '../../store/hooks'

type LoginModalProps = {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: (identifier: string, provider?: 'mobile' | 'google') => void
}

const OTP_LENGTH = 6
const RESEND_SECONDS = 30
const DROPDOWN_CLOSE_ANIMATION_MS = 300
const DROPDOWN_MAX_HEIGHT = 220
const DROPDOWN_MIN_WIDTH = 260
const SUPPORTED_COUNTRIES = getCountries()
const DEFAULT_COUNTRY_ID = (SUPPORTED_COUNTRIES.find((country) => country === 'IN') ?? SUPPORTED_COUNTRIES[0])
type CountryId = (typeof SUPPORTED_COUNTRIES)[number]

type CountryConfig = {
  id: CountryId
  label: string
  code: string
}

type MenuPosition = {
  top: number
  left: number
  width: number
}

const COUNTRY_OPTIONS: CountryConfig[] = SUPPORTED_COUNTRIES.map((country) => ({
  id: country,
  label: countryLabels[country] ?? country,
  code: `+${getCountryCallingCode(country)}`,
})).sort((left, right) => left.label.localeCompare(right.label))

const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const { sendOTP, verifyOTP } = useAuth()
  const [authMethod, setAuthMethod] = useState<'mobile' | 'google'>('mobile')
  const [selectedCountryId, setSelectedCountryId] = useState<CountryId>(DEFAULT_COUNTRY_ID)
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false)
  const [isCountryMenuMounted, setIsCountryMenuMounted] = useState(false)
  const [mobile, setMobile] = useState('')
  const [fullPhone, setFullPhone] = useState('')
  const [mobileError, setMobileError] = useState('')
  const [step, setStep] = useState<'mobile' | 'otp' | 'success'>('mobile')
  const [successProvider, setSuccessProvider] = useState<'mobile' | 'google'>('mobile')
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS)
  const [otpError, setOtpError] = useState('')
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, left: 0, width: DROPDOWN_MIN_WIDTH })
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const dispatch = useAppDispatch();
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])
  const countryWrapRef = useRef<HTMLDivElement | null>(null)
  const countryMenuRef = useRef<HTMLDivElement | null>(null)
  const countryButtonRef = useRef<HTMLButtonElement | null>(null)

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find((item) => item.id === selectedCountryId) ?? COUNTRY_OPTIONS.find((item) => item.id === DEFAULT_COUNTRY_ID) ?? COUNTRY_OPTIONS[0],
    [selectedCountryId]
  )

  const parsedPhoneNumber = useMemo(() => {
    if (!mobile) {
      return undefined
    }

    const normalizedMobile = mobile.replace(/\D/g, '')
    if (!normalizedMobile) {
      return undefined
    }

    try {
      // Build the international format number
      // Extract country code without the + sign
      const countryCodeWithoutPlus = selectedCountry.code.replace('+', '')
      const internationalNumber = `+${countryCodeWithoutPlus}${normalizedMobile}`
      
      // Parse it to validate format
      return parsePhoneNumber(internationalNumber)
    } catch {
      return undefined
    }
  }, [mobile, selectedCountryId, selectedCountry])

  const resetState = () => {
    setAuthMethod('mobile')
    setSelectedCountryId(DEFAULT_COUNTRY_ID)
    setIsCountryMenuOpen(false)
    setIsCountryMenuMounted(false)
    setStep('mobile')
    setSuccessProvider('mobile')
    setMobile('')
    setFullPhone('')
    setMobileError('')
    setOtpDigits(Array(OTP_LENGTH).fill(''))
    setOtpError('')
    setResendTimer(RESEND_SECONDS)
    setIsSending(false)
    setIsVerifying(false)
  }

  const maskedMobile = useMemo(() => {
    const nationalNumber = parsedPhoneNumber?.nationalNumber ?? mobile.replace(/\D/g, '')

    if (nationalNumber.length < 4) {
      return nationalNumber
    }
    return `${nationalNumber.slice(0, 2)}******${nationalNumber.slice(-2)}`
  }, [mobile, parsedPhoneNumber])

  useEffect(() => {
    if (!isOpen) {
      resetState()
      return
    }

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || step !== 'otp') {
      return
    }

    if (resendTimer <= 0) {
      return
    }

    const interval = window.setInterval(() => {
      setResendTimer((prev) => prev - 1)
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [isOpen, step, resendTimer])

  useEffect(() => {
    if (!isOpen || !isCountryMenuOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node

      if (countryButtonRef.current?.contains(target)) {
        return
      }

      if (countryWrapRef.current?.contains(target)) {
        return
      }

      if (countryMenuRef.current?.contains(target)) {
        return
      }

      setIsCountryMenuOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, isCountryMenuOpen])

  useEffect(() => {
    if (isCountryMenuOpen) {
      setIsCountryMenuMounted(true)
      return
    }

    const closeTimer = window.setTimeout(() => {
      setIsCountryMenuMounted(false)
    }, DROPDOWN_CLOSE_ANIMATION_MS)

    return () => {
      window.clearTimeout(closeTimer)
    }
  }, [isCountryMenuOpen])

  useEffect(() => {
    if (!isOpen || !isCountryMenuOpen || !countryButtonRef.current) {
      return
    }

    const updateMenuPosition = () => {
      const buttonRect = countryButtonRef.current?.getBoundingClientRect()
      if (!buttonRect) {
        return
      }

      const viewportGap = 8
      const menuWidth = Math.max(buttonRect.width, DROPDOWN_MIN_WIDTH)
      let top = buttonRect.bottom + 6
      let left = buttonRect.left

      if (top + DROPDOWN_MAX_HEIGHT > window.innerHeight - viewportGap) {
        top = buttonRect.top - DROPDOWN_MAX_HEIGHT - 6
      }

      if (left + menuWidth > window.innerWidth - viewportGap) {
        left = window.innerWidth - menuWidth - viewportGap
      }

      if (left < viewportGap) {
        left = viewportGap
      }

      if (top < viewportGap) {
        top = viewportGap
      }

      setMenuPosition({
        top,
        left,
        width: menuWidth,
      })
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOpen, isCountryMenuOpen])

  useEffect(() => {
    if (!isCountryMenuOpen) {
      return
    }

    const selectedOption = countryMenuRef.current?.querySelector('[aria-selected="true"]') as HTMLElement | null
    selectedOption?.scrollIntoView({ block: 'nearest' })
  }, [isCountryMenuOpen, selectedCountryId])

  useEffect(() => {
    if (step === 'otp' && isOpen) {
      otpRefs.current[0]?.focus()
    }
  }, [step, isOpen])

  if (!isOpen) {
    return null
  }

  const closeAndReset = () => {
    onClose()
    setTimeout(() => {
      resetState()
    }, 180)
  }

  const handleMobileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '')
    setMobile(value)
    if (mobileError) {
      setMobileError('')
    }
  }

  const handleMobileKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSendOtp()
    }
  }

  const switchMethod = (method: 'mobile' | 'google') => {
    setAuthMethod(method)
    setStep('mobile')
    setIsCountryMenuOpen(false)
    setMobileError('')
    setOtpError('')
  }

  const handleCountrySelect = (countryId: CountryId) => {
    setSelectedCountryId(countryId)
    setIsCountryMenuOpen(false)
    setMobile('')
    setMobileError('')
  }

  const handleCountryToggle = () => {
    setIsCountryMenuOpen((prev) => !prev)
  }

  const handleCountryListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsCountryMenuOpen(false)
      countryButtonRef.current?.focus()
    }
  }

  const handleCountryOptionClick = (countryId: CountryId) => {
    handleCountrySelect(countryId)
    countryButtonRef.current?.focus()
  }

  const handleSendOtp = async () => {
    if (!parsedPhoneNumber || !isValidPhoneNumber(parsedPhoneNumber.number)) {
      setMobileError(`Please enter a valid mobile number for ${selectedCountry.label}`)
      return
    }

    // Build the clean international format: +CC + number (no formatting)
    const normalizedMobile = mobile.replace(/\D/g, '')
    const countryCodeWithoutPlus = selectedCountry.code.replace('+', '')
    const phoneNumber = `+${countryCodeWithoutPlus}${normalizedMobile}`
    
    try {
      setIsSending(true)
      setMobileError('')
      setOtpError('')
      
      await sendOTP(phoneNumber)
      
      setFullPhone(phoneNumber)
      setMobile(parsedPhoneNumber.nationalNumber)
      setStep('otp')
      setOtpDigits(Array(OTP_LENGTH).fill(''))
      setResendTimer(RESEND_SECONDS)
    } catch (err: any) {
      setMobileError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const normalized = value.replace(/\D/g, '').slice(-1)

    setOtpDigits((prev) => {
      const next = [...prev]
      next[index] = normalized
      return next
    })

    if (otpError) {
      setOtpError('')
    }

    if (normalized && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      handleVerifyOtp()
    }
  }

  const handleVerifyOtp = async () => {
    const otpValue = otpDigits.join('')
    if (otpValue.length !== OTP_LENGTH) {
      setOtpError('Please enter the complete OTP code')
      return
    }

    try {
      setIsVerifying(true)
      setOtpError('')
      
      await verifyOTP(fullPhone, otpValue)
      
      setSuccessProvider('mobile')
      setStep('success')
      dispatch(fetchAddresses());
      onLoginSuccess?.(parsedPhoneNumber?.number ?? `${selectedCountry.code}${mobile}`, 'mobile')
    } catch (err: any) {
      setOtpError(err.message || 'Failed to verify OTP. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleGoogleLogin = () => {
    setSuccessProvider('google')
    setStep('success')
    onLoginSuccess?.('9999999999', 'google')
  }

  const handleResend = async () => {
    if (resendTimer > 0) {
      return
    }
    
    try {
      setIsSending(true)
      setOtpError('')
      
      await sendOTP(fullPhone)
      
      setOtpDigits(Array(OTP_LENGTH).fill(''))
      setResendTimer(RESEND_SECONDS)
      otpRefs.current[0]?.focus()
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={closeAndReset} role="presentation">
      <section className={styles.modal} onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-label="Sign in">
        <button type="button" className={styles.closeButton} onClick={closeAndReset} aria-label="Close login modal">
          ×
        </button>

        <div className={styles.modalHeader}>
          <p className={styles.pill}>Secure Access</p>
          <h2>Login</h2>
          <p>Select your preferred sign in method to continue.</p>
        </div>

        {step === 'mobile' ? (
          <div className={styles.methodSwitch} role="tablist" aria-label="Login methods">
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'mobile'}
              className={`${styles.methodButton} ${authMethod === 'mobile' ? styles.activeMethod : ''}`}
              onClick={() => switchMethod('mobile')}
            >
              Mobile OTP
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === 'google'}
              className={`${styles.methodButton} ${authMethod === 'google' ? styles.activeMethod : ''}`}
              onClick={() => switchMethod('google')}
            >
              Google
            </button>
          </div>
        ) : null}

        {step === 'mobile' && authMethod === 'mobile' ? (
          <div className={styles.section}>
            <label htmlFor="mobile" className={styles.label}>Mobile Number</label>
            <div className={styles.mobileInputWrap}>
              <div className={styles.countrySelectWrap} ref={countryWrapRef}>
                <button
                  ref={countryButtonRef}
                  type="button"
                  aria-label="Country code"
                  aria-haspopup="listbox"
                  aria-expanded={isCountryMenuOpen}
                  className={styles.countrySelect}
                  onClick={handleCountryToggle}
                >
                  <span className={styles.countryCodeValue}>{selectedCountry.code}</span>
                  <span className={styles.countryMetaValue}>{selectedCountry.id}</span>
                  <span className={styles.countryChevron} aria-hidden="true">▾</span>
                </button>
              </div>
              {isCountryMenuMounted && createPortal(
                <div
                  ref={countryMenuRef}
                  className={`${styles.countryMenu} ${isCountryMenuOpen ? styles.countryMenuOpen : styles.countryMenuClosing}`}
                  role="listbox"
                  aria-label="Country codes"
                  onKeyDown={handleCountryListKeyDown}
                  style={{
                    top: `${menuPosition.top}px`,
                    left: `${menuPosition.left}px`,
                    width: `${menuPosition.width}px`,
                  }}
                >
                  {COUNTRY_OPTIONS.map((country) => {
                    const isSelected = country.id === selectedCountryId

                    return (
                      <button
                        key={country.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`${styles.countryOption} ${isSelected ? styles.countryOptionActive : ''}`}
                        onClick={() => handleCountryOptionClick(country.id)}
                      >
                        <span className={styles.countryOptionCode}>{country.code}</span>
                        <span className={styles.countryOptionLabel}>{country.label}</span>
                      </button>
                    )
                  })}
                </div>,
                document.body
              )}
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                onKeyDown={handleMobileKeyDown}
                placeholder="Phone number"
                inputMode="tel"
                autoComplete="tel-national"
                autoFocus
              />
            </div>
            <p className={styles.helper}>Enter a valid mobile number for {selectedCountry.label}.</p>
            {mobileError ? <p className={styles.error}>{mobileError}</p> : null}

            <button 
              type="button" 
              className={styles.primaryButton} 
              onClick={handleSendOtp}
              disabled={isSending}
            >
              {isSending ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <div className={styles.divider}><span>or</span></div>
            <button type="button" className={styles.googleButton} onClick={() => switchMethod('google')}>
              <span className={styles.googleIcon} aria-hidden="true">G</span>
              Continue with Google
            </button>
            <p className={styles.helper}>By continuing, you agree to our terms and privacy policy.</p>
          </div>
        ) : null}

        {step === 'mobile' && authMethod === 'google' ? (
          <div className={styles.section}>
            <p className={styles.infoText}>Use your Google account for a faster and secure sign in.</p>
            <button type="button" className={styles.googleButton} onClick={handleGoogleLogin}>
              <span className={styles.googleIcon} aria-hidden="true">G</span>
              Continue with Google
            </button>
            <div className={styles.divider}><span>or</span></div>
            <button type="button" className={styles.primaryButton} onClick={() => switchMethod('mobile')}>
              Login with Mobile OTP
            </button>
            <p className={styles.helper}>By continuing, you agree to our terms and privacy policy.</p>
          </div>
        ) : null}

        {step === 'otp' ? (
          <div className={styles.section}>
            <p className={styles.infoText}>Enter the 6-digit OTP sent to {selectedCountry.code} {maskedMobile}</p>

            <div className={styles.otpGrid}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    otpRefs.current[index] = node
                  }}
                  value={digit}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            {otpError ? <p className={styles.error}>{otpError}</p> : null}

            <button 
              type="button" 
              className={styles.primaryButton} 
              onClick={handleVerifyOtp}
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying OTP...' : 'Verify OTP'}
            </button>

            <div className={styles.inlineActions}>
              <button 
                type="button" 
                className={styles.textButton} 
                onClick={() => setStep('mobile')}
                disabled={isVerifying || isSending}
              >
                Change Number
              </button>
              <button 
                type="button" 
                className={styles.textButton} 
                onClick={handleResend} 
                disabled={resendTimer > 0 || isSending}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        ) : null}

        {step === 'success' ? (
          <div className={styles.successSection}>
            <div className={styles.successIcon}>✓</div>
            <h3>Login Successful</h3>
            <p>
              {successProvider === 'google'
                ? 'Your Google account is connected. Welcome back to MLS Handicrafts.'
                : 'Your mobile number is verified. Welcome back to MLS Handicrafts.'}
            </p>
            <button type="button" className={styles.primaryButton} onClick={closeAndReset}>
              Continue Shopping
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default LoginModal
