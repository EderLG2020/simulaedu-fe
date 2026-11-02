import { Button } from './Button'
import { cn } from './cn'

interface Props {
  page: number
  totalPages: number
  total: number
  /** Sustantivo en plural para el contador ("preguntas", "usuarios"...). */
  itemLabel?: string
  onChange: (pagina: number) => void
  /** Para usarlo fuera de una Card (ej. como caja propia bajo una grilla de tarjetas). */
  className?: string
}

/** Pie de paginacion para listados (va al final de la Card de la tabla). No se muestra con una sola pagina. */
export function Pagination({ page, totalPages, total, itemLabel = 'resultados', onChange, className }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginación" className={cn('flex items-center justify-between border-t border-slate-200 px-4 py-3', className)}>
      <span className="text-xs text-slate-500">
        Página {page} de {totalPages} · {total} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  )
}
