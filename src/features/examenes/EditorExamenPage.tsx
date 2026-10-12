import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { listarCursos, type CursoConTemas } from '../../api/cursosApi'
import {
  actualizarExamen,
  componerExamenAreas,
  componerExamenFijo,
  crearExamen,
  obtenerExamen,
  publicarExamen,
  type DificultadObjetivo,
  type ExamenAreaItem,
  type ExamenPreguntaItem,
  type ExamenRequest,
  type ExamenResumen,
  type NavegacionExamen,
  type TipoExamen,
  type TipoSeleccion,
} from '../../api/examenesApi'
import { listarPreguntas, obtenerPregunta, type Dificultad, type Pregunta } from '../../api/preguntasApi'
import { listarUniversidades, type UniversidadResumen } from '../../api/universidadesApi'
import InfoTooltip from '../../components/InfoTooltip'
import { Alert, Badge, Button, Card, cn, EmptyState, Field, Icon, Input, SegmentedControl, Select, Textarea } from '../../components/ui'
import { formatearDuracion } from '../../lib/formato'
import { textoPlanoDe } from '../../lib/html'
import { moverElemento, repartirEquitativamente } from './composicion'
import { useGestionExamenes } from './gestion'
import { ETIQUETA_TIPO } from './resumenExamenes'

/** Crear/editar/publicar un examen a pantalla completa, en 3 pasos (datos -> composicion ->
 * publicar). Ruta /admin/examenes/:examenId (o /docente/...); "nuevo" para crear. */

const DIFICULTAD_INFO: Record<Dificultad, { punto: string; label: string }> = {
  BAJA: { punto: 'bg-emerald-500', label: 'Baja' },
  MEDIA: { punto: 'bg-amber-500', label: 'Media' },
  ALTA: { punto: 'bg-rose-500', label: 'Alta' },
}

function EtiquetaDificultad({ dificultad }: { dificultad: Dificultad }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-600">
      <span className={cn('h-2 w-2 rounded-full', DIFICULTAD_INFO[dificultad].punto)} />
      {DIFICULTAD_INFO[dificultad].label}
    </span>
  )
}

interface InfoPregunta {
  texto: string
  dificultad: Dificultad
  tipoPregunta: Pregunta['tipoPregunta']
}

function infoDe(pregunta: Pregunta): InfoPregunta {
  return { texto: textoPlanoDe(pregunta.enunciadoHtml, 140), dificultad: pregunta.dificultad, tipoPregunta: pregunta.tipoPregunta }
}

const MAX_DESCRIPCION = 300

const TIPOS_EXAMEN: { valor: TipoExamen; ayuda: string }[] = [
  { valor: 'PRACTICA_TEMA', ayuda: 'Para practicar un tema concreto.' },
  { valor: 'SIMULACRO_COMPLETO', ayuda: 'Mezcla todos los temas, como el examen real.' },
]

interface FormularioBasico {
  universidadId: string
  nombre: string
  duracionMinutos: string
  puntajeTotal: string
  tipoSeleccion: TipoSeleccion
  navegacion: NavegacionExamen
  permitePausa: boolean
  tipo: TipoExamen
  descripcion: string
}

const FORMULARIO_VACIO: FormularioBasico = {
  universidadId: '',
  nombre: '',
  duracionMinutos: '60',
  puntajeTotal: '100',
  tipoSeleccion: 'FIJA',
  navegacion: 'LIBRE',
  permitePausa: false,
  tipo: 'SIMULACRO_COMPLETO',
  descripcion: '',
}

function formularioDesde(examen: ExamenResumen): FormularioBasico {
  return {
    universidadId: examen.universidadId,
    nombre: examen.nombre,
    duracionMinutos: String(Math.round(examen.duracionSeg / 60)),
    puntajeTotal: String(examen.puntajeTotal),
    tipoSeleccion: examen.tipoSeleccion,
    navegacion: examen.navegacion,
    permitePausa: examen.permitePausa,
    tipo: examen.tipo,
    descripcion: examen.descripcion ?? '',
  }
}

function mismoFormulario(a: FormularioBasico, b: FormularioBasico): boolean {
  return (Object.keys(a) as (keyof FormularioBasico)[]).every((k) => a[k] === b[k])
}

type Paso = 1 | 2 | 3
type EstadoPaso = 'listo' | 'actual' | 'pendiente' | 'bloqueado'

const PASOS: { numero: Paso; titulo: string; descripcion: string }[] = [
  { numero: 1, titulo: 'Datos básicos', descripcion: 'Universidad, duración y reglas' },
  { numero: 2, titulo: 'Composición', descripcion: 'Preguntas o áreas y puntajes' },
  { numero: 3, titulo: 'Publicar', descripcion: 'Revisión final' },
]

function Stepper({ paso, estados, onCambiar }: { paso: Paso; estados: Record<Paso, EstadoPaso>; onCambiar: (p: Paso) => void }) {
  return (
    <Card className="p-2">
      <ol className="grid grid-cols-1 gap-1 sm:grid-cols-3">
        {PASOS.map((p) => {
          const estado = estados[p.numero]
          const activo = paso === p.numero
          return (
            <li key={p.numero}>
              <button
                type="button"
                disabled={estado === 'bloqueado'}
                onClick={() => onCambiar(p.numero)}
                aria-current={activo ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  'focus-visible:outline-2 focus-visible:outline-primary-600',
                  activo ? 'bg-primary-50' : 'hover:bg-slate-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    estado === 'listo' ? 'bg-emerald-500 text-white' : activo ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {estado === 'listo' ? <Icon name="check" size={18} /> : p.numero}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-sm font-semibold', activo ? 'text-primary-700' : 'text-slate-900')}>{p.titulo}</span>
                  <span className="block truncate text-xs text-slate-500">{p.descripcion}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

/** Etiqueta con InfoTooltip, solo para los 2 conceptos que no se entienden con un texto corto. */
function EtiquetaConInfo({ texto, info }: { texto: string; info: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
      {texto}
      <InfoTooltip etiqueta={texto} alineacion="start">
        {info}
      </InfoTooltip>
    </span>
  )
}

function SeccionCard({ titulo, descripcion, acciones, children, className }: { titulo: string; descripcion?: string; acciones?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-slate-900">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>}
        </div>
        {acciones}
      </div>
      {children}
    </Card>
  )
}

/** Barra de puntaje asignado vs. total: para publicar, la suma debe ser exacta. */
function ResumenPuntaje({ asignado, total, puedeRepartir, onRepartir }: { asignado: number; total: number; puedeRepartir: boolean; onRepartir: () => void }) {
  const diferencia = total - asignado
  const cuadra = diferencia === 0
  const porcentaje = total > 0 ? Math.min(100, (asignado / total) * 100) : 0
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-700">
          <span className="font-display text-xl font-bold text-slate-900">{asignado}</span> / {total} pts
        </span>
        <span className={cn('text-xs font-semibold', cuadra ? 'text-emerald-600' : diferencia > 0 ? 'text-amber-600' : 'text-rose-600')}>
          {cuadra ? 'Cuadra con el total' : diferencia > 0 ? `Faltan ${diferencia} pts` : `Sobran ${-diferencia} pts`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full transition-all', cuadra ? 'bg-emerald-500' : diferencia < 0 ? 'bg-rose-500' : 'bg-amber-500')}
          style={{ width: `${diferencia < 0 ? 100 : porcentaje}%` }}
        />
      </div>
      {puedeRepartir && !cuadra && (
        <Button variant="secondary" size="sm" icon="balance" className="self-start" onClick={onRepartir}>
          Repartir {total} pts en partes iguales
        </Button>
      )}
    </div>
  )
}

function Requisito({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={cn('flex items-center gap-2 text-sm', ok ? 'text-emerald-700' : 'text-slate-500')}>
      <Icon name={ok ? 'check_circle' : 'radio_button_unchecked'} size={18} />
      {children}
    </li>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-slate-500">{etiqueta}</dt>
      <dd className="text-sm font-semibold text-slate-900">{children}</dd>
    </div>
  )
}

export default function EditorExamenPage() {
  const { examenId } = useParams()
  const esNuevo = !examenId || examenId === 'nuevo'
  const navigate = useNavigate()
  const { base, rutaEditor, contenedor } = useGestionExamenes()

  const [universidades, setUniversidades] = useState<UniversidadResumen[] | null>(null)
  const [cursos, setCursos] = useState<CursoConTemas[] | null>(null)

  const [examen, setExamen] = useState<ExamenResumen | null>(null)
  const [cargando, setCargando] = useState(!esNuevo)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [paso, setPaso] = useState<Paso>(1)

  const [formulario, setFormulario] = useState<FormularioBasico>(FORMULARIO_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [composicionSucia, setComposicionSucia] = useState(false)
  const [confirmandoPublicar, setConfirmandoPublicar] = useState(false)

  // Composicion FIJA
  const [temaBusqueda, setTemaBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Pregunta[] | null>(null)
  const [preguntasElegidas, setPreguntasElegidas] = useState<ExamenPreguntaItem[]>([])
  const [infoPreguntas, setInfoPreguntas] = useState<Record<string, InfoPregunta>>({})

  // Composicion ALEATORIA_POR_AREA
  const [areas, setAreas] = useState<ExamenAreaItem[]>([])

  useEffect(() => {
    listarUniversidades().then(setUniversidades).catch(() => {})
    listarCursos().then(setCursos).catch(() => {})
  }, [])

  /** Trae el enunciado de las preguntas elegidas que aun no conocemos, para que la lista no sea solo "#1, #2...". */
  function completarInfoPreguntas(ids: string[]) {
    if (ids.length === 0) return
    Promise.allSettled(ids.map((id) => obtenerPregunta(id))).then((resultados) => {
      const nuevas: Record<string, InfoPregunta> = {}
      resultados.forEach((r) => {
        if (r.status === 'fulfilled') nuevas[r.value.id] = infoDe(r.value)
      })
      setInfoPreguntas((prev) => ({ ...prev, ...nuevas }))
    })
  }

  function aplicarExamen(completo: ExamenResumen) {
    setExamen(completo)
    setFormulario(formularioDesde(completo))
    setPreguntasElegidas(completo.preguntas.map((p) => ({ preguntaId: p.preguntaId, orden: p.orden, puntajeAsignado: p.puntajeAsignado })))
    setAreas(
      completo.areas.map((a) => ({
        cursoId: a.cursoId,
        temaId: a.temaId,
        cantidadPreguntas: a.cantidadPreguntas,
        dificultadObjetivo: a.dificultadObjetivo,
        puntajeAsignado: a.puntajeAsignado,
      })),
    )
    setComposicionSucia(false)
  }

  useEffect(() => {
    if (esNuevo) return
    obtenerExamen(examenId)
      .then((completo) => {
        aplicarExamen(completo)
        completarInfoPreguntas(completo.preguntas.map((p) => p.preguntaId))
      })
      .catch(() => setErrorCarga('No se pudo cargar el examen.'))
      .finally(() => setCargando(false))
    // Solo al abrir: tras crear, la navegacion a /:id reutiliza este componente ya cargado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const basicoSucio = examen !== null && !mismoFormulario(formulario, formularioDesde(examen))

  function limpiarMensajes() {
    setError(null)
    setMensajeExito(null)
  }

  function construirRequest(): ExamenRequest | null {
    if (!formulario.universidadId || !formulario.nombre.trim()) {
      setError('Universidad y nombre son obligatorios.')
      return null
    }
    if (Number(formulario.duracionMinutos) <= 0 || Number(formulario.puntajeTotal) <= 0) {
      setError('La duración y el puntaje total deben ser mayores a 0.')
      return null
    }
    return {
      universidadId: formulario.universidadId,
      nombre: formulario.nombre.trim(),
      duracionSeg: Number(formulario.duracionMinutos) * 60,
      puntajeTotal: Number(formulario.puntajeTotal),
      tipoSeleccion: formulario.tipoSeleccion,
      navegacion: formulario.navegacion,
      permitePausa: formulario.permitePausa,
      tipo: formulario.tipo,
      descripcion: formulario.descripcion.trim() || null,
    }
  }

  async function handleGuardarBasico() {
    limpiarMensajes()
    const request = construirRequest()
    if (!request) return
    setGuardando(true)
    try {
      if (examen) {
        const actualizado = await actualizarExamen(examen.id, request)
        setExamen(actualizado)
        setFormulario(formularioDesde(actualizado))
        setMensajeExito('Datos básicos guardados.')
      } else {
        const creado = await crearExamen(request)
        aplicarExamen(creado)
        navigate(rutaEditor(creado.id), { replace: true })
        setPaso(2)
        setMensajeExito('Examen creado. Ahora arma su composición.')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el examen.')
    } finally {
      setGuardando(false)
    }
  }

  async function buscarPreguntas(temaId: string) {
    setTemaBusqueda(temaId)
    if (!temaId) {
      setResultadosBusqueda(null)
      return
    }
    try {
      const r = await listarPreguntas({ temaId, estado: 'PUBLICADA', page: 1, limit: 50 })
      setResultadosBusqueda(r.data)
      setInfoPreguntas((prev) => ({ ...prev, ...Object.fromEntries(r.data.map((p) => [p.id, infoDe(p)])) }))
    } catch {
      setResultadosBusqueda([])
    }
  }

  function cambiarPreguntas(actualizar: (prev: ExamenPreguntaItem[]) => ExamenPreguntaItem[]) {
    setPreguntasElegidas((prev) => actualizar(prev).map((p, i) => ({ ...p, orden: i + 1 })))
    setComposicionSucia(true)
    setConfirmandoPublicar(false)
  }

  function cambiarAreas(actualizar: (prev: ExamenAreaItem[]) => ExamenAreaItem[]) {
    setAreas(actualizar)
    setComposicionSucia(true)
    setConfirmandoPublicar(false)
  }

  function agregarPregunta(pregunta: Pregunta) {
    if (preguntasElegidas.some((p) => p.preguntaId === pregunta.id)) return
    setInfoPreguntas((prev) => ({ ...prev, [pregunta.id]: infoDe(pregunta) }))
    cambiarPreguntas((prev) => [...prev, { preguntaId: pregunta.id, orden: prev.length + 1, puntajeAsignado: 0 }])
  }

  function agregarArea() {
    if (!cursos || cursos.length === 0) return
    cambiarAreas((prev) => [...prev, { cursoId: cursos[0].id, temaId: null, cantidadPreguntas: 5, dificultadObjetivo: 'MEDIA', puntajeAsignado: 0 }])
  }

  function actualizarArea(indice: number, cambios: Partial<ExamenAreaItem>) {
    cambiarAreas((prev) => prev.map((a, i) => (i === indice ? { ...a, ...cambios } : a)))
  }

  const esFija = formulario.tipoSeleccion === 'FIJA'
  const tieneDesarrollo = preguntasElegidas.some((p) => infoPreguntas[p.preguntaId]?.tipoPregunta === 'DESARROLLO')
  const puntajeTotal = Number(formulario.puntajeTotal)
  const cantidadItems = esFija ? preguntasElegidas.length : areas.length
  const puntajeAsignado = esFija ? preguntasElegidas.reduce((acc, p) => acc + p.puntajeAsignado, 0) : areas.reduce((acc, a) => acc + a.puntajeAsignado, 0)
  const puntajeCuadra = puntajeTotal - puntajeAsignado === 0
  const puedePublicar = cantidadItems > 0 && puntajeCuadra
  const publicado = examen?.estado === 'PUBLICADO'

  function repartirPuntaje() {
    const reparto = repartirEquitativamente(puntajeTotal, cantidadItems)
    if (esFija) cambiarPreguntas((prev) => prev.map((p, i) => ({ ...p, puntajeAsignado: reparto[i] })))
    else cambiarAreas((prev) => prev.map((a, i) => ({ ...a, puntajeAsignado: reparto[i] })))
  }

  async function guardarComposicion(id: string): Promise<ExamenResumen> {
    const actualizado = esFija ? await componerExamenFijo(id, preguntasElegidas) : await componerExamenAreas(id, areas)
    setComposicionSucia(false)
    return actualizado
  }

  async function handleGuardarComposicion() {
    if (!examen) return
    limpiarMensajes()
    setGuardando(true)
    try {
      setExamen(await guardarComposicion(examen.id))
      setMensajeExito('Composición guardada.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la composición.')
    } finally {
      setGuardando(false)
    }
  }

  /** El backend valida lo guardado, no lo que se ve en pantalla: se guardan primero los cambios pendientes. */
  async function handlePublicar() {
    if (!examen) return
    limpiarMensajes()
    setGuardando(true)
    try {
      if (basicoSucio) {
        const request = construirRequest()
        if (!request) return
        await actualizarExamen(examen.id, request)
      }
      if (composicionSucia) await guardarComposicion(examen.id)
      const resultado = await publicarExamen(examen.id)
      setExamen(resultado)
      setFormulario(formularioDesde(resultado))
      setMensajeExito('¡Examen publicado! Los estudiantes ya pueden rendirlo.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo publicar el examen.')
    } finally {
      setGuardando(false)
      setConfirmandoPublicar(false)
    }
  }

  const estados: Record<Paso, EstadoPaso> = {
    1: examen && !basicoSucio ? 'listo' : 'actual',
    2: !examen ? 'bloqueado' : puedePublicar && !composicionSucia ? 'listo' : 'pendiente',
    3: !examen ? 'bloqueado' : publicado ? 'listo' : 'pendiente',
  }

  function irAPaso(p: Paso) {
    limpiarMensajes()
    setConfirmandoPublicar(false)
    setPaso(p)
  }

  const universidadNombre = universidades?.find((u) => u.id === formulario.universidadId)?.nombre ?? examen?.universidadNombre
  const haySinGuardar = basicoSucio || composicionSucia

  if (cargando) {
    return (
      <div className={contenedor}>
        <EmptyState icon="hourglass_empty" title="Cargando examen..." />
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className={contenedor}>
        <Alert>{errorCarga}</Alert>
        <Link to={base} className="text-sm font-semibold text-primary-600 hover:underline">
          Volver a exámenes
        </Link>
      </div>
    )
  }

  return (
    <div className={contenedor}>
      <div className="flex flex-col gap-4">
        <Link to={base} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-slate-500 transition-colors hover:text-primary-600">
          <Icon name="arrow_back" size={18} />
          Exámenes
        </Link>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-slate-900">{examen?.nombre || 'Nuevo examen'}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {examen ? <Badge tone={publicado ? 'success' : 'neutral'}>{publicado ? 'Publicado' : 'Borrador'}</Badge> : <Badge tone="primary">Sin crear</Badge>}
              {universidadNombre && <span>{universidadNombre}</span>}
              {examen && <span>· {esFija ? 'Fijo' : 'Aleatorio por área'}</span>}
            </div>
          </div>
          {haySinGuardar && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Cambios sin guardar
            </span>
          )}
        </header>
      </div>

      <Stepper paso={paso} estados={estados} onCambiar={irAPaso} />

      {publicado && paso !== 3 && (
        <Alert tone="warning">Este examen ya está publicado y los estudiantes pueden rendirlo. Los cambios que guardes les afectarán directamente.</Alert>
      )}
      {error && <Alert>{error}</Alert>}
      {mensajeExito && <Alert tone="success">{mensajeExito}</Alert>}

      {paso === 1 && (
        <SeccionCard titulo="Datos básicos" descripcion="El programa y el tipo de selección no se pueden cambiar después de crear el examen.">
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <Field label="Universidad o programa" hint="Solo podrás usar preguntas generales o etiquetadas para este programa.">
              <Select value={formulario.universidadId} onChange={(e) => setFormulario({ ...formulario, universidadId: e.target.value })} disabled={!!examen}>
                <option value="">Selecciona...</option>
                {universidades?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Nombre">
              <Input placeholder="Ej. Simulacro UNMSM - Área A" value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} />
            </Field>

            <div className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Tipo de examen</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TIPOS_EXAMEN.map((t) => {
                  const elegido = formulario.tipo === t.valor
                  return (
                    <button
                      key={t.valor}
                      type="button"
                      aria-pressed={elegido}
                      onClick={() => setFormulario({ ...formulario, tipo: t.valor })}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
                        elegido ? 'border-primary-600 bg-primary-50/70 ring-1 ring-primary-600' : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', elegido ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500')}>
                        <Icon name={ETIQUETA_TIPO[t.valor].icono} size={20} />
                      </span>
                      <span>
                        <span className={cn('block text-sm font-semibold', elegido ? 'text-primary-700' : 'text-slate-900')}>{ETIQUETA_TIPO[t.valor].texto}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{t.ayuda}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Field label="Descripción (opcional)" hint="Cuéntale al alumno qué va a practicar." className="md:col-span-2">
              <Textarea
                rows={2}
                maxLength={MAX_DESCRIPCION}
                placeholder="Ej. Practica am/is/are en oraciones afirmativas, negativas y preguntas."
                value={formulario.descripcion}
                onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
              />
              <span className="self-end text-xs text-slate-500">
                {formulario.descripcion.length} / {MAX_DESCRIPCION}
              </span>
            </Field>

            <Field label="Duración (minutos)" hint="Al acabarse el tiempo, el simulacro se entrega automáticamente.">
              <Input type="number" min="1" value={formulario.duracionMinutos} onChange={(e) => setFormulario({ ...formulario, duracionMinutos: e.target.value })} />
            </Field>

            <Field label="Puntaje total" hint="Para publicar, la suma de puntajes de la composición debe ser exactamente este número.">
              <Input type="number" min="1" value={formulario.puntajeTotal} onChange={(e) => setFormulario({ ...formulario, puntajeTotal: e.target.value })} />
            </Field>

            <div className="flex flex-col gap-2 md:col-span-2">
              <EtiquetaConInfo
                texto="Tipo de selección"
                info={
                  <>
                    <b>Fijo:</b> todos los estudiantes reciben las mismas preguntas que tú eliges. <b>Aleatorio por área:</b> defines cuántas preguntas
                    de cada curso/tema y el sistema sortea preguntas distintas para cada estudiante.
                  </>
                }
              />
              {/* Opciones con icono, descripcion y estado disabled: SegmentedControl no soporta las dos ultimas. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(['FIJA', 'ALEATORIA_POR_AREA'] as const).map((tipo) => {
                  const elegido = formulario.tipoSeleccion === tipo
                  const fijo = tipo === 'FIJA'
                  return (
                    <button
                      key={tipo}
                      type="button"
                      disabled={!!examen}
                      aria-pressed={elegido}
                      onClick={() => setFormulario({ ...formulario, tipoSeleccion: tipo })}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
                        elegido ? 'border-primary-600 bg-primary-50/70 ring-1 ring-primary-600' : 'border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50',
                      )}
                    >
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', elegido ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500')}>
                        <Icon name={fijo ? 'format_list_numbered' : 'autorenew'} size={20} />
                      </span>
                      <span>
                        <span className={cn('block text-sm font-semibold', elegido ? 'text-primary-700' : 'text-slate-900')}>{fijo ? 'Fijo' : 'Aleatorio por área'}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {fijo ? 'Tú eliges cada pregunta y su puntaje.' : 'Defines cursos/temas y cantidades; el sistema sortea las preguntas.'}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <EtiquetaConInfo
                texto="Navegación"
                info={
                  <>
                    <b>Libre:</b> el estudiante puede saltar entre preguntas y volver a las anteriores. <b>Secuencial:</b> avanza en orden y no puede
                    adelantarse a preguntas que aún no ha visto (sí puede volver a las anteriores).
                  </>
                }
              />
              <SegmentedControl
                options={[
                  { value: 'LIBRE', label: 'Libre', icon: 'swap_horiz' },
                  { value: 'SECUENCIAL', label: 'Secuencial', icon: 'arrow_forward' },
                ]}
                value={formulario.navegacion}
                onChange={(valor) => setFormulario({ ...formulario, navegacion: valor as NavegacionExamen })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Pausa</span>
              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
                <input
                  type="checkbox"
                  role="switch"
                  checked={formulario.permitePausa}
                  onChange={(e) => setFormulario({ ...formulario, permitePausa: e.target.checked })}
                  className="peer sr-only"
                />
                <span className="relative h-5 w-9 shrink-0 rounded-full bg-slate-200 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-primary-600 peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-primary-600" />
                <span className="text-sm text-slate-700">{formulario.permitePausa ? 'El estudiante puede pausar (el cronómetro se detiene)' : 'Sin pausa'}</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5">
            {examen && !basicoSucio ? (
              <Button icon="arrow_forward" onClick={() => irAPaso(2)}>
                Siguiente: composición
              </Button>
            ) : (
              <Button onClick={handleGuardarBasico} loading={guardando}>
                {examen ? 'Guardar cambios' : 'Crear y continuar'}
              </Button>
            )}
          </div>
        </SeccionCard>
      )}

      {paso === 2 && examen && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Por areas no se sabe de antemano que tocara: el aviso va siempre. En fijo, solo si eligio alguna. */}
          {(!esFija || tieneDesarrollo) && (
            <Alert tone="info" className="lg:col-span-12">
              Las preguntas de desarrollo las calificas tú, así que solo se toman cuando <strong>asignas este examen a un grupo</strong>. Si
              un alumno lo rinde por su cuenta, esas preguntas se omiten.
            </Alert>
          )}
          {esFija ? (
            <SeccionCard titulo="Banco de preguntas" descripcion="Solo aparecen las preguntas publicadas. Pulsa una para agregarla." className="lg:col-span-7">
              <div className="flex flex-col gap-3 p-5">
                <Select aria-label="Tema" value={temaBusqueda} onChange={(e) => buscarPreguntas(e.target.value)}>
                  <option value="">Elige un tema para ver sus preguntas...</option>
                  {cursos?.map((c) => (
                    <optgroup key={c.id} label={c.nombre}>
                      {c.temas.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>

                {resultadosBusqueda === null && <EmptyState icon="search" title="Elige un tema para empezar." />}
                {resultadosBusqueda?.length === 0 && <EmptyState icon="search_off" title="Sin preguntas publicadas en este tema." />}
                {resultadosBusqueda && resultadosBusqueda.length > 0 && (
                  <ul className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
                    {resultadosBusqueda.map((p) => {
                      const yaAgregada = preguntasElegidas.some((e) => e.preguntaId === p.id)
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => agregarPregunta(p)}
                            disabled={yaAgregada}
                            className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/40 focus-visible:outline-2 focus-visible:outline-primary-600 disabled:border-emerald-200 disabled:bg-emerald-50/40"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 text-sm text-slate-700">{textoPlanoDe(p.enunciadoHtml, 160)}</span>
                              <span className="mt-1 block">
                                <EtiquetaDificultad dificultad={p.dificultad} />
                              </span>
                            </span>
                            <span
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                                yaAgregada ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-50 text-primary-600',
                              )}
                            >
                              <Icon name={yaAgregada ? 'check' : 'add'} size={18} />
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </SeccionCard>
          ) : (
            <SeccionCard
              titulo="Áreas"
              descripcion="Cada área sortea preguntas de un curso (o de un tema) para cada estudiante."
              className="lg:col-span-8"
              acciones={
                <Button variant="secondary" size="sm" icon="add" onClick={agregarArea}>
                  Agregar área
                </Button>
              }
            >
              <div className="flex flex-col gap-3 p-5">
                {areas.length === 0 && <EmptyState icon="grid_view" title='Aún no hay áreas. Usa "Agregar área" para indicar de qué curso salen las preguntas.' />}
                {areas.map((area, i) => (
                  <div key={i} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Área {i + 1}</span>
                      <Button variant="danger" size="icon" icon="delete" aria-label={`Quitar área ${i + 1}`} onClick={() => cambiarAreas((prev) => prev.filter((_, j) => j !== i))} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Curso">
                        <Select value={area.cursoId} onChange={(e) => actualizarArea(i, { cursoId: e.target.value, temaId: null })}>
                          {cursos?.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Tema">
                        <Select value={area.temaId ?? ''} onChange={(e) => actualizarArea(i, { temaId: e.target.value || null })}>
                          <option value="">Todos los temas del curso</option>
                          {cursos
                            ?.find((c) => c.id === area.cursoId)
                            ?.temas.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.nombre}
                              </option>
                            ))}
                        </Select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Preguntas">
                        <Input type="number" min="1" value={area.cantidadPreguntas} onChange={(e) => actualizarArea(i, { cantidadPreguntas: Number(e.target.value) })} />
                      </Field>
                      <Field label="Dificultad" hint={area.dificultadObjetivo === 'MIXTA' ? 'Sin filtro de dificultad' : undefined}>
                        <Select value={area.dificultadObjetivo} onChange={(e) => actualizarArea(i, { dificultadObjetivo: e.target.value as DificultadObjetivo })}>
                          <option value="BAJA">Baja</option>
                          <option value="MEDIA">Media</option>
                          <option value="ALTA">Alta</option>
                          <option value="MIXTA">Mixta</option>
                        </Select>
                      </Field>
                      <Field label="Puntaje del área">
                        <Input type="number" min="0" value={area.puntajeAsignado} onChange={(e) => actualizarArea(i, { puntajeAsignado: Number(e.target.value) })} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </SeccionCard>
          )}

          {/* Resumen fijo a la vista mientras se recorre el banco o las areas. */}
          <div className={cn('flex flex-col gap-6 lg:sticky lg:top-[92px]', esFija ? 'lg:col-span-5' : 'lg:col-span-4')}>
            <SeccionCard titulo={esFija ? `Preguntas del examen (${preguntasElegidas.length})` : 'Puntaje'}>
              <div className="flex flex-col gap-4 p-5">
                <ResumenPuntaje asignado={puntajeAsignado} total={puntajeTotal} puedeRepartir={cantidadItems > 0} onRepartir={repartirPuntaje} />

                {esFija &&
                  (preguntasElegidas.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-500">
                      Aún no agregas preguntas. Elige un tema en el banco y pulsa las que quieras incluir.
                    </p>
                  ) : (
                    <ol className="flex max-h-[min(420px,calc(100vh-420px))] min-h-40 flex-col gap-2 overflow-y-auto pr-1">
                      {preguntasElegidas.map((p, i) => {
                        const info = infoPreguntas[p.preguntaId]
                        return (
                          <li key={p.preguntaId} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                            <div className="flex items-start gap-2">
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-primary-50 px-1 text-xs font-bold text-primary-600">{i + 1}</span>
                              <span className="line-clamp-2 flex-1 text-xs text-slate-700">{info?.texto ?? 'Cargando enunciado...'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {info && <EtiquetaDificultad dificultad={info.dificultad} />}
                              <div className="ml-auto flex items-center gap-1.5">
                                {/* Ancho en un div: cn no resuelve conflictos y el w-full del Input ganaria. */}
                                <div className="w-16">
                                  <Input
                                    type="number"
                                    min="0"
                                    className="text-center"
                                    aria-label={`Puntaje de la pregunta ${i + 1}`}
                                    value={p.puntajeAsignado}
                                    onChange={(e) =>
                                      cambiarPreguntas((prev) => prev.map((x) => (x.preguntaId === p.preguntaId ? { ...x, puntajeAsignado: Number(e.target.value) } : x)))
                                    }
                                  />
                                </div>
                                <span className="text-xs text-slate-500">pts</span>
                              </div>
                              <div className="flex items-center">
                                <Button variant="ghost" size="icon" icon="arrow_upward" aria-label={`Subir pregunta ${i + 1}`} disabled={i === 0} onClick={() => cambiarPreguntas((prev) => moverElemento(prev, i, -1))} />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  icon="arrow_downward"
                                  aria-label={`Bajar pregunta ${i + 1}`}
                                  disabled={i === preguntasElegidas.length - 1}
                                  onClick={() => cambiarPreguntas((prev) => moverElemento(prev, i, 1))}
                                />
                                <Button
                                  variant="danger"
                                  size="icon"
                                  icon="close"
                                  aria-label={`Quitar pregunta ${i + 1}`}
                                  onClick={() => cambiarPreguntas((prev) => prev.filter((x) => x.preguntaId !== p.preguntaId))}
                                />
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  ))}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5">
                <Button variant="secondary" onClick={handleGuardarComposicion} loading={guardando} disabled={!composicionSucia}>
                  {composicionSucia ? 'Guardar composición' : 'Guardada'}
                </Button>
                <Button icon="arrow_forward" disabled={composicionSucia} onClick={() => irAPaso(3)}>
                  Siguiente
                </Button>
              </div>
            </SeccionCard>
          </div>
        </div>
      )}

      {paso === 3 && examen && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <SeccionCard titulo="Resumen" className="lg:col-span-7">
            <dl className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
              <Dato etiqueta="Programa">{universidadNombre}</Dato>
              <Dato etiqueta="Duración">{formatearDuracion(Number(formulario.duracionMinutos) * 60)}</Dato>
              <Dato etiqueta="Puntaje total">{puntajeTotal} pts</Dato>
              <Dato etiqueta="Tipo de examen">{ETIQUETA_TIPO[formulario.tipo].texto}</Dato>
              <Dato etiqueta="Selección">{esFija ? 'Fija' : 'Aleatoria por área'}</Dato>
              <Dato etiqueta="Composición">{esFija ? `${preguntasElegidas.length} preguntas` : `${areas.length} áreas`}</Dato>
              <Dato etiqueta="Navegación">
                {formulario.navegacion === 'LIBRE' ? 'Libre' : 'Secuencial'} · {formulario.permitePausa ? 'con pausa' : 'sin pausa'}
              </Dato>
            </dl>
          </SeccionCard>

          <SeccionCard titulo="Publicación" className="lg:col-span-5">
            <div className="flex flex-col gap-4 p-5">
              {publicado ? (
                <>
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Icon name="public" size={20} />
                    Publicado: visible para los estudiantes.
                  </p>
                  {!examen.disponible && (
                    <Alert tone="warning">Hoy no se puede rendir: alguna de sus áreas no tiene suficientes preguntas publicadas en el banco.</Alert>
                  )}
                </>
              ) : (
                <>
                  <ul className="flex flex-col gap-2">
                    <Requisito ok={cantidadItems > 0}>{esFija ? 'Al menos una pregunta agregada' : 'Al menos un área configurada'}</Requisito>
                    <Requisito ok={puntajeCuadra}>La suma de puntajes es {puntajeTotal} pts</Requisito>
                  </ul>
                  <p className="text-xs text-slate-500">Al publicar, el examen aparece para los estudiantes de la universidad. No se puede volver a borrador.</p>

                  {!confirmandoPublicar ? (
                    <Button icon="public" onClick={() => setConfirmandoPublicar(true)} disabled={guardando || !puedePublicar}>
                      Publicar examen
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3" role="alertdialog" aria-label="Confirmar publicación">
                      <p className="text-sm text-slate-700">
                        ¿Publicar <b>{formulario.nombre}</b>? Los estudiantes podrán rendirlo de inmediato.
                        {haySinGuardar && ' Tus cambios sin guardar se guardarán primero.'}
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setConfirmandoPublicar(false)}>
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={handlePublicar} loading={guardando}>
                          Sí, publicar
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </SeccionCard>
        </div>
      )}
    </div>
  )
}
