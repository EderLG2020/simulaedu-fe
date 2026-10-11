import { useEffect, useId, useRef } from 'react'

interface Props {
  respondidas: number
  sinResponder: number
  marcadas: number
  finalizando: boolean
  onCancelar: () => void
  onConfirmar: () => void
}

/** Modal propio (no window.confirm): finalizar es irreversible y conviene mostrar que queda pendiente. */
export default function ConfirmarFinalizarModal({ respondidas, sinResponder, marcadas, finalizando, onCancelar, onConfirmar }: Props) {
  const tituloId = useId()
  const cancelarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelarRef.current?.focus()
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar()
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [onCancelar])

  const conteos = [
    { valor: respondidas, etiqueta: 'Respondidas', clase: 'text-primary-600' },
    { valor: sinResponder, etiqueta: 'Sin responder', clase: sinResponder > 0 ? 'text-accent-600' : 'text-slate-900' },
    { valor: marcadas, etiqueta: 'Para revisar', clase: 'text-slate-900' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary-950/40 p-4 backdrop-blur-sm sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby={tituloId} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-600">
          <span className="material-symbols-outlined">flag</span>
        </div>
        <h2 id={tituloId} className="font-display text-xl font-bold text-slate-900">
          ¿Finalizar simulacro?
        </h2>
        <div className="my-5 grid grid-cols-3 gap-2">
          {conteos.map((c) => (
            <div key={c.etiqueta} className="flex flex-col items-center rounded-2xl bg-slate-50 px-2 py-3">
              <strong className={`font-display text-2xl ${c.clase}`}>{c.valor}</strong>
              <span className="text-[11px] font-semibold text-slate-500">{c.etiqueta}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-700">
          {sinResponder > 0 ? `Aún tienes ${sinResponder} sin responder: contarán como en blanco. ` : ''}
          Una vez finalizado no podrás cambiar tus respuestas.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Seguir respondiendo
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={finalizando}
            className="h-11 rounded-xl bg-accent-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-60"
          >
            {finalizando ? 'Finalizando...' : 'Sí, finalizar'}
          </button>
        </div>
      </div>
    </div>
  )
}
