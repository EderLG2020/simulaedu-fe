import type { ReactNode } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'

interface Props {
  icon: string
  title: string
  description?: ReactNode
  /** Boton o link de salida (ej. "Ver otros programas"). */
  action?: ReactNode
  /** neutral: para "sin resultados" de una busqueda (gris en vez del color de marca). */
  tone?: 'primary' | 'neutral'
  className?: string
}

/**
 * Estado vacio a pagina completa (tarjeta con icono en circulo, titulo y salida): "aun no hay
 * examenes", "sin resultados", "nadie en el ranking". Para el vacio dentro de una tabla o
 * Card, EmptyState.
 */
export function PanelVacio({ icon, title, description, action, tone = 'primary', className }: Props) {
  return (
    <div className={cn('flex flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm', className)}>
      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-full',
          tone === 'primary' ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-500',
        )}
      >
        <Icon name={icon} size={30} />
      </div>
      <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
      {description && <p className="mt-1.5 max-w-md text-sm text-slate-700">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
