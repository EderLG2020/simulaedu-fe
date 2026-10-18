import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { claves } from '../../api/claves'
import { listarExamenesPublicados, type ExamenResumen } from '../../api/examenesApi'
import { listarHistorial, type HistorialSimulacro } from '../../api/simulacrosApi'
import { useAuth } from '../../hooks/useAuth'
import { formatearDuracion } from '../../lib/formato'
import { useContextoLayout } from '../../routes/contextoLayout'
import Reveal from '../landing/Reveal'
import PaginaAlumno from './PaginaAlumno'
import { Icon } from '../../components/ui'

function formatearFecha(fecha: string | null): string {
  if (!fecha) return 'Sin fecha'
  return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ESTADO_INFO: Record<HistorialSimulacro['estado'], { texto: string; clase: string }> = {
  FINALIZADO: { texto: 'Finalizado', clase: 'bg-emerald-50 text-emerald-700' },
  FINALIZADO_POR_TIEMPO: { texto: 'Finalizado (tiempo)', clase: 'bg-amber-50 text-amber-700' },
  EN_CURSO: { texto: 'En curso', clase: 'bg-primary-50 text-primary-600' },
  PAUSADO: { texto: 'Pausado', clase: 'bg-slate-100 text-slate-600' },
}

// Constantes (no `?? []` en cada render): asi la referencia es estable para los useMemo.
const SIN_HISTORIAL: HistorialSimulacro[] = []
const SIN_EXAMENES: ExamenResumen[] = []

export default function EstudianteHomePage() {
  const { usuario } = useAuth()
  // El layout ya pide el contador para el encabezado: se reutiliza en las tarjetas de esta pagina.
  const noLeidas = useContextoLayout()?.noLeidas ?? 0
  // Si alguna falla, la tarjeta se muestra vacia (no hay pantalla de error en el inicio).
  const consultaHistorial = useQuery({ queryKey: claves.historial(1, 3), queryFn: () => listarHistorial(1, 3) })
  const consultaExamenes = useQuery({ queryKey: claves.examenes.publicados, queryFn: listarExamenesPublicados })
  const historial = consultaHistorial.isPending ? null : (consultaHistorial.data?.data ?? SIN_HISTORIAL)
  const totalHistorial = consultaHistorial.data?.meta.total ?? 0
  const examenes = consultaExamenes.isPending ? null : (consultaExamenes.data ?? SIN_EXAMENES)

  const universidadObjetivoId = usuario?.universidadObjetivoId ?? null

  const examenesFiltrados = useMemo(
    () => (examenes ?? []).filter((e) => !universidadObjetivoId || e.universidadId === universidadObjetivoId),
    [examenes, universidadObjetivoId],
  )
  const universidadObjetivoNombre = useMemo(
    () => examenesFiltrados[0]?.universidadNombre ?? examenes?.find((e) => e.universidadId === universidadObjetivoId)?.universidadNombre,
    [examenesFiltrados, examenes, universidadObjetivoId],
  )

  if (!usuario) return null

  return (
    <PaginaAlumno espaciado="amplio">
      {/* BIENVENIDA */}
      <Reveal className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-primary-50/70 blur-2xl" />
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Hola, <span className="text-primary-600">{usuario.nombre}</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-700">
              Bienvenido a tu panel de practica. Aqui tienes el control de tus simulacros y tu progreso.
            </p>

            {universidadObjetivoId ? (
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-medium text-slate-700">Tu meta de postulacion:</span>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-50 bg-primary-50 px-3.5 py-1.5 text-xs font-semibold text-primary-600">
                  <Icon name="account_balance" size={14} />
                  <span>{universidadObjetivoNombre ?? 'Universidad elegida'}</span>
                </div>
                <Link to="/examenes" className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
                  Cambiar
                  <Icon name="edit" size={14} />
                </Link>
              </div>
            ) : (
              <div className="mt-4 max-w-xl rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex items-start gap-3">
                  <Icon name="info" size={20} className="mt-0.5 shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-950">Aun no has elegido tu universidad objetivo</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-amber-800/90">
                      Antes de rendir tu primer simulacro, elige a que universidad postularas para calibrar los puntajes
                      y la penalizacion correctos.
                    </p>
                    <Link
                      to="/examenes"
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-accent-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-600"
                    >
                      <Icon name="flag" size={14} />
                      Elegir universidad objetivo
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start pt-2 md:self-auto md:pt-0">
            <div className="min-w-[100px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Simulacros</span>
              <span className="font-display text-xl font-bold text-slate-900 sm:text-2xl">{totalHistorial}</span>
            </div>
            <div className="min-w-[100px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <span className="block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Avisos</span>
              <span className="font-display text-xl font-bold text-accent-500 sm:text-2xl">{noLeidas}</span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ACCESOS RAPIDOS */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-slate-900">
          <Icon name="bolt" size={20} className="text-primary-600" />
          Accesos rapidos
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Reveal
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <Link to="/examenes" className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-600 group-hover:text-white">
                  <Icon name="quiz" size={24} />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-slate-900 transition group-hover:text-primary-600">
                    Examenes disponibles
                  </h3>
                  <Icon name="arrow_forward" size={24} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-primary-600" />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                  Rinde un simulacro cronometrado para tu universidad objetivo.
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                <span className="font-semibold text-primary-600">{examenesFiltrados.length} disponibles</span>
                <span className="font-medium text-slate-500">Ingresar</span>
              </div>
            </Link>
          </Reveal>

          <Reveal
            delayMs={70}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <Link to="/simulacros/historial" className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-800 group-hover:text-white">
                  <Icon name="history" size={24} />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-slate-900 transition group-hover:text-primary-600">
                    Mi historial
                  </h3>
                  <Icon name="arrow_forward" size={24} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-primary-600" />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                  Revisa tus simulacros anteriores y tu evolucion de puntaje.
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                <span className="font-semibold text-slate-700">
                  {totalHistorial > 0 ? `${totalHistorial} rendidos` : 'Sin historial aun'}
                </span>
                <span className="font-medium text-slate-500">Ver</span>
              </div>
            </Link>
          </Reveal>

          <Reveal
            delayMs={140}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <Link to="/notificaciones" className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-500 transition group-hover:bg-accent-500 group-hover:text-white">
                  <Icon name="notifications" size={24} />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 transition group-hover:text-accent-500">
                    Notificaciones
                    {noLeidas > 0 && (
                      <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-bold text-accent-600">
                        {noLeidas} nueva{noLeidas > 1 ? 's' : ''}
                      </span>
                    )}
                  </h3>
                  <Icon name="arrow_forward" size={24} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-accent-500" />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                  Avisos sobre tu cuenta y tus limites de plan.
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                <span className="font-semibold text-accent-600">Revisar mensajes</span>
                <span className="font-medium text-slate-500">Abrir</span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ACTIVIDAD RECIENTE */}
      <Reveal className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900">
              <Icon name="history_toggle_off" size={20} className="text-primary-600" />
              Tu actividad reciente
            </h2>
            <p className="mt-0.5 text-xs text-slate-700">Ultimos simulacros rendidos y registrados en tu cuenta</p>
          </div>
        </div>

        {historial === null ? (
          <p className="py-6 text-center text-sm text-slate-700">Cargando...</p>
        ) : historial.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-primary-50 bg-primary-50/40 text-primary-600">
              <Icon name="edit_note" size={30} />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900">Todavia no has rendido ningun simulacro</h3>
            <p className="mt-1.5 max-w-sm text-sm text-slate-700">
              Tu historial se registrara automaticamente cuando completes tu primer simulacro cronometrado.
            </p>
            <Link
              to="/examenes"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-accent-500 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-accent-600"
            >
              <Icon name="play_arrow" size={18} />
              Rendir mi primer simulacro
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="px-3 py-2.5">Examen / Universidad</th>
                    <th className="px-3 py-2.5">Fecha</th>
                    <th className="px-3 py-2.5">Puntaje</th>
                    <th className="px-3 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historial.map((h) => (
                    <tr key={h.simulacroId} className="transition hover:bg-slate-50">
                      <td className="px-3 py-3.5">
                        <span className="block leading-tight font-semibold text-slate-900">{h.examenNombre}</span>
                        <span className="text-xs text-slate-500">{h.universidadNombre}</span>
                      </td>
                      <td className="px-3 py-3.5 text-xs whitespace-nowrap text-slate-700">{formatearFecha(h.fecha)}</td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="font-display font-bold text-slate-900">{h.puntajeTotal}</span>
                        <span className="ml-1 text-xs text-slate-500">pts</span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ESTADO_INFO[h.estado].clase}`}>
                          {ESTADO_INFO[h.estado].texto}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-xs text-slate-500">Mostrando {historial.length} de {totalHistorial} simulacros</span>
              <Link to="/simulacros/historial" className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-800">
                Ver historial completo
                <Icon name="arrow_forward" size={14} />
              </Link>
            </div>
          </>
        )}
      </Reveal>

      {/* EXAMENES DISPONIBLES (preview) */}
      {examenesFiltrados.length > 0 && (
        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900">
                <Icon name="assignment" size={20} className="text-primary-600" />
                Examenes disponibles para rendir
              </h2>
              {universidadObjetivoNombre && (
                <p className="text-xs text-slate-700">
                  Filtrados automaticamente para <span className="font-semibold text-slate-900">{universidadObjetivoNombre}</span>
                </p>
              )}
            </div>
            <Link to="/examenes" className="text-xs font-bold text-primary-600 hover:text-primary-800">
              Ver todos
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {examenesFiltrados.slice(0, 2).map((examen) => (
              <div
                key={examen.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-600/40"
              >
                <div>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="rounded-full border border-primary-50 bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-600">
                      {examen.puntajeTotal} pts
                    </span>
                    <span className="text-xs font-medium text-slate-500">{formatearDuracion(examen.duracionSeg)}</span>
                  </div>
                  <h4 className="font-display text-base font-bold text-slate-900">{examen.nombre}</h4>
                  <p className="mt-1 text-xs text-slate-700">
                    {examen.navegacion === 'LIBRE' ? 'Navegacion libre' : 'Navegacion secuencial'} - {examen.universidadNombre}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-end border-t border-slate-200 pt-3">
                  <Link
                    to="/examenes"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-600"
                  >
                    <Icon name="play_arrow" size={14} />
                    Iniciar prueba
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </PaginaAlumno>
  )
}
