import type { PreguntaSimulacro } from '../../api/simulacrosApi'
import { CLASE_HTML_ENRIQUECIDO, LETRAS } from './estilosSimulacro'
import { alternativasOrdenadas } from './formatoSimulacro'
import { htmlSeguro } from '../../lib/html'

/** Formato que califica CalculadoraPuntajeService (indices de columnaIzquierda/columnaDerecha). */
interface ParElegido {
  izquierda: number
  derecha: number
}

interface Props {
  pregunta: PreguntaSimulacro
  onCambiar: (respuestaDada: Record<string, unknown>) => void
  onCambiarConDebounce: (respuestaDada: Record<string, unknown>) => void
}

export default function RespuestaPregunta({ pregunta, onCambiar, onCambiarConDebounce }: Props) {
  switch (pregunta.tipoPregunta) {
    case 'OPCION_UNICA':
    case 'OPCION_MULTIPLE': {
      const multiple = pregunta.tipoPregunta === 'OPCION_MULTIPLE'
      const seleccionadas = multiple
        ? ((pregunta.respuestaDada.alternativaIds as string[] | undefined) ?? [])
        : [pregunta.respuestaDada.alternativaId as string | undefined].filter(Boolean)

      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Alternativas</legend>
          {multiple && <p className="text-xs font-semibold text-slate-500">Puedes marcar más de una alternativa.</p>}
          {alternativasOrdenadas(pregunta).map((alt, i) => {
            const elegida = seleccionadas.includes(alt.id)
            return (
              <label
                key={alt.id}
                className={`group flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-3 py-2 transition focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 sm:px-4 ${
                  elegida ? 'border-primary-600 bg-primary-50/60 shadow-sm' : 'border-slate-200 hover:border-primary-600/40 hover:bg-slate-50'
                }`}
              >
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={pregunta.respuestaSimulacroId}
                  className="sr-only"
                  checked={elegida}
                  onChange={(e) => {
                    if (!multiple) return onCambiar({ alternativaId: alt.id })
                    onCambiar({ alternativaIds: e.target.checked ? [...seleccionadas, alt.id] : seleccionadas.filter((id) => id !== alt.id) })
                  }}
                />
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center font-display text-sm font-bold transition ${multiple ? 'rounded-md' : 'rounded-lg'} ${
                    elegida ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600'
                  }`}
                >
                  {LETRAS[i] ?? i + 1}
                </span>
                <span className="min-w-0 flex-1 text-[15px] text-slate-900">
                  {alt.imagenUrl && <img src={alt.imagenUrl} alt="" className="mb-2 max-h-40 rounded-lg" />}
                  <span className={`${CLASE_HTML_ENRIQUECIDO} ${elegida ? 'font-semibold' : ''}`} dangerouslySetInnerHTML={{ __html: htmlSeguro(alt.textoHtml) }} />
                </span>
                {elegida && <span className="hidden text-[11px] font-semibold text-primary-600 md:inline">Tu selección</span>}
                <span
                  aria-hidden="true"
                  className={`material-symbols-outlined shrink-0 text-xl ${elegida ? 'text-primary-600' : 'text-slate-200 group-hover:text-slate-500'}`}
                >
                  {multiple ? (elegida ? 'check_box' : 'check_box_outline_blank') : elegida ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </label>
            )
          })}
        </fieldset>
      )
    }

    case 'NUMERICA': {
      const valor = (pregunta.respuestaDada.valor as number | null | undefined) ?? ''
      return (
        <label className="mx-auto flex w-full max-w-xs flex-col items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Tu respuesta</span>
          <input
            type="number"
            inputMode="decimal"
            className="h-14 w-full rounded-xl border-2 border-slate-200 bg-white text-center font-display text-2xl font-bold text-slate-900 transition outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-50"
            value={valor}
            onChange={(e) => onCambiarConDebounce({ valor: e.target.value === '' ? null : Number(e.target.value) })}
          />
          <span className="text-xs text-slate-500">Se guarda automáticamente mientras escribes.</span>
        </label>
      )
    }

    case 'DESARROLLO': {
      const texto = (pregunta.respuestaDada.texto as string | null | undefined) ?? ''
      const limite = Number(pregunta.metadataTipo.limiteCaracteres) || undefined
      const idCampo = `desarrollo-${pregunta.respuestaSimulacroId}`
      return (
        <div className="flex flex-col gap-2">
          <label htmlFor={idCampo} className="text-sm font-semibold text-slate-700">
            Tu respuesta
          </label>
          <textarea
            id={idCampo}
            rows={10}
            maxLength={limite}
            value={texto}
            placeholder="Escribe tu respuesta aquí..."
            // Solo espacios cuenta como en blanco (texto null), igual que si no se hubiera escrito nada.
            onChange={(e) => onCambiarConDebounce({ texto: e.target.value.trim() === '' ? null : e.target.value })}
            className="min-h-56 w-full resize-y rounded-xl border-2 border-slate-200 bg-white p-4 text-[15px] leading-relaxed text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-primary-600 focus:ring-4 focus:ring-primary-50"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                rate_review
              </span>
              Tu docente revisará y calificará esta respuesta. Se guarda automáticamente.
            </span>
            {limite !== undefined && (
              <span className={texto.length >= limite * 0.9 ? 'font-semibold text-amber-600' : undefined}>
                {texto.length} / {limite}
              </span>
            )}
          </div>
        </div>
      )
    }

    case 'EMPAREJAMIENTO': {
      const izquierda = (pregunta.metadataTipo.columnaIzquierda as string[] | undefined) ?? []
      const derecha = (pregunta.metadataTipo.columnaDerecha as string[] | undefined) ?? []
      const pares = ((pregunta.respuestaDada.pares as ParElegido[] | undefined) ?? []).map((p) => ({
        izquierda: Number(p.izquierda),
        derecha: Number(p.derecha),
      }))
      const usadas = new Set(pares.map((p) => p.derecha))

      const elegir = (indiceIzquierda: number, valor: string) => {
        const resto = pares.filter((p) => p.izquierda !== indiceIzquierda)
        const nuevos = valor === '' ? resto : [...resto, { izquierda: indiceIzquierda, derecha: Number(valor) }]
        onCambiar({ pares: nuevos.sort((a, b) => a.izquierda - b.izquierda) })
      }

      return (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-500">Elige, para cada elemento, su pareja de la lista.</p>
          <ul className="flex flex-col gap-2">
            {izquierda.map((textoIzquierda, i) => {
              const idSelector = `${pregunta.respuestaSimulacroId}-par-${i}`
              const elegida = pares.find((p) => p.izquierda === i)?.derecha
              return (
                <li
                  key={i}
                  className={`flex flex-col gap-2 rounded-xl border-2 px-3 py-2.5 transition sm:flex-row sm:items-center sm:gap-4 sm:px-4 ${
                    elegida !== undefined ? 'border-primary-600 bg-primary-50/60' : 'border-slate-200 bg-white'
                  }`}
                >
                  <label htmlFor={idSelector} className="flex min-w-0 flex-1 items-center gap-3 text-[15px] font-medium text-slate-900">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 font-display text-sm font-bold text-primary-600"
                    >
                      {i + 1}
                    </span>
                    {textoIzquierda}
                  </label>
                  <select
                    id={idSelector}
                    value={elegida === undefined ? '' : String(elegida)}
                    onChange={(e) => elegir(i, e.target.value)}
                    className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-50 sm:w-72"
                  >
                    <option value="">Elige...</option>
                    {derecha.map((textoDerecha, j) => (
                      <option key={j} value={j}>
                        {`${LETRAS[j] ?? j + 1}. ${textoDerecha}${usadas.has(j) && j !== elegida ? ' (ya elegida)' : ''}`}
                      </option>
                    ))}
                  </select>
                </li>
              )
            })}
          </ul>
        </div>
      )
    }

    default:
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <span className="material-symbols-outlined text-slate-500">construction</span>
          Este tipo de pregunta todavía no se puede responder desde aquí.
        </div>
      )
  }
}
