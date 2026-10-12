import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { listarExamenesPorUniversidad, type ExamenResumen } from '../../api/examenesApi'
import { iniciarSimulacro } from '../../api/simulacrosApi'
import { listarUniversidades, type UniversidadResumen } from '../../api/universidadesApi'
import { obtenerPerfil, seleccionarUniversidadObjetivo } from '../../api/usuariosApi'
import { useAuth } from '../../hooks/useAuth'
import { TIPOS_PROGRAMA } from '../../lib/programas'
import StudentHeader from '../home/StudentHeader'
import Reveal from '../landing/Reveal'
import { resumenPorTipo } from './resumenExamenes'
import TarjetaExamen, { type MotivoBloqueo } from './TarjetaExamen'

const ICONOS_POR_CURSO: Record<string, string> = {
  Matematica: 'calculate',
  'Razonamiento Matematico': 'psychology',
  Comunicacion: 'menu_book',
  Fisica: 'science',
  Quimica: 'biotech',
  'Historia del Peru y el Mundo': 'history_edu',
}

const ICONO_POR_DEFECTO = 'auto_stories'

interface CursoDePracticas {
  cursoId: string
  cursoNombre: string
  cantidad: number
}

/** Curso principal de una practica: el del primer tema que cubre. */
function cursoDe(examen: ExamenResumen): CursoDePracticas | null {
  const tema = examen.temasCubiertos[0]
  return tema ? { cursoId: tema.cursoId, cursoNombre: tema.cursoNombre, cantidad: 0 } : null
}

const porNombre = (a: ExamenResumen, b: ExamenResumen) => a.nombre.localeCompare(b.nombre)

export default function AsignaturasExamenesPage() {
  const { universidadId } = useParams<{ universidadId: string }>()
  const navigate = useNavigate()
  const { usuario, actualizarUsuario } = useAuth()

  const [universidades, setUniversidades] = useState<UniversidadResumen[]>([])
  const [universidad, setUniversidad] = useState<UniversidadResumen | null>(null)
  const [examenes, setExamenes] = useState<ExamenResumen[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorInicio, setErrorInicio] = useState<{ examenId: string; mensaje: string } | null>(null)
  /** null = todas las practicas. */
  const [cursoFiltroId, setCursoFiltroId] = useState<string | null>(null)
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
    setCursoFiltroId(null)
    setErrorInicio(null)
    Promise.all([listarUniversidades(), listarExamenesPorUniversidad(universidadId)])
      .then(([todas, examenesUniversidad]) => {
        setUniversidades(todas)
        setUniversidad(todas.find((u) => u.id === universidadId) ?? null)
        setExamenes(examenesUniversidad)
      })
      .catch(() => setError('No se pudo cargar la informacion de esta universidad.'))
  }, [universidadId])

  const simulacros = useMemo(() => (examenes ?? []).filter((e) => e.tipo === 'SIMULACRO_COMPLETO').sort(porNombre), [examenes])
  const practicas = useMemo(() => (examenes ?? []).filter((e) => e.tipo === 'PRACTICA_TEMA').sort(porNombre), [examenes])

  // Filtros por curso: solo tienen sentido si las practicas son de mas de un curso (caso admision).
  const cursosDePracticas = useMemo(() => {
    const mapa = new Map<string, CursoDePracticas>()
    for (const practica of practicas) {
      const curso = cursoDe(practica)
      if (!curso) continue
      const existente = mapa.get(curso.cursoId) ?? { ...curso }
      existente.cantidad += 1
      mapa.set(curso.cursoId, existente)
    }
    return Array.from(mapa.values()).sort((a, b) => a.cursoNombre.localeCompare(b.cursoNombre))
  }, [practicas])
  const practicasVisibles = cursoFiltroId === null ? practicas : practicas.filter((p) => cursoDe(p)?.cursoId === cursoFiltroId)

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

  function bloqueoDe(examen: ExamenResumen): MotivoBloqueo {
    if (bloqueadoPorPrograma) return 'programa'
    if (bloqueadoPorPlan) return 'plan'
    return examen.disponible ? null : 'sin-preguntas'
  }

  function tarjeta(examen: ExamenResumen, variante: 'simulacro' | 'practica') {
    return (
      <TarjetaExamen
        key={examen.id}
        examen={examen}
        variante={variante}
        bloqueo={bloqueoDe(examen)}
        iniciando={iniciandoId === examen.id}
        error={errorInicio?.examenId === examen.id ? errorInicio.mensaje : null}
        onIniciar={() => handleIniciar(examen)}
      />
    )
  }

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
                    {examenes.length > 0 && <p className="mt-1 text-sm text-slate-700">{resumenPorTipo(examenes)}</p>}
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

            {examenes.length === 0 ? (
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
              <div className="flex flex-col gap-10">
                {simulacros.length > 0 && (
                  <section aria-labelledby="titulo-simulacros">
                    <div className="mb-4">
                      <h2 id="titulo-simulacros" className="font-display text-lg font-bold text-slate-900">
                        Simulacros completos
                      </h2>
                      <p className="text-sm text-slate-600">Mezclan todos los temas, como el examen real.</p>
                    </div>
                    <div className="flex flex-col gap-4">{simulacros.map((e) => tarjeta(e, 'simulacro'))}</div>
                  </section>
                )}

                {practicas.length > 0 && (
                  <section aria-labelledby="titulo-practicas">
                    <div className="mb-4">
                      <h2 id="titulo-practicas" className="font-display text-lg font-bold text-slate-900">
                        Prácticas por tema
                      </h2>
                      <p className="text-sm text-slate-600">Practica un tema concreto antes de rendir el simulacro.</p>
                    </div>

                    {cursosDePracticas.length > 1 && (
                      <nav aria-label="Filtrar prácticas por curso" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
                        {[{ cursoId: null, cursoNombre: 'Todos', cantidad: practicas.length }, ...cursosDePracticas].map((c) => {
                          const activo = c.cursoId === cursoFiltroId
                          return (
                            <button
                              key={c.cursoId ?? 'todos'}
                              type="button"
                              aria-pressed={activo}
                              onClick={() => setCursoFiltroId(c.cursoId)}
                              className={`inline-flex shrink-0 items-center gap-2 rounded-full border py-2 pr-2.5 pl-3.5 text-sm font-semibold transition ${
                                activo
                                  ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary-600 hover:text-primary-600'
                              }`}
                            >
                              {c.cursoId !== null && (
                                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                                  {ICONOS_POR_CURSO[c.cursoNombre] ?? ICONO_POR_DEFECTO}
                                </span>
                              )}
                              {c.cursoNombre}
                              <span
                                className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${
                                  activo ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-700'
                                }`}
                              >
                                {c.cantidad}
                              </span>
                            </button>
                          )
                        })}
                      </nav>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{practicasVisibles.map((e) => tarjeta(e, 'practica'))}</div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
