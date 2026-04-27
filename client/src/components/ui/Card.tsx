import { ReactNode } from 'react'
import styles from './Card.module.css'

type CardProps = {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

const Card = ({ children, className = '', hoverable = true }: CardProps) => {
  return <article className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`.trim()}>{children}</article>
}

export default Card
