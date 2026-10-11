import type { PreguntaSimulacro } from '../../api/simulacrosApi'
import { tieneRespuesta } from './formatoSimulacro'

interface Props {
  preguntas: PreguntaSimulacro[]
  indiceActual: number
  /** Navegacion secuencial: no se puede saltar mas alla de la ultima pregunta visitada. */
  indiceMaximoPermitido: number
  onIr: (indice: number) => void
}

export default function NavegadorPreguntas({ preguntas, indiceActual, indiceMaximoPermitido, onIr }: Props) {
  const totalMarcadas = preguntas.filter((p) => p.marcadaParaRevision).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-display text-base font-bold text-slate-900">
          <span className="material-symbols-outlined text-xl text-primary-600">grid_view</span>
          Navegación
        </h2>
        {totalMarcadas > 0 && (
          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-accent-700">
            {totalMarcadas} para revisar
          </span>
        )}
      </div>

      <div className="grid max-h-[50vh] grid-cols-6 gap-1.5 overflow-y-auto p-1.5 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6">
        {preguntas.map((p, i) => {
          const actual = i === indiceActual
          const bloqueada = i > indiceMaximoPermitido
          const respondida = tieneRespuesta(p.respuestaDada)
          const estados = [actual && 'actual', respondida ? 'respondida' : 'sin responder', p.marcadaParaRevision && 'marcada para revisión', bloqueada && 'bloqueada']
            .filter(Boolean)
            .join(', ')
          const estilo = actual
            ? 'bg-primary-600 text-white ring-2 ring-primary-600 ring-offset-1'
            : bloqueada
              ? 'cursor-not-allowed bg-slate-50 text-slate-500'
              : p.marcadaParaRevision
                ? 'bg-accent-100 text-accent-800 hover:bg-accent-200'
                : respondida
                  ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-primary-600/50'
          return (
            <button
              key={p.respuestaSimulacroId}
              type="button"
              disabled={bloqueada}
              aria-current={actual ? 'step' : undefined}
              aria-label={`Pregunta ${i + 1}, ${estados}`}
              onClick={() => onIr(i)}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-[13px] font-bold transition ${estilo}`}
            >
              {bloqueada ? <span className="material-symbols-outlined text-base">lock</span> : i + 1}
              {!bloqueada && p.marcadaParaRevision && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-white ring-2 ring-white" aria-hidden="true">
                  <span className="material-symbols-outlined text-[10px]">bookmark</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl bg-slate-50 p-3">
        <p className="mb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Estados de pregunta</p>
        <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] whitespace-nowrap text-slate-700">
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded bg-primary-600" /> Actual
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded bg-primary-50 ring-1 ring-primary-200" />
            Respondida
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded border border-slate-200 bg-white" /> Sin responder
          </li>
          <li className="flex items-center gap-2">
            <span className="relative h-3.5 w-3.5 rounded bg-accent-100">
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent-500" />
            </span>
            Para revisar
          </li>
          {indiceMaximoPermitido < preguntas.length - 1 && (
            <li className="col-span-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px] text-slate-500">lock</span> Bloqueada (navegación secuencial)
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
