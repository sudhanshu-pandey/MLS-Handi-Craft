import { useState } from 'react'
import styles from './TestimonialCarousel.module.css'

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  image: string
  rating: number
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[]
}

const TestimonialCarousel = ({ testimonials }: TestimonialCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!testimonials || testimonials.length === 0) {
    return null
  }

  const next = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  const current = testimonials[currentIndex]

  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>Customer Testimonials</h2>
        <div className={styles.carousel}>
          <button className={styles.prevBtn} onClick={prev}>
            ❮
          </button>

          <div className={styles.testimonialCard}>
            <div className={styles.stars}>
              {'⭐'.repeat(current.rating)}
            </div>
            <p className={styles.content}>"{current.content}"</p>
            <div className={styles.author}>
              <img src={current.image} alt={current.name} />
              <div>
                <h4>{current.name}</h4>
                <p className={styles.role}>{current.role}</p>
              </div>
            </div>
          </div>

          <button className={styles.nextBtn} onClick={next}>
            ❯
          </button>
        </div>

        <div className={styles.indicators}>
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialCarousel
