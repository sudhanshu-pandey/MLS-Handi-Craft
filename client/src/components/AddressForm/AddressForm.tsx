import { ChangeEvent, FocusEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { Address } from '../../context/CommerceContext'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import useAddressValidation from '../../hooks/useAddressValidation'
import api from '../../services/api'
import styles from './AddressForm.module.css'

/* ─── props ──────────────────────────────────────────────── */

interface AddressFormProps {
  initialAddress?: Partial<Address>
  submitLabel?: string
  onSubmit: (address: Address) => void
  onCancel?: () => void
}

/* ─── component ──────────────────────────────────────────── */

const AddressForm = ({
  initialAddress = {},
  submitLabel = 'Save address',
  onSubmit,
  onCancel,
}: AddressFormProps) => {
  const [form, setForm] = useState<any>({
    label: (initialAddress as any)?.label || 'Home',
    name: (initialAddress as any)?.name ?? '',
    phone: (initialAddress as any)?.phone ?? '',
    line1: (initialAddress as any)?.line1 ?? '',
    line2: (initialAddress as any)?.line2 ?? '',
    city: (initialAddress as any)?.city ?? '',
    state: (initialAddress as any)?.state ?? '',
    pincode: (initialAddress as any)?.pincode ?? '',
    landmark: (initialAddress as any)?.landmark ?? '',
  })

  const validation = useAddressValidation()
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle')
  const [cityLocked, setCityLocked] = useState(false)
  const [stateLocked, setStateLocked] = useState(false)
  const lookupAbortRef = useRef<AbortController | null>(null)

  const debouncedPincode = useDebouncedValue(form.pincode, 400)

  /* ── auto-fill city/state on valid pincode ──────────────── */
  useEffect(() => {
    const pincode = debouncedPincode.trim()

    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus('idle')
      return
    }

    lookupAbortRef.current?.abort()
    lookupAbortRef.current = new AbortController()
    setPincodeStatus('loading')

    api.lookupPincode(pincode)
      .then((response: any) => {
        if (response.success && response.data) {
          setForm((current: any) => ({
            ...current,
            city: response.data.city,
            state: response.data.state,
          }))
          setCityLocked(true)
          setStateLocked(true)
          setPincodeStatus('found')
        } else {
          setPincodeStatus('not_found')
          setCityLocked(false)
          setStateLocked(false)
        }
      })
      .catch(() => {
        setPincodeStatus('not_found')
        setCityLocked(false)
        setStateLocked(false)
      })
  }, [debouncedPincode])

  /* ── field change ───────────────────────────────────────── */
  const handleChange = (key: keyof Address) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    if (key === 'phone' && !/^\d*$/.test(value)) {
      return // block non-numeric phone entry
    }

    if (key === 'pincode' && !/^\d*$/.test(value)) {
      return // block non-numeric pincode entry
    }

    setForm((current: any) => ({ ...current, [key]: value }))
  }

  /* ── field blur ─────────────────────────────────────────── */
  const handleBlur = (fieldName: string) => (_event?: FocusEvent<HTMLInputElement>) => {
    validation.setFieldTouched(fieldName)
    validation.validateField(fieldName, form[fieldName])
  }

  /* ── validate all fields before submit ──────────────────── */
  const validateAll = (): boolean => {
    return validation.validateForm(form)
  }

  /* ── form submit ────────────────────────────────────────── */
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!validateAll()) {
      return
    }

    onSubmit(form)
  }

  /* ── is form currently valid (for button state) ─────────── */
  const isFormValid = (): boolean => {
    return validation.isValid && pincodeStatus !== 'not_found' && pincodeStatus !== 'loading'
  }

  /* ── field input class helper ───────────────────────────── */
  const inputClass = (key: string, extra = '') => {
    const hasError = validation.isFieldTouched(key) && validation.hasFieldError(key)
    const hasValue = (form[key] as string).trim().length > 0
    const isValid = !validation.hasFieldError(key)
    return [
      styles.input,
      hasError ? styles.inputError : '',
      !hasError && hasValue && isValid ? styles.inputSuccess : '',
      extra,
    ]
      .filter(Boolean)
      .join(' ')
  }

  /* ── error message helper ───────────────────────────────── */
  const errorFor = (key: string) =>
    validation.isFieldTouched(key) && validation.hasFieldError(key) ? (
      <span className={styles.errorMsg} role="alert" data-testid={`error-${key}`}>
        ⚠ {validation.getFieldError(key)}
      </span>
    ) : null

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.grid2}>
        {/* Label */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="addr-label">
            Label <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrap}>
            <select
              id="addr-label"
              className={inputClass('label' as any)}
              value={form.label}
              onChange={(e: any) => {
                setForm((prev: any) => ({ ...prev, label: e.target.value }))
                validation.validateField('label', e.target.value)
              }}
              onBlur={() => handleBlur('label')}
              data-testid="address-label"
            >
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {errorFor('label' as any)}
        </div>
      </div>

      <div className={styles.grid2}>
        {/* Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="addr-name">
            Full Name <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrap}>
            <input
              id="addr-name"
              className={inputClass('name')}
              placeholder="Your full name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange('name' as any)}
              onBlur={handleBlur('name')}
              data-testid="address-name"
            />
          </div>
          {errorFor('name')}
        </div>

        {/* Phone */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="addr-phone">
            Phone Number <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrap}>
            <input
              id="addr-phone"
              className={inputClass('phone')}
              placeholder="10-digit mobile number"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={handleChange('phone' as any)}
              onBlur={handleBlur('phone')}
              data-testid="address-phone"
            />
          </div>
          {errorFor('phone')}
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="addr-pincode">
          Pincode <span className={styles.required}>*</span>
        </label>
        <div className={styles.pincodeRow}>
          <div className={styles.inputWrap}>
            <input
              id="addr-pincode"
              className={inputClass('pincode')}
              placeholder="6-digit pincode"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={handleChange('pincode')}
              onBlur={handleBlur('pincode')}
              data-testid="address-pincode"
            />
          </div>
          {pincodeStatus === 'loading' && (
            <span className={styles.pincodeStatus}>
              <span className={styles.spinner} /> Checking…
            </span>
          )}
          {pincodeStatus === 'found' && (
            <span className={`${styles.pincodeStatus} ${styles.pincodeOk}`} data-testid="pincode-ok">
              ✓ Serviceable
            </span>
          )}
          {pincodeStatus === 'not_found' && (
            <span className={`${styles.pincodeStatus} ${styles.pincodeFail}`} data-testid="pincode-fail">
              ✗ Not serviceable
            </span>
          )}
        </div>
        {errorFor('pincode')}
      </div>

      <div className={styles.grid2}>
        {/* City — auto-filled */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="addr-city">
            City <span className={styles.required}>*</span>
            {cityLocked && (
              <button
                type="button"
                className={styles.overrideBtn}
                onClick={() => setCityLocked(false)}
                tabIndex={-1}
              >
              </button>
            )}
          </label>
          <input
            id="addr-city"
            className={[inputClass('city'), cityLocked ? styles.inputReadonly : ''].filter(Boolean).join(' ')}
            placeholder="City"
            autoComplete="address-level2"
            readOnly={cityLocked}
            value={form.city}
            onChange={handleChange('city')}
            onBlur={handleBlur('city')}
            data-testid="address-city"
          />
          {errorFor('city')}
        </div>

        {/* State — auto-filled */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="addr-state">
            State <span className={styles.required}>*</span>
            {stateLocked && (
              <button
                type="button"
                className={styles.overrideBtn}
                onClick={() => setStateLocked(false)}
                tabIndex={-1}
              >
              </button>
            )}
          </label>
          <input
            id="addr-state"
            className={[inputClass('state'), stateLocked ? styles.inputReadonly : ''].filter(Boolean).join(' ')}
            placeholder="State"
            autoComplete="address-level1"
            readOnly={stateLocked}
            value={form.state}
            onChange={handleChange('state')}
            onBlur={handleBlur('state')}
            data-testid="address-state"
          />
          {errorFor('state')}
        </div>
      </div>

      {/* Address line 1 */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="addr-line1">
          Address line 1 <span className={styles.required}>*</span>
        </label>
        <input
          id="addr-line1"
          className={inputClass('line1')}
          placeholder="House/flat, street name"
          autoComplete="address-line1"
          value={form.line1}
          onChange={handleChange('line1')}
          onBlur={handleBlur('line1')}
          data-testid="address-line1"
        />
        {errorFor('line1')}
      </div>

      <div className={styles.grid2}>
        {/* Address line 2 optional */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="addr-line2">
            Address line 2 <span style={{ color: 'var(--text-light)', fontSize: 11 }}>(optional)</span>
          </label>
          <input
            id="addr-line2"
            className={styles.input}
            placeholder="Apartment, area"
            autoComplete="address-line2"
            value={form.line2}
            onChange={handleChange('line2')}
          />
        </div>

        {/* Landmark optional */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="addr-landmark">
            Landmark <span style={{ color: 'var(--text-light)', fontSize: 11 }}>(optional)</span>
          </label>
          <input
            id="addr-landmark"
            className={styles.input}
            placeholder="Near …"
            value={form.landmark}
            onChange={handleChange('landmark')}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isFormValid()}
          data-testid="address-submit-btn"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '13px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              background: 'transparent',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default AddressForm
