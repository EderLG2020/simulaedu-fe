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
}

/** Seleccion unica entre pocas opciones visibles (dificultad, tipo de pregunta...). */
export function SegmentedControl<T extends string>({ options, value, onChange, className }: Props<T>) {
  return (
    <div className={cn('flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1', className)}>
      {options.map((o) => {
        const activo = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-primary-600',
              activo ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-900',
            )}
          >
            {o.icon && <Icon name={o.icon} size={16} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
