import { cn } from './cn'
import { Icon } from './Icon'

interface Opcion<T extends string> {
  value: T
  label: string
  icon?: string
}

interface Props<T extends string> {
  options: Opcion<T>[]
  value: T
  onChange: (valor: T) => void
  className?: string
  /** Nombre accesible del grupo (ej. "Vista de los exámenes"). */
  ariaLabel?: string
  /** En pantallas chicas muestra solo el icono; el texto queda para lectores de pantalla y como tooltip. */
  soloIconosEnMovil?: boolean
}

/** Seleccion unica entre pocas opciones visibles (dificultad, tipo de pregunta...). */
export function SegmentedControl<T extends string>({ options, value, onChange, className, ariaLabel, soloIconosEnMovil }: Props<T>) {
  return (
    <div role={ariaLabel ? 'group' : undefined} aria-label={ariaLabel} className={cn('flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1', className)}>
      {options.map((o) => {
        const activo = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(o.value)}
            title={soloIconosEnMovil ? o.label : undefined}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-primary-600',
              activo ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-900',
            )}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            {soloIconosEnMovil ? <span className="max-sm:sr-only">{o.label}</span> : o.label}
          </button>
        )
      })}
    </div>
  )
}
