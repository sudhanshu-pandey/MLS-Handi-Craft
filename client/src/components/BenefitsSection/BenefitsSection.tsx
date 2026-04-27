import { memo } from 'react'
import styles from './BenefitsSection.module.css'

interface Benefit {
  id: number
  icon: string
  title: string
  description: string
}

interface BenefitsSectionProps {
  benefits: Benefit[]
}

const BenefitsSection = memo(({ benefits }: BenefitsSectionProps) => {
  return (
    <section className={styles.section}>
      <div className="container">
        <h2 className={styles.title}>Why Choose Us?</h2>
        <div className={styles.grid}>
          {benefits.map((benefit) => (
            <div key={benefit.id} className={styles.benefit}>
              <div className={styles.icon}>{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

BenefitsSection.displayName = 'BenefitsSection'

export default BenefitsSection
