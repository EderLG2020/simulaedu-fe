import { Card, cn, Icon } from '../../components/ui'

export type Paso = 1 | 2 | 3
export type EstadoPaso = 'listo' | 'actual' | 'pendiente' | 'bloqueado'

const PASOS: { numero: Paso; titulo: string; descripcion: string }[] = [
  { numero: 1, titulo: 'Datos básicos', descripcion: 'Universidad, duración y reglas' },
  { numero: 2, titulo: 'Composición', descripcion: 'Preguntas o áreas y puntajes' },
  { numero: 3, titulo: 'Publicar', descripcion: 'Revisión final' },
]

/** Pasos del editor de examenes; un paso 'bloqueado' (sin examen creado) no se puede abrir. */
export default function Stepper({ paso, estados, onCambiar }: { paso: Paso; estados: Record<Paso, EstadoPaso>; onCambiar: (p: Paso) => void }) {
  return (
    <Card className="p-2">
      <ol className="grid grid-cols-1 gap-1 sm:grid-cols-3">
        {PASOS.map((p) => {
          const estado = estados[p.numero]
          const activo = paso === p.numero
          return (
            <li key={p.numero}>
              <button
                type="button"
                disabled={estado === 'bloqueado'}
                onClick={() => onCambiar(p.numero)}
                aria-current={activo ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  'focus-visible:outline-2 focus-visible:outline-primary-600',
                  activo ? 'bg-primary-50' : 'hover:bg-slate-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    estado === 'listo' ? 'bg-emerald-500 text-white' : activo ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {estado === 'listo' ? <Icon name="check" size={18} /> : p.numero}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-sm font-semibold', activo ? 'text-primary-700' : 'text-slate-900')}>{p.titulo}</span>
                  <span className="block truncate text-xs text-slate-500">{p.descripcion}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
