import type { ButtonHTMLAttributes } from 'react'
import { buttonClasses, type Tamano, type Variante } from './buttonStyles'
import { Icon } from './Icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variante
  size?: Tamano
  icon?: string
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', icon, loading = false, disabled, className, children, type = 'button', ...rest }: Props) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses(variant, size, className)} {...rest}>
      {loading ? <Icon name="progress_activity" size={size === 'sm' ? 16 : 18} className="animate-spin" /> : icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  )
}
