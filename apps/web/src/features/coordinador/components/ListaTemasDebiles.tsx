import type { TemaDebil } from '../api/coordinadorApi'
import { EmptyState } from '../../../shared/components/ui'
import { formatearPorcentaje } from '../lib/formato'

/** Temas con menor porcentaje de acierto, con una barra de acierto por tema. */
export default function ListaTemasDebiles({ temas, vacio }: { temas: TemaDebil[]; vacio: string }) {
  if (temas.length === 0) return <EmptyState icon="query_stats" title={vacio} />
  return (
    <ul aria-label="Temas con menor acierto" className="flex flex-col gap-4 px-5 py-4">
      {temas.map((t) => (
        <li key={t.temaId} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-slate-900">{t.temaNombre}</span>
            <span className="shrink-0 font-semibold text-slate-700 tabular-nums">{formatearPorcentaje(t.tasaAcierto)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.round(Math.min(1, Math.max(0, t.tasaAcierto)) * 100)}%` }} />
          </div>
          <span className="text-xs text-slate-500">{t.totalRespuestas} respuestas</span>
        </li>
      ))}
    </ul>
  )
}
