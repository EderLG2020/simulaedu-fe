import type { PreguntaSimulacro } from '../../api/simulacrosApi'
import { CLASE_HTML_ENRIQUECIDO, LETRAS } from './estilosSimulacro'
import { alternativasOrdenadas } from './formatoSimulacro'
import { htmlSeguro } from '../../lib/html'

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

    default:
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <span className="material-symbols-outlined text-slate-500">construction</span>
          Este tipo de pregunta todavía no se puede responder desde aquí.
        </div>
      )
  }
}
