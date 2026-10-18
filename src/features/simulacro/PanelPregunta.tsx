import type { PreguntaSimulacro } from '../../api/simulacrosApi'
import { Icon } from '../../components/ui'
import { htmlSeguro } from '../../lib/html'
import { CLASE_HTML_ENRIQUECIDO } from './estilosSimulacro'
import { formatearTiempoSugerido, tieneRespuesta } from './formatoSimulacro'
import RespuestaPregunta from './RespuestaPregunta'

const DIFICULTAD: Record<PreguntaSimulacro['dificultad'], { etiqueta: string; clase: string }> = {
  BAJA: { etiqueta: 'Dificultad baja', clase: 'bg-emerald-50 text-emerald-700' },
  MEDIA: { etiqueta: 'Dificultad media', clase: 'bg-amber-50 text-amber-700' },
  ALTA: { etiqueta: 'Dificultad alta', clase: 'bg-rose-50 text-rose-700' },
}

interface Props {
  pregunta: PreguntaSimulacro
  indiceActual: number
  total: number
  /** Puntaje de la pregunta en el examen; undefined mientras el examen no carga. */
  valorPregunta: number | undefined
  esUltima: boolean
  onAlternarMarca: () => void
  onGuardar: (respuestaDada: Record<string, unknown>) => void
  onGuardarConDebounce: (respuestaDada: Record<string, unknown>) => void
  onIr: (indice: number) => void
  onFinalizar: () => void
}

/** Pregunta actual del simulacro: cabecera (numero, dificultad, marca de revision), enunciado, respuesta
 * y botones de navegacion. */
export default function PanelPregunta({
  pregunta,
  indiceActual,
  total,
  valorPregunta,
  esUltima,
  onAlternarMarca,
  onGuardar,
  onGuardarConDebounce,
  onIr,
  onFinalizar,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">
              Pregunta {indiceActual + 1} de {total}
            </h2>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${DIFICULTAD[pregunta.dificultad].clase}`}>
              {DIFICULTAD[pregunta.dificultad].etiqueta}
            </span>
          </div>
          {(pregunta.tiempoSugeridoSeg || valorPregunta !== undefined) && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {pregunta.tiempoSugeridoSeg && (
                <span className="flex items-center gap-1">
                  <Icon name="schedule" size={14} />
                  Tiempo sugerido: {formatearTiempoSugerido(pregunta.tiempoSugeridoSeg)}
                </span>
              )}
              {valorPregunta !== undefined && (
                <span className="flex items-center gap-1">
                  <Icon name="star" size={14} />
                  Valor: {valorPregunta} pts
                </span>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-pressed={pregunta.marcadaParaRevision}
          onClick={() => onAlternarMarca()}
          className={`flex h-9 shrink-0 items-center gap-1.5 self-start rounded-xl px-3 text-xs font-semibold transition sm:self-auto ${
            pregunta.marcadaParaRevision
              ? 'bg-accent-100 text-accent-800 hover:bg-accent-200'
              : 'border border-slate-200 bg-white text-slate-700 hover:border-accent-300 hover:text-accent-700'
          }`}
        >
          <Icon name={pregunta.marcadaParaRevision ? 'bookmark_added' : 'bookmark'} size={16} />
          {pregunta.marcadaParaRevision ? 'Marcada para revisar' : 'Marcar para revisar'}
        </button>
      </div>

      <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <div
          className={`text-[15px] leading-7 text-slate-900 sm:text-base ${CLASE_HTML_ENRIQUECIDO}`}
          dangerouslySetInnerHTML={{ __html: htmlSeguro(pregunta.enunciadoHtml) }}
        />

        <RespuestaPregunta
          pregunta={pregunta}
          onCambiar={(respuestaDada) => onGuardar(respuestaDada)}
          onCambiarConDebounce={(respuestaDada) => onGuardarConDebounce(respuestaDada)}
        />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          disabled={indiceActual === 0}
          onClick={() => onIr(indiceActual - 1)}
          aria-label="Anterior"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-40 sm:px-4"
        >
          <Icon name="arrow_back" size={18} />
          <span className="hidden sm:inline">Anterior</span>
        </button>
        <div className="flex min-w-0 items-center gap-2">
          {tieneRespuesta(pregunta.respuestaDada) && (
            <button
              type="button"
              onClick={() => onGuardar({})}
              aria-label="Borrar respuesta"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-600 sm:px-4"
            >
              <Icon name="backspace" size={18} />
              <span className="hidden sm:inline">Borrar respuesta</span>
            </button>
          )}
          {esUltima ? (
            <button
              type="button"
              onClick={() => onFinalizar()}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-accent-500 px-4 text-sm font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-accent-600"
            >
              Revisar y finalizar
              <Icon name="flag" size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onIr(indiceActual + 1)}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800"
            >
              Siguiente
              <Icon name="arrow_forward" size={18} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
