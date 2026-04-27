import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import { FiShield, FiUsers, FiGift, FiCreditCard, FiHeart } from 'react-icons/fi'
import { MdOutlineVolunteerActivism, MdEmail } from 'react-icons/md'
import { RiBankCardLine, RiBankLine, RiQrCodeLine } from 'react-icons/ri'
import './Donate.css'

type DonationFrequency = 'one-time' | 'monthly'
type PaymentMethod = 'upi' | 'card' | 'netbanking'

type DonationForm = {
  name: string
  email: string
  amount: string
  message: string
  inMemory: boolean
  memoryName: string
  wantsReceipt: boolean
}

const DONATION_AMOUNTS = [100, 500, 1000, 5000]
const RAISED_AMOUNT = 50000
const TARGET_AMOUNT = 100000

const WHY_DONATE_CARDS = [
  {
    title: 'Support Artisans',
    description: 'Your support provides stable work opportunities and fair wages for local makers.',
    icon: FiUsers,
  },
  {
    title: 'Preserve Culture',
    description: 'Help keep traditional Indian craft techniques alive for future generations.',
    icon: MdOutlineVolunteerActivism,
  },
  {
    title: 'Empower Families',
    description: 'Each contribution strengthens family livelihoods in rural artisan communities.',
    icon: FiGift,
  },
  {
    title: 'Build Sustainable Growth',
    description: 'Funding helps create long-term income and resilient local craft ecosystems.',
    icon: FiHeart,
  },
]

const IMPACT_ITEMS = [
  { amount: 500, label: 'supports 1 artisan' },
  { amount: 1000, label: 'supports 1 family' },
  { amount: 5000, label: 'supports community training' },
]

const GALLERY_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Artisan workspace showcasing handcrafted decor items',
  },
  {
    src: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
    alt: 'Traditional handmade textile and handicraft products',
  },
  {
    src: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Craftsman creating detailed handmade wooden products',
  },
  {
    src: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Display of authentic artisan handicraft pieces in a curated setting',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'Your donation helped 200 artisans access regular work and better market opportunities over the last year.',
    author: 'Community Development Team',
  },
  {
    quote:
      'Small monthly contributions helped us fund skill workshops, preserving regional craft traditions with pride.',
    author: 'Rural Artisan Cluster Lead',
  },
]

const Donate = () => {
  const [donationFrequency, setDonationFrequency] = useState<DonationFrequency>('one-time')
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(500)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [form, setForm] = useState<DonationForm>({
    name: '',
    email: '',
    amount: '500',
    message: '',
    inMemory: false,
    memoryName: '',
    wantsReceipt: true,
  })

  const impactProgress = useMemo(() => {
    return Math.min((RAISED_AMOUNT / TARGET_AMOUNT) * 100, 100)
  }, [])

  const handlePresetAmount = (amount: number) => {
    setSelectedAmount(amount)
    setForm((prev) => ({ ...prev, amount: String(amount) }))
  }

  const handleCustomAmount = () => {
    setSelectedAmount('custom')
    setForm((prev) => ({ ...prev, amount: '' }))
  }

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target

    if (type === 'checkbox') {
      const checked = (event.target as HTMLInputElement).checked
      setForm((prev) => ({ ...prev, [name]: checked }))
      return
    }

    if (name === 'amount') {
      const normalized = value.replace(/[^0-9]/g, '')
      setForm((prev) => ({ ...prev, amount: normalized }))
      setSelectedAmount('custom')
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleDonateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedAmount = Number(form.amount)
    const isNameValid = form.name.trim().length > 1
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)

    if (!isNameValid || !isEmailValid || normalizedAmount <= 0) {
      setSubmitMessage('Please provide a valid name, email, and donation amount.')
      return
    }

    setIsSubmitting(true)
    setSubmitMessage('')

    const donorPayload = {
      donorName: form.name,
      donorEmail: form.email,
      amount: normalizedAmount,
      donationFrequency,
      paymentMethod,
      inMemory: form.inMemory,
      memoryName: form.memoryName,
      wantsReceipt: form.wantsReceipt,
      message: form.message,
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('donorInfo', JSON.stringify(donorPayload))
    }

    window.setTimeout(() => {
      setIsSubmitting(false)
      setSubmitMessage('Thank you for your support! This is a secure mock payment flow and your receipt will be emailed shortly.')
    }, 600)
  }

  const scrollToForm = () => {
    const formSection = document.getElementById('donation-form')
    formSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="donatePage">
      <section className="donateHero">
        <div className="donateHeroOverlay" />
        <div className="container donateHeroContent">
          <p className="donateEyebrow">Donate Us</p>
          <h1>Support Our Artisans</h1>
          <p>Help preserve Indian handicrafts & empower rural communities</p>
          <button type="button" className="donatePrimaryButton" onClick={scrollToForm}>
            Donate Now
          </button>
        </div>
      </section>

      <section className="donateSection">
        <div className="container">
          <h2 className="donateSectionTitle">Why Donate</h2>
          <div className="whyDonateGrid">
            {WHY_DONATE_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <article key={card.title} className="whyDonateCard">
                  <span className="cardIcon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="donateSection donateSectionAlt" id="donation-form">
        <div className="container donateFormLayout">
          <div className="donationOptionsPanel">
            <h2 className="donateSectionTitle">Donation Options</h2>

            <div className="frequencyToggle" role="tablist" aria-label="Donation frequency">
              <button
                type="button"
                role="tab"
                aria-selected={donationFrequency === 'one-time'}
                className={donationFrequency === 'one-time' ? 'toggleButton toggleButtonActive' : 'toggleButton'}
                onClick={() => setDonationFrequency('one-time')}
              >
                One-time
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={donationFrequency === 'monthly'}
                className={donationFrequency === 'monthly' ? 'toggleButton toggleButtonActive' : 'toggleButton'}
                onClick={() => setDonationFrequency('monthly')}
              >
                Monthly
              </button>
            </div>

            <div className="amountGrid" role="radiogroup" aria-label="Donation amount options">
              {DONATION_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  role="radio"
                  aria-checked={selectedAmount === amount}
                  className={selectedAmount === amount ? 'amountChip amountChipActive' : 'amountChip'}
                  onClick={() => handlePresetAmount(amount)}
                >
                  ₹{amount}
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={selectedAmount === 'custom'}
                className={selectedAmount === 'custom' ? 'amountChip amountChipActive' : 'amountChip'}
                onClick={handleCustomAmount}
              >
                Custom
              </button>
            </div>

            <form className="donationForm" onSubmit={handleDonateSubmit}>
              <label htmlFor="donorName">Name</label>
              <input
                id="donorName"
                name="name"
                value={form.name}
                onChange={handleFieldChange}
                placeholder="Your full name"
                required
              />

              <label htmlFor="donorEmail">Email</label>
              <input
                id="donorEmail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleFieldChange}
                placeholder="you@example.com"
                required
              />

              <label htmlFor="donationAmount">Amount</label>
              <input
                id="donationAmount"
                name="amount"
                inputMode="numeric"
                value={form.amount}
                onChange={handleFieldChange}
                placeholder="Enter amount"
                required
              />

              <label htmlFor="donorMessage">Message (optional)</label>
              <textarea
                id="donorMessage"
                name="message"
                rows={4}
                value={form.message}
                onChange={handleFieldChange}
                placeholder="Share your encouragement for artisans"
              />

              <label className="inlineCheck">
                <input
                  type="checkbox"
                  name="inMemory"
                  checked={form.inMemory}
                  onChange={handleFieldChange}
                />
                Donate in memory of someone
              </label>

              {form.inMemory ? (
                <input
                  id="memoryName"
                  name="memoryName"
                  value={form.memoryName}
                  onChange={handleFieldChange}
                  placeholder="Name to honor"
                />
              ) : null}

              <label className="inlineCheck">
                <input
                  type="checkbox"
                  name="wantsReceipt"
                  checked={form.wantsReceipt}
                  onChange={handleFieldChange}
                />
                Send me a donation receipt by email
              </label>

              <div className="paymentSection">
                <h3>Payment Method</h3>
                <div className="paymentMethods" role="radiogroup" aria-label="Payment methods">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === 'upi'}
                    className={paymentMethod === 'upi' ? 'paymentMethod paymentMethodActive' : 'paymentMethod'}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <RiQrCodeLine aria-hidden="true" />
                    UPI
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === 'card'}
                    className={paymentMethod === 'card' ? 'paymentMethod paymentMethodActive' : 'paymentMethod'}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <RiBankCardLine aria-hidden="true" />
                    Credit/Debit Card
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === 'netbanking'}
                    className={paymentMethod === 'netbanking' ? 'paymentMethod paymentMethodActive' : 'paymentMethod'}
                    onClick={() => setPaymentMethod('netbanking')}
                  >
                    <RiBankLine aria-hidden="true" />
                    Net Banking
                  </button>
                </div>

                <div className="gatewayInfo" aria-label="Supported gateways">
                  <span><FiCreditCard aria-hidden="true" /> Razorpay ready</span>
                  <span><MdEmail aria-hidden="true" /> Stripe compatible</span>
                  <span><FiShield aria-hidden="true" /> Secure payment flow</span>
                </div>
              </div>

              <button type="submit" className="donatePrimaryButton" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Donate Now'}
              </button>

              {submitMessage ? <p className="submitMessage">{submitMessage}</p> : null}
            </form>
          </div>

          <aside className="impactPanel">
            <h2 className="donateSectionTitle">Your Impact</h2>
            <div className="impactCards">
              {IMPACT_ITEMS.map((impactItem) => (
                <article key={impactItem.amount} className="impactCard">
                  <h3>₹{impactItem.amount}</h3>
                  <p>{impactItem.label}</p>
                </article>
              ))}
            </div>

            <div className="progressBlock" aria-label="Donation progress">
              <p>₹50,000 raised out of ₹1,00,000</p>
              <div className="progressTrack">
                <div className="progressFill" style={{ width: `${impactProgress}%` }} />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="donateSection">
        <div className="container">
          <h2 className="donateSectionTitle">Artisan Stories Gallery</h2>
          <div className="galleryGrid">
            {GALLERY_IMAGES.map((image) => (
              <figure key={image.src} className="galleryCard">
                <img src={image.src} alt={image.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="donateSection donateSectionAlt">
        <div className="container testimonialGrid">
          {TESTIMONIALS.map((story) => (
            <article key={story.author} className="testimonialCard">
              <p>“{story.quote}”</p>
              <h3>{story.author}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="donateSection">
        <div className="container trustAndCta">
          <div className="trustBar" aria-label="Trust and security">
            <span><FiShield aria-hidden="true" /> Secure payment</span>
            <span>Privacy policy protected</span>
            <span>Transparent terms</span>
          </div>

          <button type="button" className="donatePrimaryButton donateFinalCta" onClick={scrollToForm}>
            Donate Now
          </button>
        </div>
      </section>
    </div>
  )
}

export default Donate
