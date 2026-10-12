import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listarExamenesPublicados, type ExamenResumen } from '../../api/examenesApi'
import { listarUniversidades, type TipoPrograma, type UniversidadResumen } from '../../api/universidadesApi'
import { obtenerPerfil } from '../../api/usuariosApi'
import { useAuth } from '../../hooks/useAuth'
import { ORDEN_TIPOS_PROGRAMA, requierePlanDePago, TIPOS_PROGRAMA } from '../../lib/programas'
import StudentHeader from '../home/StudentHeader'
import Reveal from '../landing/Reveal'

interface EstiloMonograma {
  contenedor: string
  forma: string
}

const ESTILOS_POR_SIGLAS: Record<string, EstiloMonograma> = {
  UNMSM: { contenedor: 'bg-primary-600 text-white', forma: 'rounded-full' },
  UNI: { contenedor: 'bg-primary-950 text-white', forma: 'rounded-2xl' },
  PUCP: { contenedor: 'bg-slate-800 text-white', forma: 'rounded-full' },
  UPC: { contenedor: 'bg-accent-500 text-white', forma: 'rounded-2xl' },
}

const ESTILO_POR_DEFECTO: EstiloMonograma = { contenedor: 'bg-slate-600 text-white', forma: 'rounded-full' }

const ESTILOS_POR_TIPO: Record<Exclude<TipoPrograma, 'ADMISION'>, EstiloMonograma> = {
  IDIOMAS: { contenedor: 'bg-rose-500 text-white', forma: 'rounded-2xl' },
  TECNOLOGIA: { contenedor: 'bg-emerald-600 text-white', forma: 'rounded-2xl' },
}

/** Las siglas largas (ARQ-SW, CIBERSEG) no entran en el monograma con la letra normal. */
function tamanoSiglas(siglas: string): string {
  if (siglas.length <= 4) return 'text-sm'
  if (siglas.length <= 6) return 'text-[11px]'
  return 'text-[9px]'
}

function EncabezadoSeccion({ tipo, cantidad, bloqueada }: { tipo: TipoPrograma; cantidad: number; bloqueada: boolean }) {
  const info = TIPOS_PROGRAMA[tipo]
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${info.fondo}`}>
        <span className="material-symbols-outlined text-xl" aria-hidden="true">
          {info.icono}
        </span>
      </span>
      <div>
        <h2 className="font-display text-lg font-bold text-slate-900">
          {info.etiqueta} <span className="text-sm font-semibold text-slate-500">({cantidad})</span>
        </h2>
        <p className="text-xs text-slate-600">{info.descripcion}</p>
      </div>
      {bloqueada && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          Incluido en Premium
        </span>
      )}
    </div>
  )
}

export default function EligeUniversidadPage() {
  const navigate = useNavigate()
  const { usuario, actualizarUsuario } = useAuth()
  const [universidades, setUniversidades] = useState<UniversidadResumen[] | null>(null)
  const [examenes, setExamenes] = useState<ExamenResumen[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  // El usuario del store puede venir de un login viejo sin `planIncluyeProgramas`: se refresca al entrar.
  useEffect(() => {
    obtenerPerfil().then(actualizarUsuario).catch(() => {})
  }, [actualizarUsuario])

  useEffect(() => {
    Promise.all([listarUniversidades(), listarExamenesPublicados()])
      .then(([u, e]) => {
        setUniversidades(u)
        setExamenes(e)
      })
      .catch(() => setError('No se pudieron cargar las universidades disponibles.'))
  }, [])

  const conteoPorUniversidad = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const examen of examenes ?? []) {
      mapa.set(examen.universidadId, (mapa.get(examen.universidadId) ?? 0) + 1)
    }
    return mapa
  }, [examenes])

  const universidadesFiltradas = useMemo(() => {
    if (!universidades) return []
    const q = busqueda.trim().toLowerCase()
    if (!q) return universidades
    return universidades.filter((u) => u.nombre.toLowerCase().includes(q) || u.siglas.toLowerCase().includes(q))
  }, [universidades, busqueda])

  // V20: admision primero, luego idiomas y tecnologia. Solo se titulan las secciones si hay mas de una.
  const secciones = useMemo(
    () =>
      ORDEN_TIPOS_PROGRAMA.map((tipo) => ({ tipo, programas: universidadesFiltradas.filter((u) => (u.tipo ?? 'ADMISION') === tipo) })).filter(
        (s) => s.programas.length > 0,
      ),
    [universidadesFiltradas],
  )
  const incluyeProgramas = usuario?.planIncluyeProgramas === true

  const universidadObjetivoId = usuario?.universidadObjetivoId ?? null
  const cargando = universidades === null || examenes === null

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900">
      <StudentHeader />

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <Reveal className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-primary-50/70 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Elige qué quieres practicar</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Cada programa tiene su propio banco de preguntas. Elige uno para ver sus exámenes.
              </p>
            </div>

            {universidades !== null && universidades.length > 0 && (
              <div className="relative w-full md:max-w-xs">
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-lg text-slate-500">
                  search
                </span>
                <input
                  type="text"
                  aria-label="Buscar programa"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o siglas..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-500 focus:border-primary-600 focus:bg-white focus:outline-none"
                />
              </div>
            )}
          </div>
        </Reveal>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>
        )}

        {cargando && !error && <p className="py-10 text-center text-sm text-slate-700">Cargando programas...</p>}

        {!cargando && universidadesFiltradas.length === 0 && !error && (
          <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900">No encontramos ese programa</h3>
            <p className="mt-1.5 max-w-md text-sm text-slate-700">Prueba buscando por siglas, por ejemplo UNMSM, UNI o PUCP.</p>
          </div>
        )}

        {!cargando &&
          secciones.map(({ tipo, programas }) => {
            // El aviso de Premium va una sola vez en el encabezado, no repetido en cada tarjeta.
            const bloqueado = requierePlanDePago(tipo) && !incluyeProgramas
            return (
              <section key={tipo} className="mb-10">
                {secciones.length > 1 && <EncabezadoSeccion tipo={tipo} cantidad={programas.length} bloqueada={bloqueado} />}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {programas.map((u, i) => {
                    const esObjetivo = u.id === universidadObjetivoId
                    const cantidadExamenes = conteoPorUniversidad.get(u.id) ?? 0
                    const estilo = ESTILOS_POR_SIGLAS[u.siglas] ?? (tipo === 'ADMISION' ? ESTILO_POR_DEFECTO : ESTILOS_POR_TIPO[tipo])
                    return (
                      <Reveal key={u.id} delayMs={i * 50}>
                        <button
                          type="button"
                          onClick={() => navigate(`/examenes/${u.id}`)}
                          className={`group flex h-full w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary-600/40 hover:shadow-md ${
                            esObjetivo ? 'border-primary-600 ring-2 ring-primary-600/20' : 'border-slate-200'
                          }`}
                        >
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center font-display font-bold tracking-wide shadow-sm ${tamanoSiglas(u.siglas)} ${estilo.contenedor} ${estilo.forma}`}
                          >
                            {u.siglas}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 font-display text-sm leading-snug font-bold text-slate-900 sm:text-base">{u.nombre}</h3>
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                              {cantidadExamenes > 0 ? (
                                <span className="font-semibold text-slate-700">
                                  {cantidadExamenes} {cantidadExamenes === 1 ? 'examen' : 'examenes'}
                                </span>
                              ) : (
                                <span>Sin examenes aún</span>
                              )}
                              {esObjetivo && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-600">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  Tu meta
                                </span>
                              )}
                            </p>
                          </div>

                          <span
                            className={`material-symbols-outlined shrink-0 text-xl transition-transform group-hover:translate-x-1 ${
                              bloqueado ? 'text-amber-500' : 'text-primary-600'
                            }`}
                            aria-hidden="true"
                          >
                            {bloqueado ? 'lock' : 'chevron_right'}
                          </span>
                        </button>
                      </Reveal>
                    )
                  })}
                </div>
              </section>
            )
          })}

        {!cargando && (
          <Reveal className="mt-2 flex flex-col items-start gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <span className="material-symbols-outlined text-xl">history</span>
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">Puedes revisar tus simulacros anteriores</h3>
                <p className="mt-0.5 text-xs text-slate-700">Consulta tu historial completo y como evoluciono tu puntaje.</p>
              </div>
            </div>
            <Link
              to="/simulacros/historial"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-primary-600"
            >
              Ver mi historial
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </Reveal>
        )}
      </main>
    </div>
  )
}
