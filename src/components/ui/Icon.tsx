import { cn } from './cn'

interface Props {
  name: string
  /** Tamano en px (Material Symbols escala por font-size). */
  size?: number
  className?: string
}

/** Icono de Material Symbols. Decorativo por defecto (aria-hidden): el texto accesible va en el control que lo contiene. */
export function Icon({ name, size = 18, className }: Props) {
  return (
    <span aria-hidden="true" className={cn('material-symbols-outlined shrink-0', className)} style={{ fontSize: size }}>
      {name}
    </span>
  )
}
