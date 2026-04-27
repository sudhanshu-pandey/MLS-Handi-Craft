import { ChangeEvent, FormEvent, useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import './Contact.css'

type ContactFormData = {
  name: string
  email: string
  phone: string
  message: string
}

type ContactErrors = Partial<Record<keyof ContactFormData, string>>

const initialFormState: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>(initialFormState)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validate = () => {
    const nextErrors: ContactErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = 'Please enter your name'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Please enter your email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Please enter your phone number'
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\s+/g, ''))) {
      nextErrors.phone = 'Phone number should contain 10 to 15 digits'
    }

    if (!formData.message.trim()) {
      nextErrors.message = 'Please enter your message'
    } else if (formData.message.trim().length < 10) {
      nextErrors.message = 'Message should be at least 10 characters'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitted(false)

    const isValid = validate()
    if (!isValid) {
      return
    }

    setIsSubmitted(true)
    setFormData(initialFormState)
  }

  return (
    <div className="contactPage">
      <section className="contactHero">
        <div className="container contactHeroContent">
          <h1>Contact Us</h1>
          <p>We would love to help you choose the perfect handcrafted pieces for your space.</p>
        </div>
      </section>

      <section className="contactInfoSection sectionSpace">
        <div className="container contactInfoGrid">
          <Card className="infoCard">
            <span className="infoIcon" aria-hidden="true">
              📍
            </span>
            <h3>Address</h3>
            <p>MLS Handicrafts, Karol Bagh, New Delhi, India</p>
          </Card>
          <Card className="infoCard">
            <span className="infoIcon" aria-hidden="true">
              📞
            </span>
            <h3>Phone</h3>
            <p>
              <a href="tel:+918595651616">+91 8595 651 616</a>
            </p>
          </Card>
          <Card className="infoCard">
            <span className="infoIcon" aria-hidden="true">
              ✉️
            </span>
            <h3>Email</h3>
            <p>
              <a href="mailto:info@mlshandicrafts.com">info@mlshandicrafts.com</a>
            </p>
          </Card>
        </div>
      </section>

      <section className="sectionSpace formMapSection">
        <div className="container formMapGrid">
          <Card className="contactFormCard" hoverable={false}>
            <h2>Send us a message</h2>
            <form className="contactForm" noValidate onSubmit={handleSubmit}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <span className="errorText">{errors.name}</span> : null}

              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <span className="errorText">{errors.email}</span> : null}

              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10 digit phone number"
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? <span className="errorText">{errors.phone}</span> : null}

              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us how we can help"
                aria-invalid={Boolean(errors.message)}
              />
              {errors.message ? <span className="errorText">{errors.message}</span> : null}

              <Button type="submit" fullWidth>
                Send Message
              </Button>
              {isSubmitted ? (
                <p className="successText">Thanks! Your message has been sent successfully.</p>
              ) : null}
            </form>
          </Card>

          <div className="mapAndSocial">
            <Card className="mapCard" hoverable={false}>
              <h2>Visit Our Store</h2>
              <div className="mapContainer">
                <iframe
                  title="MLS Handicrafts Location"
                  src="https://www.google.com/maps?q=Karol+Bagh+New+Delhi&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Card>

            <Card className="socialCard">
              <h3>Follow Us</h3>
              <div className="socialLinks" aria-label="Social links">
                <a href="#" aria-label="Facebook">
                  f
                </a>
                <a href="#" aria-label="Instagram">
                  📷
                </a>
                <a href="#" aria-label="Twitter">
                  𝕏
                </a>
                <a href="#" aria-label="LinkedIn">
                  in
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
