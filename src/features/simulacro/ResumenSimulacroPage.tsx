import { Link, useLocation } from 'react-router-dom'
import type { ExamenResumen } from '../../api/examenesApi'
import type { ResumenSimulacro } from '../../api/simulacrosApi'
import { Icon, PanelVacio } from '../../components/ui'
import PaginaAlumno from '../home/PaginaAlumno'
import { formatearDuracionLarga, formatearPuntos } from './formatoSimulacro'

/** Migracion del mockup de Stitch "resultado del simulacro". Se omitieron los datos que el mockup inventaba
 * (percentil, puesto, cortes de admision por carrera, comparativa vs simulacro previo, PDF/compartir,
 * solucionario): no existen en el backend y serian cifras o botones falsos. */

interface EstadoUbicacion {
  resumen?: ResumenSimulacro
  /** Lo pasa SimulacroPage al finalizar; falta si se llega por otra via (p. ej. simulacro vencido al reanudar). */
  examen?: Pick<ExamenResumen, 'nombre' | 'universidadNombre' | 'puntajeTotal' | 'duracionSeg'> | null
}

function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0
}

function BarraApilada({ correctas, incorrectas, enBlanco }: { correctas: number; incorrectas: number; enBlanco: number }) {
  const total = correctas + incorrectas + enBlanco
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-slate-50" aria-hidden="true">
      <div className="bg-emerald-500" style={{ width: `${porcentaje(correctas, total)}%` }} />
      <div className="bg-rose-500" style={{ width: `${porcentaje(incorrectas, total)}%` }} />
      <div className="bg-slate-400" style={{ width: `${porcentaje(enBlanco, total)}%` }} />
    </div>
  )
}

function Acciones() {
  return (
    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
      <Link
        to="/simulacros/historial"
        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-50 px-4 whitespace-nowrap text-sm font-semibold text-primary-600 transition hover:bg-primary-100"
      >
        <Icon name="monitoring" size={18} />
        Ver mi historial
      </Link>
      <Link
        to="/examenes"
        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 whitespace-nowrap text-sm font-bold text-white shadow-sm transition hover:bg-accent-600"
      >
        Volver a exámenes
        <Icon name="arrow_forward" size={18} />
      </Link>
    </div>
  )
}

export default function ResumenSimulacroPage() {
  const location = useLocation()
  const { resumen, examen } = (location.state as EstadoUbicacion | null) ?? {}

  if (!resumen) {
    return (
      <PaginaAlumno className="items-center pt-16">
        <PanelVacio
          className="max-w-md"
          icon="query_stats"
          title="No hay un resumen para mostrar"
          description="Puedes consultar tus resultados anteriores en tu historial."
          action={<Acciones />}
        />
      </PaginaAlumno>
    )
  }

  const totalItems = resumen.correctas + resumen.incorrectas + resumen.enBlanco
  const conteos = [
    { etiqueta: 'Correctas', valor: resumen.correctas, icono: 'check_circle', color: 'text-emerald-600', barra: 'bg-emerald-500' },
    { etiqueta: 'Incorrectas', valor: resumen.incorrectas, icono: 'cancel', color: 'text-rose-600', barra: 'bg-rose-500' },
    { etiqueta: 'En blanco', valor: resumen.enBlanco, icono: 'help', color: 'text-slate-500', barra: 'bg-slate-400' },
  ]
  const fraccionTiempo = examen?.duracionSeg ? Math.min(1, resumen.tiempoUsadoSeg / examen.duracionSeg) : null
  const RADIO = 52
  const circunferencia = 2 * Math.PI * RADIO

  return (
    <PaginaAlumno>
      <div className="flex flex-col gap-2">
        {examen && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex max-w-full items-center gap-1.5 truncate rounded-full bg-primary-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
              <Icon name="school" size={14} />
              {examen.nombre}
            </span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
              {examen.universidadNombre}
            </span>
          </div>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Resultado del simulacro</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-8">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            <Icon name="emoji_events" size={18} className="text-amber-400" />
            Tu puntaje
          </p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold tracking-tight text-primary-600 sm:text-6xl">{formatearPuntos(resumen.puntajeTotal)}</span>
            {examen?.puntajeTotal ? (
              <span className="font-display text-lg font-semibold text-slate-500">/ {examen.puntajeTotal} pts</span>
            ) : (
              <span className="font-display text-lg font-semibold text-slate-500">puntos</span>
            )}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {conteos.map((c) => (
              <div key={c.etiqueta} role="group" aria-label={c.etiqueta} className="rounded-xl border border-slate-200 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="truncate text-[11px] font-semibold text-slate-700 sm:text-sm">{c.etiqueta}</span>
                  {/* envuelto: .material-symbols-outlined (CSS sin capa) le gana a la utilidad `hidden` */}
                  <span className="hidden sm:inline-flex" aria-hidden="true">
                    <Icon name={c.icono} size={20} className={c.color} />
                  </span>
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl">{c.valor}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-50">
                  <div className={`h-full rounded-full ${c.barra}`} style={{ width: `${porcentaje(c.valor, totalItems)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {porcentaje(c.valor, totalItems)}%<span className="hidden sm:inline"> del total</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Gestión del tiempo</h2>
            <Icon name="schedule" size={24} className="text-accent-500" />
          </div>
          <div className="my-4 flex justify-center">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r={RADIO} fill="none" strokeWidth="10" className="stroke-primary-50" />
                {fraccionTiempo !== null && (
                  <circle
                    cx="60"
                    cy="60"
                    r={RADIO}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="stroke-primary-600"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={circunferencia * (1 - fraccionTiempo)}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-xl font-bold text-slate-900">{formatearDuracionLarga(resumen.tiempoUsadoSeg)}</span>
                {examen?.duracionSeg ? (
                  <span className="text-[11px] text-slate-500">de {formatearDuracionLarga(examen.duracionSeg)}</span>
                ) : (
                  <span className="text-[11px] text-slate-500">tiempo usado</span>
                )}
              </div>
            </div>
          </div>
          {totalItems > 0 && (
            <div className="mt-auto flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
              <span className="text-slate-700">Ritmo por pregunta</span>
              <span className="font-bold text-slate-900">{formatearDuracionLarga(resumen.tiempoUsadoSeg / totalItems)}</span>
            </div>
          )}
        </section>
      </div>

      {resumen.desglosePorTema.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">Desglose por tema</h2>
              <p className="text-xs text-slate-500 sm:text-sm">Aciertos, errores y preguntas en blanco en cada tema.</p>
            </div>
            <ul className="flex list-none flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-700">
              <li className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Correctas
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Incorrectas
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> En blanco
              </li>
            </ul>
          </div>
          <ol className="flex list-none flex-col gap-2">
            {resumen.desglosePorTema.map((tema, i) => {
              const items = tema.correctas + tema.incorrectas + tema.enBlanco
              const acierto = porcentaje(tema.correctas, items)
              return (
                <li key={tema.temaId} aria-label={tema.temaNombre} className="rounded-xl bg-slate-50/70 p-3 sm:p-3.5">
                  <div className="mb-2.5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 font-display text-xs font-bold text-primary-600">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="font-display text-sm font-bold text-slate-900 sm:text-base">{tema.temaNombre}</h3>
                        <p className="text-[11px] text-slate-500 sm:text-xs">
                          {items} {items === 1 ? 'ítem' : 'ítems'} · {tema.correctas} correctas · {tema.incorrectas} incorrectas · {tema.enBlanco} en blanco
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-bold sm:text-sm ${acierto >= 70 ? 'text-emerald-600' : acierto >= 40 ? 'text-amber-600' : 'text-rose-600'}`}
                    >
                      {acierto}% de acierto
                    </span>
                  </div>
                  <BarraApilada correctas={tema.correctas} incorrectas={tema.incorrectas} enBlanco={tema.enBlanco} />
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
            <Icon name="lightbulb" size={24} />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">¿Listo para reforzar tus puntos débiles?</h2>
            <p className="text-xs text-slate-500 sm:text-sm">Practica otro simulacro enfocándote en los temas con menor acierto.</p>
          </div>
        </div>
        <Acciones />
      </section>
    </PaginaAlumno>
  )
}
