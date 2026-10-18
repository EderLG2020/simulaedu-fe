import { Link } from 'react-router-dom'
import type { ExamenResumen } from '../../api/examenesApi'
import { Icon } from '../../components/ui'
import { formatearTiempo } from './formatoSimulacro'
import type { EstadoGuardado } from './useSimulacro'

interface Props {
  examen: ExamenResumen | null
  segundosRestantes: number | null
  pausado: boolean
  permitePausa: boolean
  pausando: boolean
  finalizando: boolean
  estadoGuardado: EstadoGuardado
  conteo: { total: number; respondidas: number }
  onCambiarPausa: (accion: 'pausar' | 'reanudar') => void
  onFinalizar: () => void
}

/** Barra fija del simulacro: salir, cronometro (cambia de color al acercarse el fin), estado del autoguardado,
 * pausa, finalizar y barra de progreso de respondidas. */
export default function CabeceraSimulacro({
  examen,
  segundosRestantes,
  pausado,
  permitePausa,
  pausando,
  finalizando,
  estadoGuardado,
  conteo,
  onCambiarPausa,
  onFinalizar,
}: Props) {
  const colorTiempo =
    segundosRestantes === null || pausado
      ? 'text-slate-900'
      : segundosRestantes < 60
        ? 'text-rose-600'
        : segundosRestantes < 300
          ? 'text-accent-600'
          : 'text-slate-900'
  const porcentaje = conteo.total > 0 ? Math.round((conteo.respondidas / conteo.total) * 100) : 0

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-2 sm:gap-3 sm:px-6">
        <Link
          to="/examenes"
          title="Tu tiempo sigue corriendo mientras estás fuera"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-700 transition hover:text-primary-600"
        >
          <Icon name="arrow_back" size={20} />
          <span className="hidden sm:inline">Salir</span>
        </Link>
        <span className="hidden h-6 w-px bg-slate-200 sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-sm font-bold text-slate-900 sm:text-base">{examen?.nombre ?? 'Simulacro'}</h1>
          {examen && <p className="truncate text-[11px] text-slate-500 sm:text-xs">{examen.universidadNombre}</p>}
        </div>

        <div
          role="timer"
          aria-label="Tiempo restante"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 ring-1 ring-slate-200 sm:px-3"
        >
          <Icon name="timer" size={18} className={`${colorTiempo === 'text-slate-900' ? 'text-accent-500' : colorTiempo}`} />
          <span className={`font-display text-base font-bold tabular-nums sm:text-xl ${colorTiempo}`}>
            {pausado ? 'En pausa' : segundosRestantes !== null ? formatearTiempo(segundosRestantes) : '--:--'}
          </span>
        </div>

        <span className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 lg:flex" aria-live="polite">
          {estadoGuardado === 'guardando' && (
            <>
              <Icon name="progress_activity" size={16} className="animate-spin" /> Guardando…
            </>
          )}
          {estadoGuardado === 'guardado' && (
            <>
              <Icon name="cloud_done" size={16} className="text-emerald-600" /> Guardado
            </>
          )}
          {estadoGuardado === 'error' && (
            <>
              <Icon name="cloud_off" size={16} className="text-rose-600" /> Sin guardar
            </>
          )}
        </span>

        {permitePausa && (
          <button
            type="button"
            disabled={pausando}
            onClick={() => onCambiarPausa(pausado ? 'reanudar' : 'pausar')}
            aria-label={pausado ? 'Reanudar' : 'Pausar'}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary-50 px-2.5 text-sm font-semibold text-primary-600 transition hover:bg-primary-100 disabled:opacity-60 sm:px-3.5"
          >
            <Icon name={pausado ? 'play_arrow' : 'pause'} size={18} />
            <span className="hidden sm:inline">{pausado ? 'Reanudar' : 'Pausar'}</span>
          </button>
        )}
        <button
          type="button"
          disabled={finalizando}
          onClick={() => onFinalizar()}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-accent-500 px-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-60 sm:px-4"
        >
          <span className="inline-flex sm:hidden" aria-hidden="true">
            <Icon name="flag" size={18} />
          </span>
          <span className="sr-only sm:not-sr-only">Finalizar simulacro</span>
        </button>
      </div>

      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 pb-2 sm:px-6">
        <span className="shrink-0 text-[11px] font-semibold text-slate-700 sm:text-xs">
          {conteo.respondidas} de {conteo.total} respondidas
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-50" aria-hidden="true">
          <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${porcentaje}%` }} />
        </div>
        <span className="shrink-0 text-xs font-bold text-primary-600">{porcentaje}%</span>
      </div>
    </header>
  )
}
