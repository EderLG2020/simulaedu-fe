import { useState } from 'react'
import type { PuntoSemanal } from '../api/coordinadorApi'
import { formatearPuntaje, formatearSemana } from '../lib/formato'

/**
 * Simulacros por semana (una sola serie, barras). Sin libreria de graficos: barras con CSS,
 * detalle al pasar el mouse o enfocar cada barra, y una tabla equivalente para lectores de pantalla.
 */
export default function GraficoEvolucion({ puntos }: { puntos: PuntoSemanal[] }) {
  const [activo, setActivo] = useState<number | null>(null)
  const maximo = Math.max(1, ...puntos.map((p) => p.simulacros))
  const detalle = activo !== null ? puntos[activo] : null

  return (
    <div className="flex flex-col gap-3">
      <p className="h-5 text-xs text-slate-500" aria-live="polite">
        {detalle
          ? `Semana del ${formatearSemana(detalle.semana)}: ${detalle.simulacros} simulacros · promedio ${formatearPuntaje(detalle.puntajePromedio)}`
          : 'Pasa el cursor sobre una barra para ver el detalle.'}
      </p>
      <div className="flex h-44 items-end gap-1.5 border-b border-slate-200 sm:gap-3" aria-hidden="true">
        {puntos.map((p, i) => {
          const alto = p.simulacros === 0 ? 0 : Math.max(4, (p.simulacros / maximo) * 100)
          return (
            <div
              key={p.semana}
              className="group flex h-full flex-1 cursor-default flex-col items-center justify-end gap-1"
              onMouseEnter={() => setActivo(i)}
              onMouseLeave={() => setActivo(null)}
            >
              {(activo === i || i === puntos.length - 1) && <span className="text-xs font-semibold text-slate-700 tabular-nums">{p.simulacros}</span>}
              <div
                className={`w-full max-w-10 rounded-t-[4px] transition-colors ${activo === i ? 'bg-primary-700' : 'bg-primary-500'}`}
                style={{ height: `${alto}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 sm:gap-3" aria-hidden="true">
        {puntos.map((p) => (
          <span key={p.semana} className="flex-1 truncate text-center text-[11px] text-slate-500">
            {formatearSemana(p.semana)}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Simulacros y puntaje promedio por semana</caption>
        <thead>
          <tr>
            <th>Semana</th>
            <th>Simulacros</th>
            <th>Puntaje promedio</th>
          </tr>
        </thead>
        <tbody>
          {puntos.map((p) => (
            <tr key={p.semana}>
              <td>{formatearSemana(p.semana)}</td>
              <td>{p.simulacros}</td>
              <td>{formatearPuntaje(p.puntajePromedio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
