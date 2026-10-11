import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarExamenesPublicados, type ExamenResumen } from '../../api/examenesApi'
import { contarNoLeidas } from '../../api/notificacionesApi'
import { listarHistorial, type HistorialSimulacro } from '../../api/simulacrosApi'
import { useAuth } from '../../hooks/useAuth'
import { formatearDuracion } from '../../lib/formato'
import Reveal from '../landing/Reveal'
import StudentHeader from './StudentHeader'

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

export default function EstudianteHomePage() {
  const { usuario } = useAuth()
  const [noLeidas, setNoLeidas] = useState(0)
  const [historial, setHistorial] = useState<HistorialSimulacro[] | null>(null)
  const [totalHistorial, setTotalHistorial] = useState(0)
  const [examenes, setExamenes] = useState<ExamenResumen[] | null>(null)

  useEffect(() => {
    contarNoLeidas().then(setNoLeidas).catch(() => {})
    listarHistorial(1, 3)
      .then((r) => {
        setHistorial(r.data)
        setTotalHistorial(r.meta.total)
      })
      .catch(() => setHistorial([]))
    listarExamenesPublicados()
      .then(setExamenes)
      .catch(() => setExamenes([]))
  }, [])

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
    <div className="min-h-screen bg-slate-50 font-body text-slate-900">
      <StudentHeader noLeidas={noLeidas} />

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        {/* BIENVENIDA */}
        <Reveal className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
                    <span className="material-symbols-outlined text-sm">account_balance</span>
                    <span>{universidadObjetivoNombre ?? 'Universidad elegida'}</span>
                  </div>
                  <Link to="/examenes" className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
                    Cambiar
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </Link>
                </div>
              ) : (
                <div className="mt-4 max-w-xl rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 shrink-0 text-xl text-amber-600">info</span>
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
                        <span className="material-symbols-outlined text-sm">flag</span>
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
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-slate-900">
            <span className="material-symbols-outlined text-xl text-primary-600">bolt</span>
            Accesos rapidos
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Reveal
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Link to="/examenes" className="flex h-full flex-col justify-between">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-600 group-hover:text-white">
                    <span className="material-symbols-outlined text-2xl">quiz</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-slate-900 transition group-hover:text-primary-600">
                      Examenes disponibles
                    </h3>
                    <span className="material-symbols-outlined text-slate-500 transition group-hover:translate-x-1 group-hover:text-primary-600">
                      arrow_forward
                    </span>
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
                    <span className="material-symbols-outlined text-2xl">history</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-slate-900 transition group-hover:text-primary-600">
                      Mi historial
                    </h3>
                    <span className="material-symbols-outlined text-slate-500 transition group-hover:translate-x-1 group-hover:text-primary-600">
                      arrow_forward
                    </span>
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
                    <span className="material-symbols-outlined text-2xl">notifications</span>
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
                    <span className="material-symbols-outlined text-slate-500 transition group-hover:translate-x-1 group-hover:text-accent-500">
                      arrow_forward
                    </span>
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
        <Reveal className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900">
                <span className="material-symbols-outlined text-xl text-primary-600">history_toggle_off</span>
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
                <span className="material-symbols-outlined text-3xl">edit_note</span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">Todavia no has rendido ningun simulacro</h3>
              <p className="mt-1.5 max-w-sm text-sm text-slate-700">
                Tu historial se registrara automaticamente cuando completes tu primer simulacro cronometrado.
              </p>
              <Link
                to="/examenes"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-accent-500 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-accent-600"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
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
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </>
          )}
        </Reveal>

        {/* EXAMENES DISPONIBLES (preview) */}
        {examenesFiltrados.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900">
                  <span className="material-symbols-outlined text-xl text-primary-600">assignment</span>
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
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      Iniciar prueba
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-700">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-900">SimulaEdu</span>
            <span className="text-slate-200">|</span>
            <span>&copy; 2026 SimulaEdu Peru. Todos los derechos reservados.</span>
          </div>
          <a href="mailto:soporte@simulaedu.pe" className="flex items-center gap-1 font-medium transition hover:text-primary-600">
            <span className="material-symbols-outlined text-sm">support_agent</span>
            Contactar soporte
          </a>
        </div>
      </footer>
    </div>
  )
}
