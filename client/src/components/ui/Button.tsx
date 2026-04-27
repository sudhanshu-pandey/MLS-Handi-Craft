import { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'outline'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  fullWidth?: boolean
}

const Button = ({ children, variant = 'primary', fullWidth = false, className = '', ...props }: ButtonProps) => {
  const variantClass = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
  }[variant]

  return (
    <button
      className={`${styles.button} ${variantClass} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
