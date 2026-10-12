import type { ExamenResumen, TemaCubierto } from '../../api/examenesApi'
import { formatearDuracion } from '../../lib/formato'
import { formatearFraccion, penalizacionDe } from '../../lib/reglasCalificacion'
import { ETIQUETA_TIPO } from './resumenExamenes'

/** Etiquetas de temas visibles antes de resumir el resto en "+N temas". */
const MAX_TEMAS_VISIBLES = 4

/** Por que no se puede iniciar: null si se puede. */
export type MotivoBloqueo = 'programa' | 'plan' | 'sin-preguntas' | null

interface Props {
  examen: ExamenResumen
  /** Simulacro: fila ancha con todos los datos. Practica: tarjeta compacta para la grilla. */
  variante: 'simulacro' | 'practica'
  bloqueo: MotivoBloqueo
  iniciando: boolean
  error: string | null
  onIniciar: () => void
}

function nombreTema(t: TemaCubierto): string {
  return t.temaNombre ?? `${t.cursoNombre} (todo el curso)`
}

function Temas({ temas }: { temas: TemaCubierto[] }) {
  if (temas.length === 0) return null
  const visibles = temas.slice(0, MAX_TEMAS_VISIBLES)
  const resto = temas.length - visibles.length
  return (
    <ul aria-label="Temas" className="flex flex-wrap gap-1.5">
      {visibles.map((t) => (
        <li key={`${t.cursoId}-${t.temaId ?? 'curso'}`} className="rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          {nombreTema(t)}
        </li>
      ))}
      {resto > 0 && <li className="px-1 py-0.5 text-xs font-semibold text-slate-500">+{resto} temas</li>}
    </ul>
  )
}

function Dato({ icono, children, className = '' }: { icono: string; children: React.ReactNode; className?: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${className}`}>
      <span className="material-symbols-outlined text-lg" aria-hidden="true">
        {icono}
      </span>
      {children}
    </li>
  )
}

export default function TarjetaExamen({ examen, variante, bloqueo, iniciando, error, onIniciar }: Props) {
  const etiqueta = ETIQUETA_TIPO[examen.tipo]
  const penalizacion = penalizacionDe(examen.reglasCalificacion)
  const esSimulacro = variante === 'simulacro'
  const preguntas = `${examen.cantidadPreguntas} ${examen.cantidadPreguntas === 1 ? 'pregunta' : 'preguntas'}`

  const boton = bloqueo ? (
    <button
      type="button"
      disabled
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700"
    >
      <span className="material-symbols-outlined text-base" aria-hidden="true">
        lock
      </span>
      {bloqueo === 'programa' ? 'Incluido en Premium' : bloqueo === 'plan' ? 'Bloqueado por tu plan' : 'No disponible'}
    </button>
  ) : (
    <button
      type="button"
      disabled={iniciando}
      onClick={onIniciar}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-60"
    >
      {iniciando ? 'Iniciando...' : 'Iniciar prueba'}
      {!iniciando && <span className="material-symbols-outlined text-base">arrow_forward</span>}
    </button>
  )

  return (
    <article
      aria-label={examen.nombre}
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white py-5 pr-5 pl-6 shadow-sm transition ${
        esSimulacro ? 'sm:py-6 sm:pr-6 sm:pl-7' : ''
      } ${bloqueo ? 'opacity-75' : 'hover:border-primary-600/40 hover:shadow-md'}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${bloqueo ? 'bg-slate-200' : esSimulacro ? 'bg-primary-600' : 'bg-accent-500'}`} />

      <div className={`flex flex-1 flex-col gap-4 ${esSimulacro ? 'sm:flex-row sm:items-center sm:justify-between' : ''}`}>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${etiqueta.clase}`}>
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                {etiqueta.icono}
              </span>
              {etiqueta.texto}
            </span>
            {bloqueo === 'sin-preguntas' && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">Sin preguntas disponibles aún</span>
            )}
          </div>

          <h3 className={`font-display leading-snug font-bold text-slate-900 ${esSimulacro ? 'text-lg' : 'text-base'}`}>{examen.nombre}</h3>
          {examen.descripcion && <p className={`text-sm text-slate-700 ${esSimulacro ? '' : 'line-clamp-2'}`}>{examen.descripcion}</p>}

          <Temas temas={examen.temasCubiertos} />

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-700">
            <Dato icono="quiz" className="[&>span]:text-primary-600">
              {preguntas}
            </Dato>
            <Dato icono="schedule" className="[&>span]:text-primary-600">
              {formatearDuracion(examen.duracionSeg)}
            </Dato>
            {esSimulacro && (
              <Dato icono={examen.navegacion === 'LIBRE' ? 'swap_horiz' : 'arrow_forward'} className="[&>span]:text-slate-500">
                {examen.navegacion === 'LIBRE' ? 'Navegacion libre' : 'Navegacion secuencial'}
              </Dato>
            )}
            {esSimulacro && examen.permitePausa && (
              <Dato icono="pause_circle" className="[&>span]:text-slate-500">
                Puedes pausar
              </Dato>
            )}
            {penalizacion !== null && (
              <li className="flex items-center gap-1.5 font-semibold text-rose-600">
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  trending_down
                </span>
                <span className="sr-only">Penalizacion por error:</span>
                <span>Resta {formatearFraccion(penalizacion)} de la pregunta</span>
              </li>
            )}
          </ul>
        </div>

        <div className={`shrink-0 ${esSimulacro ? 'sm:w-48' : 'mt-auto'}`}>{boton}</div>
      </div>

      {bloqueo === 'sin-preguntas' && (
        <p className="mt-3 text-xs text-slate-700">Tu docente aún no carga suficientes preguntas para este examen. Prueba con otro.</p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </article>
  )
}
