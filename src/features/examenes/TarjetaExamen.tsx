import type { ExamenResumen, TemaCubierto } from '../../api/examenesApi'
import { Alert, Icon } from '../../components/ui'
import { formatearDuracion } from '../../lib/formato'
import { formatearFraccion, penalizacionDe } from '../../lib/reglasCalificacion'
import { ETIQUETA_TIPO } from './resumenExamenes'

/** Etiquetas de temas visibles antes de resumir el resto en "+N temas". */
const MAX_TEMAS_VISIBLES = 4

/** Por que no se puede iniciar: null si se puede. */
export type MotivoBloqueo = 'programa' | 'plan' | 'sin-preguntas' | null

/** Como se muestran los examenes: tarjetas en grilla, tarjetas anchas una debajo de otra, o filas densas. */
export type VistaExamenes = 'cuadricula' | 'lista' | 'compacta'

interface Props {
  examen: ExamenResumen
  /** Simulacro (barra morada, datos de navegacion/pausa) o practica (barra naranja). */
  variante: 'simulacro' | 'practica'
  vista: VistaExamenes
  bloqueo: MotivoBloqueo
  iniciando: boolean
  error: string | null
  onIniciar: () => void
}

const TEXTO_BLOQUEO = { programa: 'Incluido en Premium', plan: 'Bloqueado por tu plan', 'sin-preguntas': 'No disponible' } as const

function BotonIniciar({ bloqueo, iniciando, onIniciar, compacto }: Pick<Props, 'bloqueo' | 'iniciando' | 'onIniciar'> & { compacto?: boolean }) {
  const tamano = compacto ? 'gap-1.5 rounded-lg px-3.5 py-2 text-xs' : 'w-full gap-2 rounded-xl px-5 py-3 text-sm'
  if (bloqueo) {
    return (
      <button type="button" disabled className={`flex items-center justify-center bg-slate-50 font-bold whitespace-nowrap text-slate-700 ${tamano}`}>
        <Icon name="lock" size={16} />
        {TEXTO_BLOQUEO[bloqueo]}
      </button>
    )
  }
  return (
    <button
      type="button"
      disabled={iniciando}
      onClick={onIniciar}
      className={`flex items-center justify-center bg-accent-500 font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-60 ${tamano}`}
    >
      {iniciando ? 'Iniciando...' : 'Iniciar prueba'}
      {!iniciando && <Icon name="arrow_forward" size={16} />}
    </button>
  )
}

function ErrorInicio({ error }: { error: string | null }) {
  if (!error) return null
  return <Alert className="mt-3 text-xs">{error}</Alert>
}

/** Vista compacta: una fila densa (nombre, preguntas, duracion, penalizacion, boton), sin descripcion ni temas. */
function FilaExamen({ examen, variante, bloqueo, iniciando, error, onIniciar }: Omit<Props, 'vista'>) {
  const penalizacion = penalizacionDe(examen.reglasCalificacion)
  const temas = examen.temasCubiertos.map(nombreTema).join(', ')
  return (
    <article aria-label={examen.nombre} className={`px-4 py-3 transition sm:px-5 ${bloqueo ? 'opacity-75' : 'hover:bg-slate-50/70'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={`h-9 w-1.5 shrink-0 rounded-full ${bloqueo ? 'bg-slate-200' : variante === 'simulacro' ? 'bg-primary-600' : 'bg-accent-500'}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-bold text-slate-900" title={examen.nombre}>
              {examen.nombre}
            </h3>
            {temas && (
              <p className="truncate text-xs text-slate-600" title={temas}>
                {temas}
              </p>
            )}
          </div>
        </div>

        <ul className="flex shrink-0 items-center gap-4 pl-[18px] text-xs font-medium text-slate-700 sm:pl-0">
          <Dato icono="quiz" className="[&>span]:text-base [&>span]:text-primary-600">
            {examen.cantidadPreguntas}
            <span className="sr-only"> preguntas</span>
          </Dato>
          <Dato icono="schedule" className="[&>span]:text-base [&>span]:text-primary-600">
            {formatearDuracion(examen.duracionSeg)}
          </Dato>
          {penalizacion !== null && (
            <li className="flex items-center gap-1 font-semibold text-rose-600" title={`Resta ${formatearFraccion(penalizacion)} de la pregunta`}>
              <Icon name="trending_down" size={16} />
              <span className="sr-only">Penalizacion por error: resta</span>
              {formatearFraccion(penalizacion)}
            </li>
          )}
        </ul>

        <div className="shrink-0 pl-[18px] sm:pl-0">
          <BotonIniciar bloqueo={bloqueo} iniciando={iniciando} onIniciar={onIniciar} compacto />
        </div>
      </div>
      <ErrorInicio error={error} />
    </article>
  )
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
      <Icon name={icono} size={18} />
      {children}
    </li>
  )
}

export default function TarjetaExamen(props: Props) {
  const { examen, variante, vista, bloqueo, iniciando, error, onIniciar } = props
  if (vista === 'compacta') return <FilaExamen {...props} />

  const etiqueta = ETIQUETA_TIPO[examen.tipo]
  const penalizacion = penalizacionDe(examen.reglasCalificacion)
  const esSimulacro = variante === 'simulacro'
  // Lista: tarjeta ancha con el boton a la derecha. Cuadricula: tarjeta vertical con el boton abajo.
  const ancha = vista === 'lista'
  const preguntas = `${examen.cantidadPreguntas} ${examen.cantidadPreguntas === 1 ? 'pregunta' : 'preguntas'}`

  return (
    <article
      aria-label={examen.nombre}
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white py-5 pr-5 pl-6 shadow-sm transition ${
        ancha ? 'sm:py-6 sm:pr-6 sm:pl-7' : ''
      } ${bloqueo ? 'opacity-75' : 'hover:border-primary-600/40 hover:shadow-md'}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${bloqueo ? 'bg-slate-200' : esSimulacro ? 'bg-primary-600' : 'bg-accent-500'}`} />

      <div className={`flex flex-1 flex-col gap-4 ${ancha ? 'sm:flex-row sm:items-center sm:justify-between' : ''}`}>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${etiqueta.clase}`}>
              <Icon name={etiqueta.icono} size={14} />
              {etiqueta.texto}
            </span>
            {bloqueo === 'sin-preguntas' && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">Sin preguntas disponibles aún</span>
            )}
          </div>

          <h3 className={`font-display leading-snug font-bold text-slate-900 ${ancha ? 'text-lg' : 'text-base'}`}>{examen.nombre}</h3>
          {examen.descripcion && <p className={`text-sm text-slate-700 ${ancha ? '' : 'line-clamp-2'}`}>{examen.descripcion}</p>}

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
                <Icon name="trending_down" size={18} />
                <span className="sr-only">Penalizacion por error:</span>
                <span>Resta {formatearFraccion(penalizacion)} de la pregunta</span>
              </li>
            )}
          </ul>
        </div>

        <div className={`shrink-0 ${ancha ? 'sm:w-48' : 'mt-auto'}`}>
          <BotonIniciar bloqueo={bloqueo} iniciando={iniciando} onIniciar={onIniciar} />
        </div>
      </div>

      {bloqueo === 'sin-preguntas' && (
        <p className="mt-3 text-xs text-slate-700">Tu docente aún no carga suficientes preguntas para este examen. Prueba con otro.</p>
      )}
      <ErrorInicio error={error} />
    </article>
  )
}
