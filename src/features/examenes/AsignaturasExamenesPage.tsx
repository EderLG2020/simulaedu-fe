import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { claves } from '../../api/claves'
import { mensajeDeError } from '../../api/client'
import { listarExamenesPorUniversidad, type ExamenResumen } from '../../api/examenesApi'
import { iniciarSimulacro } from '../../api/simulacrosApi'
import { seleccionarUniversidadObjetivo } from '../../api/usuariosApi'
import { useAuth } from '../../hooks/useAuth'
import { usePerfilActualizado, useUniversidades } from '../../hooks/useCatalogos'
import { iconoDeCurso } from '../../lib/iconosCurso'
import { TIPOS_PROGRAMA } from '../../lib/programas'
import PaginaAlumno from '../home/PaginaAlumno'
import Reveal from '../landing/Reveal'
import { resumenPorTipo } from './resumenExamenes'
import { Alert, Icon, Input, Pagination, PanelVacio, SegmentedControl } from '../../components/ui'
import TarjetaExamen, { type MotivoBloqueo, type VistaExamenes } from './TarjetaExamen'

interface CursoDePracticas {
  cursoId: string
  cursoNombre: string
  /** Icono del curso que manda el backend (curso.icono), ya no se deduce del nombre. */
  cursoIcono: string
  cantidad: number
}

/** Curso principal de una practica: el del primer tema que cubre. */
function cursoDe(examen: ExamenResumen): CursoDePracticas | null {
  const tema = examen.temasCubiertos[0]
  return tema ? { cursoId: tema.cursoId, cursoNombre: tema.cursoNombre, cursoIcono: tema.cursoIcono, cantidad: 0 } : null
}

const porNombre = (a: ExamenResumen, b: ExamenResumen) => a.nombre.localeCompare(b.nombre)

const OPCIONES_VISTA: { value: VistaExamenes; label: string; icon: string }[] = [
  { value: 'cuadricula', label: 'Cuadrícula', icon: 'grid_view' },
  { value: 'lista', label: 'Lista', icon: 'view_agenda' },
  { value: 'compacta', label: 'Compacta', icon: 'view_list' },
]

/** La vista elegida se recuerda en este navegador (solo comodidad: si el storage falla, se usa la cuadricula). */
const CLAVE_VISTA = 'simulaedu.vistaExamenes'

function vistaGuardada(): VistaExamenes {
  try {
    const guardada = localStorage.getItem(CLAVE_VISTA)
    return OPCIONES_VISTA.some((o) => o.value === guardada) ? (guardada as VistaExamenes) : 'cuadricula'
  } catch {
    return 'cuadricula'
  }
}

/** Contenedor de las tarjetas segun la vista. La compacta es una sola caja con filas separadas por lineas. */
const CONTENEDOR_VISTA: Record<VistaExamenes, string> = {
  cuadricula: 'entrada-escalonada grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
  lista: 'entrada-escalonada flex flex-col gap-4',
  compacta: 'entrada-escalonada divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
}

/** Examenes por pagina en cada vista: filas completas de la grilla de 3, menos tarjetas anchas, mas filas compactas. */
const POR_PAGINA: Record<VistaExamenes, number> = { cuadricula: 9, lista: 5, compacta: 12 }

/** Minusculas y sin tildes: "fisica" encuentra "Física". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Busca en nombre, descripcion, cursos y temas del examen. */
function coincide(examen: ExamenResumen, termino: string): boolean {
  const texto = [
    examen.nombre,
    examen.descripcion ?? '',
    ...examen.temasCubiertos.flatMap((t) => [t.cursoNombre, t.temaNombre ?? '']),
  ].join(' ')
  return normalizar(texto).includes(termino)
}

/** Pagina actual (acotada: si la lista se achico, cae en la ultima) y los examenes de esa pagina. */
function paginar(lista: ExamenResumen[], pagina: number, porPagina: number) {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina))
  const actual = Math.min(pagina, totalPaginas)
  return { actual, totalPaginas, items: lista.slice((actual - 1) * porPagina, actual * porPagina) }
}

/**
 * Con key = universidadId, pasar a otra universidad monta una pagina nueva: busqueda, filtro de
 * curso, paginas y errores vuelven a su estado inicial sin reiniciarlos a mano.
 */
export default function AsignaturasExamenesPage() {
  const { universidadId = '' } = useParams<{ universidadId: string }>()
  return <ExamenesDeUniversidad key={universidadId} universidadId={universidadId} />
}

function ExamenesDeUniversidad({ universidadId }: { universidadId: string }) {
  const navigate = useNavigate()
  const { usuario, actualizarUsuario } = useAuth()
  usePerfilActualizado()

  const consultaUniversidades = useUniversidades()
  const consultaExamenes = useQuery({
    queryKey: claves.examenes.deUniversidad(universidadId),
    queryFn: () => listarExamenesPorUniversidad(universidadId),
  })
  const universidades = consultaUniversidades.data ?? []
  const universidad = universidades.find((u) => u.id === universidadId) ?? null
  const examenes = consultaExamenes.data ?? null
  const errorCarga = consultaUniversidades.isError || consultaExamenes.isError ? 'No se pudo cargar la informacion de esta universidad.' : null
  /** Error de "usar como mi meta". */
  const [errorMeta, setErrorMeta] = useState<string | null>(null)
  const error = errorCarga ?? errorMeta
  const [errorInicio, setErrorInicio] = useState<{ examenId: string; mensaje: string } | null>(null)
  /** null = todas las practicas. */
  const [cursoFiltroId, setCursoFiltroId] = useState<string | null>(null)
  const [iniciandoId, setIniciandoId] = useState<string | null>(null)
  const [fijandoMeta, setFijandoMeta] = useState(false)
  const [vista, setVista] = useState<VistaExamenes>(vistaGuardada)
  const [busqueda, setBusqueda] = useState('')
  const [paginaSimulacros, setPaginaSimulacros] = useState(1)
  const [paginaPracticas, setPaginaPracticas] = useState(1)
  const refSimulacros = useRef<HTMLElement>(null)
  const refPracticas = useRef<HTMLElement>(null)

  /** Cambiar busqueda, curso o vista cambia que hay en cada pagina: se vuelve a la primera. */
  function volverAPrimeraPagina() {
    setPaginaSimulacros(1)
    setPaginaPracticas(1)
  }

  function cambiarPagina(seccion: 'simulacros' | 'practicas', pagina: number) {
    if (seccion === 'simulacros') setPaginaSimulacros(pagina)
    else setPaginaPracticas(pagina)
    // Al pasar de pagina se vuelve al titulo de la seccion: si no, el alumno queda al final de la lista nueva.
    ;(seccion === 'simulacros' ? refSimulacros : refPracticas).current?.scrollIntoView({ block: 'start' })
  }

  function cambiarVista(nueva: VistaExamenes) {
    setVista(nueva)
    volverAPrimeraPagina()
    try {
      localStorage.setItem(CLAVE_VISTA, nueva)
    } catch {
      // Sin storage (modo privado, etc.): la vista solo dura mientras la pagina este abierta.
    }
  }

  const termino = normalizar(busqueda.trim())
  const buscando = termino.length > 0
  // La busqueda aplica a las dos secciones; el filtro de curso, solo a las practicas.
  const encontrados = useMemo(() => (examenes ?? []).filter((e) => coincide(e, termino)), [examenes, termino])
  const simulacros = useMemo(() => encontrados.filter((e) => e.tipo === 'SIMULACRO_COMPLETO').sort(porNombre), [encontrados])
  const practicas = useMemo(() => encontrados.filter((e) => e.tipo === 'PRACTICA_TEMA').sort(porNombre), [encontrados])

  // Filtros por curso: solo tienen sentido si las practicas son de mas de un curso (caso admision).
  // Los cursos salen de TODAS las practicas (los chips no aparecen y desaparecen al escribir);
  // el contador de cada uno, de las que coinciden con la busqueda.
  const cursosDePracticas = useMemo(() => {
    const mapa = new Map<string, CursoDePracticas>()
    for (const examen of examenes ?? []) {
      const curso = examen.tipo === 'PRACTICA_TEMA' ? cursoDe(examen) : null
      if (curso && !mapa.has(curso.cursoId)) mapa.set(curso.cursoId, curso)
    }
    for (const practica of practicas) {
      const curso = cursoDe(practica)
      if (curso) mapa.get(curso.cursoId)!.cantidad += 1
    }
    return Array.from(mapa.values()).sort((a, b) => a.cursoNombre.localeCompare(b.cursoNombre))
  }, [examenes, practicas])
  const practicasFiltradas = cursoFiltroId === null ? practicas : practicas.filter((p) => cursoDe(p)?.cursoId === cursoFiltroId)

  const porPagina = POR_PAGINA[vista]
  const paginaDeSimulacros = paginar(simulacros, paginaSimulacros, porPagina)
  const paginaDePracticas = paginar(practicasFiltradas, paginaPracticas, porPagina)

  async function handleIniciar(examen: ExamenResumen) {
    setErrorInicio(null)
    setIniciandoId(examen.id)
    try {
      // El simulacro completo se rinde como examen oficial: cuenta para el ranking y para el
      // limite mensual del plan Free (RN-01). Las practicas por tema son libres e ilimitadas.
      const modo = examen.tipo === 'SIMULACRO_COMPLETO' ? 'EXAMEN_OFICIAL' : 'PRACTICA_LIBRE'
      const simulacro = await iniciarSimulacro(examen.id, modo)
      navigate(`/simulacros/${simulacro.id}`, { state: { simulacro } })
    } catch (err) {
      // Junto a la tarjeta pulsada: un aviso arriba de la pagina pasaba desapercibido y el alumno no sabia que paso.
      setErrorInicio({ examenId: examen.id, mensaje: mensajeDeError(err, 'No se pudo iniciar el simulacro.') })
      setIniciandoId(null)
    }
  }

  async function handleUsarComoMeta() {
    setFijandoMeta(true)
    setErrorMeta(null)
    try {
      const usuarioActualizado = await seleccionarUniversidadObjetivo(universidadId)
      actualizarUsuario(usuarioActualizado)
    } catch (err) {
      setErrorMeta(mensajeDeError(err, 'No se pudo actualizar tu universidad objetivo.'))
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
        vista={vista}
        bloqueo={bloqueoDe(examen)}
        iniciando={iniciandoId === examen.id}
        error={errorInicio?.examenId === examen.id ? errorInicio.mensaje : null}
        onIniciar={() => handleIniciar(examen)}
      />
    )
  }

  return (
    <PaginaAlumno migas={[{ label: 'Programas', to: '/examenes' }, { label: universidad?.siglas ?? '...' }]}>
      {error && (
        <Alert>{error}</Alert>
      )}

      {cargando && !error && <p className="py-10 text-center text-sm text-slate-700">Cargando...</p>}

      {universidad && examenes && (
        <>
          <Reveal className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-primary-50/60 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm">
                  <Icon name={TIPOS_PROGRAMA[universidad.tipo ?? 'ADMISION'].icono} size={30} />
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-slate-700 ring-1 ring-slate-200">
                      {universidad.siglas}
                    </span>
                    {esUniversidadObjetivo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-600">
                        <Icon name="check_circle" size={13} />
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
                    <Icon name="flag" size={14} />
                    {fijandoMeta ? 'Guardando...' : 'Usar como mi meta'}
                  </button>
                )}
                <Link
                  to="/examenes"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-primary-50 hover:text-primary-600"
                >
                  <Icon name="swap_horiz" size={14} />
                  Ver otros programas
                </Link>
              </div>
            </div>
          </Reveal>

          {bloqueadoPorPlan && (
            <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Icon name="lock" size={24} className="mt-0.5 shrink-0 text-amber-600" />
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
                <Icon name="flag" size={16} />
                {fijandoMeta ? 'Guardando...' : `Usar ${universidad.siglas} como mi meta`}
              </button>
            </div>
          )}

          {bloqueadoPorPrograma && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <Icon name="lock" size={24} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">Los programas de idiomas y tecnología están incluidos en el plan Premium.</p>
                <p className="mt-0.5 text-sm text-amber-800">Puedes ver sus exámenes; para rendirlos, actualiza tu plan.</p>
              </div>
            </div>
          )}

          {fijaraMetaAlIniciar && (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <Icon name="info" size={20} className="shrink-0 text-primary-600" />
              <p>
                Con tu plan Free practicas con una universidad a la vez: al iniciar tu primer simulacro, {universidad.siglas} quedará como tu
                universidad meta.
              </p>
            </div>
          )}

          {examenes.length === 0 ? (
            <PanelVacio
              icon="hourglass_empty"
              title="Sin examenes publicados todavia"
              description={`Aun no hay simulacros disponibles para ${universidad.nombre}. Vuelve pronto o elige otro programa.`}
              action={
                <Link
                  to="/examenes"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800"
                >
                  Ver otros programas
                  <Icon name="chevron_right" size={16} />
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-10">
              <div className="-mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="search"
                    aria-label="Buscar exámenes"
                    placeholder="Buscar por nombre, curso o tema..."
                    className="h-11 rounded-xl pl-9"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value)
                      volverAPrimeraPagina()
                    }}
                  />
                </div>
                <SegmentedControl
                  options={OPCIONES_VISTA}
                  value={vista}
                  onChange={cambiarVista}
                  ariaLabel="Vista de los exámenes"
                  soloIconosEnMovil
                  className="shrink-0 flex-nowrap self-end sm:self-auto"
                />
              </div>

              {buscando && encontrados.length === 0 && (
                <PanelVacio
                  tone="neutral"
                  icon="search_off"
                  title={`Sin resultados para “${busqueda.trim()}”`}
                  description="Prueba con el nombre de un curso o un tema, por ejemplo “álgebra”."
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setBusqueda('')
                        volverAPrimeraPagina()
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:bg-primary-50 hover:text-primary-600"
                    >
                      <Icon name="close" size={16} />
                      Limpiar búsqueda
                    </button>
                  }
                />
              )}

              {simulacros.length > 0 && (
                <section ref={refSimulacros} aria-labelledby="titulo-simulacros" className="scroll-mt-24">
                  <div className="mb-4">
                    <h2 id="titulo-simulacros" className="font-display text-lg font-bold text-slate-900">
                      Simulacros completos
                    </h2>
                    <p className="text-sm text-slate-600">Mezclan todos los temas, como el examen real.</p>
                  </div>
                  <div className={CONTENEDOR_VISTA[vista]}>{paginaDeSimulacros.items.map((e) => tarjeta(e, 'simulacro'))}</div>
                  <Pagination
                    page={paginaDeSimulacros.actual}
                    totalPages={paginaDeSimulacros.totalPaginas}
                    total={simulacros.length}
                    itemLabel="simulacros"
                    onChange={(p) => cambiarPagina('simulacros', p)}
                    className="mt-4 rounded-2xl border bg-white shadow-sm"
                  />
                </section>
              )}

              {practicas.length > 0 && (
                <section ref={refPracticas} aria-labelledby="titulo-practicas" className="scroll-mt-24">
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
                            onClick={() => {
                              setCursoFiltroId(c.cursoId)
                              setPaginaPracticas(1)
                            }}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-full border py-2 pr-2.5 pl-3.5 text-sm font-semibold transition ${
                              activo
                                ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-primary-600 hover:text-primary-600'
                            }`}
                          >
                            {c.cursoId !== null && (
                              <Icon name={iconoDeCurso(c.cursoIcono)} size={18} />
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

                  {practicasFiltradas.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600">
                      Ninguna práctica de este curso coincide con tu búsqueda.
                    </p>
                  ) : (
                    <div className={CONTENEDOR_VISTA[vista]}>{paginaDePracticas.items.map((e) => tarjeta(e, 'practica'))}</div>
                  )}
                  <Pagination
                    page={paginaDePracticas.actual}
                    totalPages={paginaDePracticas.totalPaginas}
                    total={practicasFiltradas.length}
                    itemLabel="prácticas"
                    onChange={(p) => cambiarPagina('practicas', p)}
                    className="mt-4 rounded-2xl border bg-white shadow-sm"
                  />
                </section>
              )}
            </div>
          )}
        </>
      )}
    </PaginaAlumno>
  )
}
