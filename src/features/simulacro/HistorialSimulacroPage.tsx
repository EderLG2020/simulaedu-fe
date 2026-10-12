import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PageMeta } from '../../api/client'
import { listarHistorial, type HistorialSimulacro } from '../../api/simulacrosApi'
import StudentHeader from '../home/StudentHeader'
import { formatearPuntos } from './formatoSimulacro'
import GraficoEvolucion from './GraficoEvolucion'

/** Migracion del mockup de Stitch "historial de simulacros". Se omitieron los datos que el mockup inventaba
 * ("+4 este mes", "vs promedio general", ritmo, meta por universidad) y el boton "Desbloquear con Premium":
 * aun no hay pagina de planes para el estudiante a la cual llevarlo. */

const LIMITE_POR_PAGINA = 20
const MAX_PUNTOS_GRAFICO = 10

const formatoFecha = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
const formatoHora = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })

function formatearFecha(fecha: string | null): string {
  if (fecha === null) return '—'
  const d = new Date(fecha)
  return `${formatoFecha.format(d).replace('.', '')} · ${formatoHora.format(d)}`
}

/** `corta` se usa en la columna de la tabla (desktop), donde la etiqueta completa no entra. */
const ESTADOS: Record<HistorialSimulacro['estado'], { etiqueta: string; corta: string; icono: string; clase: string }> = {
  FINALIZADO: { etiqueta: 'Finalizado', corta: 'Finalizado', icono: 'check_circle', clase: 'bg-emerald-50 text-emerald-700' },
  FINALIZADO_POR_TIEMPO: { etiqueta: 'Finalizado por tiempo', corta: 'Por tiempo', icono: 'timer_off', clase: 'bg-amber-50 text-amber-700' },
  PAUSADO: { etiqueta: 'Pausado', corta: 'Pausado', icono: 'pause_circle', clase: 'bg-slate-100 text-slate-600' },
  EN_CURSO: { etiqueta: 'En curso', corta: 'En curso', icono: 'play_circle', clase: 'bg-primary-50 text-primary-600' },
}

function ChipEstado({ estado }: { estado: HistorialSimulacro['estado'] }) {
  const info = ESTADOS[estado]
  return (
    <span title={info.etiqueta} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${info.clase}`}>
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
        {info.icono}
      </span>
      <span className="md:hidden">{info.etiqueta}</span>
      <span className="hidden md:inline" aria-hidden="true">
        {info.corta}
      </span>
      {info.corta !== info.etiqueta && <span className="sr-only hidden md:inline">{info.etiqueta}</span>}
    </span>
  )
}

function TarjetaResumen({
  etiqueta,
  etiquetaCorta,
  valor,
  sufijo,
  icono,
  claseIcono,
  detalle,
}: {
  etiqueta: string
  etiquetaCorta: string
  valor: string
  sufijo?: string
  icono: string
  claseIcono: string
  detalle?: string
}) {
  return (
    <div role="group" aria-label={etiqueta} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase sm:text-[11px]" aria-hidden="true">
          <span className="sm:hidden">{etiquetaCorta}</span>
          <span className="hidden sm:inline">{etiqueta}</span>
        </p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{valor}</span>
          {sufijo && <span className="hidden text-xs font-semibold text-slate-500 sm:inline">{sufijo}</span>}
        </p>
        {detalle && <p className="mt-1 hidden truncate text-xs text-slate-500 sm:block">{detalle}</p>}
      </div>
      {/* envuelto: .material-symbols-outlined (CSS sin capa) le gana a la utilidad `hidden` */}
      <span className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex ${claseIcono}`} aria-hidden="true">
        <span className="material-symbols-outlined text-2xl">{icono}</span>
      </span>
    </div>
  )
}

function Esqueleto() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-label="Cargando historial">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded-2xl bg-white shadow-sm sm:h-14" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white shadow-sm" />
    </div>
  )
}

export default function HistorialSimulacroPage() {
  const [historial, setHistorial] = useState<HistorialSimulacro[] | null>(null)
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [pagina, setPagina] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    listarHistorial(pagina, LIMITE_POR_PAGINA)
      .then((resultado) => {
        setHistorial(resultado.data)
        setMeta(resultado.meta)
        setError(null)
      })
      .catch(() => setError('No se pudo cargar el historial de simulacros.'))
  }, [pagina, intento])

  function reintentar() {
    setError(null)
    setIntento((n) => n + 1)
  }

  const total = meta?.total ?? historial?.length ?? 0
  // RN-08: el plan Free recibe siempre un solo item (el ultimo) aunque meta.total refleje el total real.
  const limitadoPorPlan = historial !== null && historial.length === 1 && total > 1
  const haySiguiente = historial !== null && meta !== null && historial.length === LIMITE_POR_PAGINA && pagina < meta.totalPages
  const puntajes = historial?.map((h) => h.puntajeTotal) ?? []
  const mejor = historial && historial.length > 0 ? historial.reduce((a, b) => (b.puntajeTotal > a.puntajeTotal ? b : a)) : null
  const promedio = puntajes.length > 0 ? puntajes.reduce((a, b) => a + b, 0) / puntajes.length : 0
  const puntosGrafico = (historial ?? [])
    .slice(0, MAX_PUNTOS_GRAFICO)
    .reverse()
    .map((h) => ({ fecha: h.fecha, puntaje: h.puntajeTotal }))

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900">
      <StudentHeader />

      <main className="mx-auto flex max-w-[1100px] flex-col gap-4 px-4 py-6 sm:gap-5 sm:px-6">
        <div>
          <nav aria-label="Ruta de navegación" className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="font-medium transition hover:text-primary-600">
              Inicio
            </Link>
            <span className="material-symbols-outlined text-sm text-slate-200">chevron_right</span>
            <span className="font-semibold text-slate-900">Historial</span>
          </nav>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Historial de simulacros</h1>
          <p className="text-sm text-slate-500">Revisa cómo te fue en tus simulacros anteriores.</p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <span className="material-symbols-outlined">error</span>
            <span className="flex-1">{error}</span>
            <button type="button" onClick={reintentar} className="flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-rose-700 ring-2 ring-rose-100 transition hover:bg-rose-100">
              <span className="material-symbols-outlined text-base">refresh</span>
              Reintentar
            </button>
          </div>
        )}

        {historial === null && !error && <Esqueleto />}

        {historial !== null && historial.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <span className="material-symbols-outlined text-3xl">history</span>
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900">Todavía no has rendido ningún simulacro</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">Cuando finalices tu primer simulacro, verás aquí tu puntaje y cómo evolucionas.</p>
            <Link
              to="/examenes"
              className="mt-5 flex h-11 items-center gap-2 rounded-xl bg-accent-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-accent-600"
            >
              Rendir mi primer simulacro
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>
        )}

        {historial !== null && historial.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <TarjetaResumen etiqueta="Simulacros rendidos" etiquetaCorta="Rendidos" valor={String(total)} sufijo="en total" icono="fact_check" claseIcono="bg-primary-50 text-primary-600" />
              <TarjetaResumen
                etiqueta="Mejor puntaje"
                etiquetaCorta="Mejor"
                valor={formatearPuntos(mejor!.puntajeTotal)}
                sufijo="pts"
                icono="emoji_events"
                claseIcono="bg-amber-50 text-amber-500"
                detalle={mejor!.examenNombre}
              />
              <TarjetaResumen etiqueta="Puntaje promedio" etiquetaCorta="Promedio" valor={formatearPuntos(Math.round(promedio * 100) / 100)} sufijo="pts" icono="query_stats" claseIcono="bg-emerald-50 text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-12">
              {puntosGrafico.length >= 2 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="flex items-center gap-1.5 font-display text-base font-bold text-slate-900">
                        <span className="material-symbols-outlined text-xl text-primary-600">trending_up</span>
                        Tu evolución
                      </h2>
                      <p className="text-xs text-slate-500">Últimos {puntosGrafico.length} simulacros</p>
                    </div>
                    <span className="rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-accent-700">
                      Máximo {formatearPuntos(Math.max(...puntosGrafico.map((p) => p.puntaje)))} pts
                    </span>
                  </div>
                  <GraficoEvolucion puntos={puntosGrafico} />
                </section>
              )}

              <section className={`flex flex-col gap-4 ${puntosGrafico.length >= 2 ? 'lg:order-first lg:col-span-8' : 'lg:col-span-12'}`}>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="hidden grid-cols-[minmax(0,1fr)_136px_84px_120px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase md:grid">
                    <span>Examen</span>
                    <span>Fecha</span>
                    <span className="text-right">Puntaje</span>
                    <span className="text-right">Estado</span>
                  </div>
                  <ul className="list-none divide-y divide-slate-100">
                    {historial.map((h) => (
                      <li
                        key={h.simulacroId}
                        aria-label={h.examenNombre}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 px-4 py-3.5 transition hover:bg-slate-50/60 md:grid-cols-[minmax(0,1fr)_136px_84px_120px] md:items-center md:gap-4 md:px-5"
                      >
                        <div className="min-w-0">
                          <p title={h.examenNombre} className="truncate text-sm font-bold text-slate-900">
                            {h.examenNombre}
                          </p>
                          <p title={h.universidadNombre} className="truncate text-xs text-slate-500">
                            {h.universidadNombre}
                          </p>
                        </div>
                        <p className="order-3 col-span-2 flex items-center gap-2 text-xs whitespace-nowrap text-slate-700 md:order-none md:col-span-1">
                          <span className="inline-flex md:hidden" aria-hidden="true">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                          </span>
                          {formatearFecha(h.fecha)}
                        </p>
                        <p className="row-span-2 text-right md:row-span-1">
                          <span className="font-display text-xl font-bold text-primary-600">{formatearPuntos(h.puntajeTotal)}</span>
                          <span className="ml-0.5 text-[11px] font-semibold text-slate-500">pts</span>
                        </p>
                        <div className="order-4 text-right md:order-none">
                          <ChipEstado estado={h.estado} />
                        </div>
                      </li>
                    ))}
                  </ul>

                  {!limitadoPorPlan && meta !== null && (meta.totalPages > 1 || pagina > 1) && (
                    <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-sm">
                      <button
                        type="button"
                        disabled={pagina <= 1}
                        onClick={() => setPagina((p) => p - 1)}
                        className="flex h-9 items-center gap-2 rounded-lg px-3 font-semibold text-slate-700 transition hover:bg-white disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                        Anterior
                      </button>
                      <span className="text-xs whitespace-nowrap text-slate-700 sm:text-sm">
                        <span className="sm:hidden">
                          Pág. {meta.page} de {meta.totalPages} ({meta.total})
                        </span>
                        <span className="hidden sm:inline">
                          Página {meta.page} de {meta.totalPages} ({meta.total} simulacros)
                        </span>
                      </span>
                      <button
                        type="button"
                        disabled={!haySiguiente}
                        onClick={() => setPagina((p) => p + 1)}
                        className="flex h-9 items-center gap-2 rounded-lg px-3 font-semibold text-primary-600 transition hover:bg-white disabled:opacity-40"
                      >
                        Siguiente
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>
                  )}
                </div>

                {limitadoPorPlan && (
                  <div className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
                      <span className="material-symbols-outlined">lock</span>
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Tienes {total} simulacros rendidos. Con el plan Free solo ves el último.</p>
                      <p className="mt-0.5 text-xs text-slate-700">Con el plan Premium puedes revisar tu historial completo y ver tu evolución.</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
