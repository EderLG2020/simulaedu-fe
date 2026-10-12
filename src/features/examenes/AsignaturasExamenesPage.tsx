import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { listarExamenesPorUniversidad, type ExamenResumen } from '../../api/examenesApi'
import { iniciarSimulacro } from '../../api/simulacrosApi'
import { listarUniversidades, type UniversidadResumen } from '../../api/universidadesApi'
import { obtenerPerfil, seleccionarUniversidadObjetivo } from '../../api/usuariosApi'
import { useAuth } from '../../hooks/useAuth'
import { formatearDuracion } from '../../lib/formato'
import { TIPOS_PROGRAMA } from '../../lib/programas'
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

/** Los examenes de seleccion fija no tienen areas (cursos): se agrupan aparte para que no desaparezcan. */
const ASIGNATURA_SIMULACRO_COMPLETO = { cursoId: 'simulacro-completo', cursoNombre: 'Simulacro completo', icono: 'assignment' }

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
    const sinAreas = examenes.filter((e) => e.areas.length === 0)
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
    const porCurso = Array.from(mapa.values()).sort((a, b) => a.cursoNombre.localeCompare(b.cursoNombre))
    if (sinAreas.length === 0) return porCurso
    const { cursoId, cursoNombre } = ASIGNATURA_SIMULACRO_COMPLETO
    return [{ cursoId, cursoNombre, examenes: sinAreas }, ...porCurso]
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
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              arrow_back
            </span>
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
              <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm">
                    <span className="material-symbols-outlined text-3xl" aria-hidden="true">
                      {TIPOS_PROGRAMA[universidad.tipo ?? 'ADMISION'].icono}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-slate-700 ring-1 ring-slate-200">
                        {universidad.siglas}
                      </span>
                      {esUniversidadObjetivo && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-600">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          Tu universidad actual
                        </span>
                      )}
                    </div>
                    <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{universidad.nombre}</h1>
                    <p className="mt-1 text-sm text-slate-700">
                      {examenes.length} {examenes.length === 1 ? 'examen publicado' : 'examenes publicados'}
                      {asignaturas.length > 1 && ` en ${asignaturas.length} asignaturas`}
                    </p>
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
                {/* Con una sola asignatura el selector no aporta nada: se va directo a sus examenes. */}
                {asignaturas.length > 1 && (
                  <nav aria-label="Asignaturas" className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
                    {asignaturas.map((a) => {
                      const activa = a.cursoId === asignaturaActivaId
                      return (
                        <button
                          key={a.cursoId}
                          type="button"
                          aria-pressed={activa}
                          onClick={() => setAsignaturaActivaId(a.cursoId)}
                          className={`inline-flex shrink-0 items-center gap-2 rounded-full border py-2 pr-2.5 pl-3.5 text-sm font-semibold transition ${
                            activa
                              ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-primary-600 hover:text-primary-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">
                            {a.cursoId === ASIGNATURA_SIMULACRO_COMPLETO.cursoId
                              ? ASIGNATURA_SIMULACRO_COMPLETO.icono
                              : (ICONOS_POR_CURSO[a.cursoNombre] ?? ICONO_POR_DEFECTO)}
                          </span>
                          {a.cursoNombre}
                          <span
                            className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${
                              activa ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-700'
                            }`}
                          >
                            {a.examenes.length}
                          </span>
                        </button>
                      )
                    })}
                  </nav>
                )}

                {asignaturaActiva && (
                  <section aria-labelledby="titulo-examenes">
                    <h2 id="titulo-examenes" className="mb-4 font-display text-lg font-bold text-slate-900">
                      {asignaturas.length > 1 ? `Examenes de ${asignaturaActiva.cursoNombre}` : 'Examenes disponibles'}
                    </h2>

                    <div className="flex flex-col gap-4">
                      {asignaturaActiva.examenes.map((examen) => {
                        const penalizacion = penalizacionDe(examen.reglasCalificacion)
                        const sinPreguntas = !examen.disponible
                        const bloqueado = bloqueadoPorPlan || bloqueadoPorPrograma || sinPreguntas
                        const errorTarjeta = errorInicio?.examenId === examen.id ? errorInicio.mensaje : null
                        return (
                          <article
                            key={examen.id}
                            aria-label={examen.nombre}
                            className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white py-5 pr-5 pl-6 shadow-sm transition sm:py-6 sm:pr-6 sm:pl-7 ${
                              bloqueado ? 'opacity-75' : 'hover:border-primary-600/40 hover:shadow-md'
                            }`}
                          >
                            <span className={`absolute inset-y-0 left-0 w-1.5 ${bloqueado ? 'bg-slate-200' : 'bg-primary-600'}`} />

                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                {sinPreguntas && (
                                  <span className="mb-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                                    Sin preguntas disponibles aún
                                  </span>
                                )}
                                <h3 className="font-display text-base leading-snug font-bold text-slate-900 sm:text-lg">{examen.nombre}</h3>

                                <ul className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700">
                                  <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-lg text-primary-600" aria-hidden="true">schedule</span>
                                    {formatearDuracion(examen.duracionSeg)}
                                  </li>
                                  <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-lg text-amber-400" aria-hidden="true">grade</span>
                                    {examen.puntajeTotal} pts
                                  </li>
                                  <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-lg text-slate-500" aria-hidden="true">
                                      {examen.navegacion === 'LIBRE' ? 'swap_horiz' : 'arrow_forward'}
                                    </span>
                                    {examen.navegacion === 'LIBRE' ? 'Navegacion libre' : 'Navegacion secuencial'}
                                  </li>
                                  {examen.permitePausa && (
                                    <li className="flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-lg text-slate-500" aria-hidden="true">pause_circle</span>
                                      Puedes pausar
                                    </li>
                                  )}
                                  {penalizacion !== null && (
                                    <li className="flex items-center gap-1.5 font-semibold text-rose-600">
                                      <span className="material-symbols-outlined text-lg" aria-hidden="true">trending_down</span>
                                      <span className="sr-only">Penalizacion por error:</span>
                                      <span>Resta {formatearFraccion(penalizacion)} de la pregunta</span>
                                    </li>
                                  )}
                                </ul>
                              </div>

                              <div className="shrink-0 sm:w-48">
                                {bloqueado ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700"
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
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-60"
                                  >
                                    {iniciandoId === examen.id ? 'Iniciando...' : 'Iniciar prueba'}
                                    {iniciandoId !== examen.id && <span className="material-symbols-outlined text-base">arrow_forward</span>}
                                  </button>
                                )}
                              </div>
                            </div>

                            {sinPreguntas && !bloqueadoPorPlan && !bloqueadoPorPrograma && (
                              <p className="mt-3 text-xs text-slate-700">Tu docente aún no carga suficientes preguntas para este examen. Prueba con otro.</p>
                            )}
                            {errorTarjeta && (
                              <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                                {errorTarjeta}
                              </p>
                            )}
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
