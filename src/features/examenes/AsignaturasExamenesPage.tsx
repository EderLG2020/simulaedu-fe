import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { listarExamenesPorUniversidad, type ExamenResumen } from '../../api/examenesApi'
import { iniciarSimulacro } from '../../api/simulacrosApi'
import { listarUniversidades, type UniversidadResumen } from '../../api/universidadesApi'
import { obtenerPerfil, seleccionarUniversidadObjetivo } from '../../api/usuariosApi'
import { useAuth } from '../../hooks/useAuth'
import { formatearDuracion } from '../../lib/formato'
import { formatearFraccion, penalizacionDe } from '../../lib/reglasCalificacion'
import StudentHeader from '../home/StudentHeader'
import Reveal from '../landing/Reveal'

interface Asignatura {
  cursoId: string
  cursoNombre: string
  examenes: ExamenResumen[]
}

const ICONOS_POR_CURSO: Record<string, string> = {
  Matematica: 'calculate',
  'Razonamiento Matematico': 'psychology',
  Comunicacion: 'menu_book',
  Fisica: 'science',
  Quimica: 'biotech',
  'Historia del Peru y el Mundo': 'history_edu',
}

const ICONO_POR_DEFECTO = 'auto_stories'

export default function AsignaturasExamenesPage() {
  const { universidadId } = useParams<{ universidadId: string }>()
  const navigate = useNavigate()
  const { usuario, actualizarUsuario } = useAuth()

  const [universidades, setUniversidades] = useState<UniversidadResumen[]>([])
  const [universidad, setUniversidad] = useState<UniversidadResumen | null>(null)
  const [examenes, setExamenes] = useState<ExamenResumen[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorInicio, setErrorInicio] = useState<{ examenId: string; mensaje: string } | null>(null)
  const [asignaturaActivaId, setAsignaturaActivaId] = useState<string | null>(null)
  const [iniciandoId, setIniciandoId] = useState<string | null>(null)
  const [fijandoMeta, setFijandoMeta] = useState(false)

  // El usuario del store puede venir de un login viejo sin `planLimitaUniversidades`: se refresca al entrar.
  useEffect(() => {
    obtenerPerfil().then(actualizarUsuario).catch(() => {})
  }, [actualizarUsuario])

  useEffect(() => {
    if (!universidadId) return
    setUniversidad(null)
    setExamenes(null)
    setAsignaturaActivaId(null)
    setErrorInicio(null)
    Promise.all([listarUniversidades(), listarExamenesPorUniversidad(universidadId)])
      .then(([todas, examenesUniversidad]) => {
        setUniversidades(todas)
        setUniversidad(todas.find((u) => u.id === universidadId) ?? null)
        setExamenes(examenesUniversidad)
      })
      .catch(() => setError('No se pudo cargar la informacion de esta universidad.'))
  }, [universidadId])

  const asignaturas = useMemo<Asignatura[]>(() => {
    if (!examenes) return []
    const mapa = new Map<string, Asignatura>()
    for (const examen of examenes) {
      for (const area of examen.areas) {
        const existente = mapa.get(area.cursoId)
        if (existente) {
          if (!existente.examenes.some((e) => e.id === examen.id)) existente.examenes.push(examen)
        } else {
          mapa.set(area.cursoId, { cursoId: area.cursoId, cursoNombre: area.cursoNombre, examenes: [examen] })
        }
      }
    }
    return Array.from(mapa.values()).sort((a, b) => a.cursoNombre.localeCompare(b.cursoNombre))
  }, [examenes])

  useEffect(() => {
    if (asignaturas.length > 0 && !asignaturaActivaId) {
      setAsignaturaActivaId(asignaturas[0].cursoId)
    }
  }, [asignaturas, asignaturaActivaId])

  async function handleIniciar(examen: ExamenResumen) {
    setErrorInicio(null)
    setIniciandoId(examen.id)
    try {
      const simulacro = await iniciarSimulacro(examen.id, 'PRACTICA_LIBRE')
      navigate(`/simulacros/${simulacro.id}`, { state: { simulacro } })
    } catch (err) {
      // Junto a la tarjeta pulsada: un aviso arriba de la pagina pasaba desapercibido y el alumno no sabia que paso.
      setErrorInicio({ examenId: examen.id, mensaje: err instanceof ApiError ? err.message : 'No se pudo iniciar el simulacro.' })
      setIniciandoId(null)
    }
  }

  async function handleUsarComoMeta() {
    if (!universidadId) return
    setFijandoMeta(true)
    setError(null)
    try {
      const usuarioActualizado = await seleccionarUniversidadObjetivo(universidadId)
      actualizarUsuario(usuarioActualizado)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar tu universidad objetivo.')
    } finally {
      setFijandoMeta(false)
    }
  }

  const cargando = universidad === null || examenes === null
  const asignaturaActiva = asignaturas.find((a) => a.cursoId === asignaturaActivaId) ?? null
  const esUniversidadObjetivo = usuario?.universidadObjetivoId === universidadId
  // RN-02 (mismo criterio que SimulacroService.validarUniversidadObjetivo): plan con limite + otra meta ya fijada.
  // V20: idiomas y tecnologia no cuentan como universidad meta; solo se rinden con un plan que
  // los incluya (mismo criterio que SimulacroService.validarProgramaIncluido).
  const esAdmision = (universidad?.tipo ?? 'ADMISION') === 'ADMISION'
  const planLimita = esAdmision && usuario?.planLimitaUniversidades === true
  const bloqueadoPorPrograma = !esAdmision && usuario?.planIncluyeProgramas !== true
  const bloqueadoPorPlan = planLimita && !!usuario?.universidadObjetivoId && !esUniversidadObjetivo
  const fijaraMetaAlIniciar = planLimita && !usuario?.universidadObjetivoId
  const universidadMeta = universidades.find((u) => u.id === usuario?.universidadObjetivoId)

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900">
      <StudentHeader />

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <nav aria-label="Ruta de navegacion" className="mb-4 flex items-center gap-1.5 text-sm text-slate-700">
          <Link to="/examenes" className="flex items-center gap-1 font-medium transition hover:text-primary-600">
            <span className="material-symbols-outlined text-base">school</span>
            Programas
          </Link>
          <span className="material-symbols-outlined text-sm text-slate-200">chevron_right</span>
          <span className="truncate font-semibold text-slate-900">{universidad?.siglas ?? '...'}</span>
        </nav>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>
        )}

        {cargando && !error && <p className="py-10 text-center text-sm text-slate-700">Cargando...</p>}

        {universidad && examenes && (
          <>
            <Reveal className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-primary-50/60 blur-3xl" />
              <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-600 font-display text-sm font-bold tracking-wide text-white shadow-sm">
                    {universidad.siglas}
                  </div>
                  <div>
                    {esUniversidadObjetivo && (
                      <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-600">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Tu universidad actual
                      </span>
                    )}
                    <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{universidad.nombre}</h1>
                    <p className="mt-1 text-sm text-slate-700">Simulacros y banco de preguntas de {universidad.siglas}.</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  {esAdmision && !esUniversidadObjetivo && !bloqueadoPorPlan && (
                    <button
                      type="button"
                      disabled={fijandoMeta}
                      onClick={handleUsarComoMeta}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-sm">flag</span>
                      {fijandoMeta ? 'Guardando...' : 'Usar como mi meta'}
                    </button>
                  )}
                  <Link
                    to="/examenes"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-primary-50 hover:text-primary-600"
                  >
                    <span className="material-symbols-outlined text-sm">swap_horiz</span>
                    Ver otros programas
                  </Link>
                </div>
              </div>

              <div className="relative z-10 mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-200 pt-4 text-xs text-slate-700">
                <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <span className="h-2 w-2 rounded-full bg-primary-600" />
                  {asignaturas.length} {asignaturas.length === 1 ? 'asignatura' : 'asignaturas'}
                </span>
                <span className="text-slate-200">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-accent-500">task_alt</span>
                  {examenes.length} {examenes.length === 1 ? 'examen publicado' : 'examenes publicados'}
                </span>
              </div>
            </Reveal>

            {bloqueadoPorPlan && (
              <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-2xl text-amber-600">lock</span>
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      Tu plan Free solo te permite practicar con {universidadMeta?.siglas ?? 'tu universidad meta'} (tu meta actual).
                    </p>
                    <p className="mt-0.5 text-sm text-amber-800">
                      Para practicar con {universidad.siglas}, cámbiala como tu meta. Podrás volver a cambiarla cuando quieras.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={fijandoMeta}
                  onClick={handleUsarComoMeta}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-base">flag</span>
                  {fijandoMeta ? 'Guardando...' : `Usar ${universidad.siglas} como mi meta`}
                </button>
              </div>
            )}

            {bloqueadoPorPrograma && (
              <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-2xl text-amber-600">lock</span>
                <div>
                  <p className="text-sm font-bold text-amber-900">Los programas de idiomas y tecnología están incluidos en el plan Premium.</p>
                  <p className="mt-0.5 text-sm text-amber-800">Puedes ver sus exámenes; para rendirlos, actualiza tu plan.</p>
                </div>
              </div>
            )}

            {fijaraMetaAlIniciar && (
              <div className="mb-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <span className="material-symbols-outlined shrink-0 text-xl text-primary-600">info</span>
                <p>
                  Con tu plan Free practicas con una universidad a la vez: al iniciar tu primer simulacro, {universidad.siglas} quedará como tu
                  universidad meta.
                </p>
              </div>
            )}

            {asignaturas.length === 0 ? (
              <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900">Sin examenes publicados todavia</h3>
                <p className="mt-1.5 max-w-md text-sm text-slate-700">
                  Aun no hay simulacros disponibles para {universidad.nombre}. Vuelve pronto o elige otro programa.
                </p>
                <Link
                  to="/examenes"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800"
                >
                  Ver otros programas
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </Link>
              </div>
            ) : (
              <>
                <section className="mb-6">
                  <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-slate-900">
                    <span className="material-symbols-outlined text-xl text-primary-600">auto_stories</span>
                    Asignaturas evaluadas
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {asignaturas.map((a) => {
                      const activa = a.cursoId === asignaturaActivaId
                      return (
                        <button
                          key={a.cursoId}
                          type="button"
                          onClick={() => setAsignaturaActivaId(a.cursoId)}
                          className={`group relative overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                            activa ? 'border-primary-600 shadow-md' : 'border-slate-200'
                          }`}
                        >
                          <span
                            className={`absolute top-0 left-0 h-full w-1.5 transition ${activa ? 'bg-primary-600' : 'bg-transparent'}`}
                          />
                          <div className="flex items-start justify-between gap-2 pl-1.5">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                                activa ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="material-symbols-outlined text-2xl">
                                {ICONOS_POR_CURSO[a.cursoNombre] ?? ICONO_POR_DEFECTO}
                              </span>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                activa ? 'bg-primary-600/10 text-primary-600' : 'bg-slate-50 text-slate-700'
                              }`}
                            >
                              {a.examenes.length} {a.examenes.length === 1 ? 'examen' : 'examenes'}
                            </span>
                          </div>
                          <h3 className="mt-3 pl-1.5 font-display text-sm font-bold text-slate-900">{a.cursoNombre}</h3>
                        </button>
                      )
                    })}
                  </div>
                </section>

                {asignaturaActiva && (
                  <section>
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />
                          <span className="text-xs font-bold tracking-wider text-primary-600 uppercase">Asignatura activa</span>
                        </div>
                        <h2 className="font-display text-lg font-bold text-slate-900">
                          Examenes de {asignaturaActiva.cursoNombre} ({universidad.siglas})
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {asignaturaActiva.examenes.map((examen) => {
                        const penalizacion = penalizacionDe(examen.reglasCalificacion)
                        const sinPreguntas = !examen.disponible
                        const bloqueado = bloqueadoPorPlan || bloqueadoPorPrograma || sinPreguntas
                        const errorTarjeta = errorInicio?.examenId === examen.id ? errorInicio.mensaje : null
                        return (
                          <article
                            key={examen.id}
                            aria-label={examen.nombre}
                            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition ${
                              bloqueado ? 'opacity-75' : 'hover:shadow-lg'
                            }`}
                          >
                            <div className={`absolute top-0 right-0 left-0 h-1.5 ${bloqueado ? 'bg-slate-200' : 'bg-primary-600'}`} />
                            <div>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                {sinPreguntas ? (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                                    Sin preguntas disponibles aún
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-600">
                                    {examen.navegacion === 'LIBRE' ? 'Navegacion libre' : 'Navegacion secuencial'}
                                  </span>
                                )}
                                <span className="text-xs font-medium text-slate-500">{formatearDuracion(examen.duracionSeg)}</span>
                              </div>
                              <h3 className="font-display text-base leading-snug font-bold text-slate-900">{examen.nombre}</h3>

                              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-lg text-primary-600">schedule</span>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-semibold text-slate-500">Duracion</span>
                                    <span className="text-xs font-bold text-slate-900">{formatearDuracion(examen.duracionSeg)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-lg text-amber-400">grade</span>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-semibold text-slate-500">Puntaje max.</span>
                                    <span className="text-xs font-bold text-slate-900">{examen.puntajeTotal} pts</span>
                                  </div>
                                </div>
                                {penalizacion !== null && (
                                  <div className="col-span-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg text-rose-500">trending_down</span>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-semibold text-slate-500">Penalizacion por error</span>
                                      <span className="text-xs font-bold text-rose-600">Resta {formatearFraccion(penalizacion)} de la pregunta</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-5 flex flex-col gap-2">
                              {bloqueado ? (
                                <button
                                  type="button"
                                  disabled
                                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-bold text-slate-700"
                                >
                                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                                    lock
                                  </span>
                                  {bloqueadoPorPrograma ? 'Incluido en Premium' : bloqueadoPorPlan ? 'Bloqueado por tu plan' : 'No disponible'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={iniciandoId === examen.id}
                                  onClick={() => handleIniciar(examen)}
                                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-60"
                                >
                                  {iniciandoId === examen.id ? 'Iniciando...' : 'Iniciar prueba'}
                                  {iniciandoId !== examen.id && <span className="material-symbols-outlined text-base">arrow_forward</span>}
                                </button>
                              )}
                              {sinPreguntas && !bloqueadoPorPlan && !bloqueadoPorPrograma && (
                                <p className="text-xs text-slate-700">Tu docente aún no carga suficientes preguntas para este examen. Prueba con otro.</p>
                              )}
                              {errorTarjeta && (
                                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                                  {errorTarjeta}
                                </p>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
