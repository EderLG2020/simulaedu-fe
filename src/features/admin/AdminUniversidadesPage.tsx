import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  activarUniversidad,
  actualizarUniversidad,
  crearUniversidad,
  desactivarUniversidad,
  listarUniversidades,
  type UniversidadAdmin,
} from '../../api/adminUniversidadesApi'
import { ApiError } from '../../api/client'
import type { TipoPrograma } from '../../api/universidadesApi'
import { Alert, Badge, Button, Card, cn, EmptyState, Field, Icon, Input, PageHeader, SegmentedControl, Select, StatCard } from '../../components/ui'
import {
  FRACCION_PENALIZACION_DEFAULT,
  formatearFraccion,
  penalizacionDe,
  PESOS_DIFICULTAD_DEFAULT,
  type ReglasCalificacion,
} from '../../lib/reglasCalificacion'
import { ORDEN_TIPOS_PROGRAMA, TIPOS_PROGRAMA } from '../../lib/programas'

/** RF-32 + V20: programas (universidades de admision, idiomas, tecnologia) y sus reglas de calificacion. Las reglas se editan con un formulario
 * (antes era JSON crudo) y las hereda cada examen de la universidad al calificarse. */

type Filtro = 'TODAS' | 'ACTIVAS' | 'INACTIVAS'

const OPCIONES_FILTRO: { value: Filtro; label: string }[] = [
  { value: 'TODAS', label: 'Todos los estados' },
  { value: 'ACTIVAS', label: 'Activos' },
  { value: 'INACTIVAS', label: 'Inactivos' },
]

const FRACCIONES = [0.2, 0.25, 1 / 3, 0.5, 1]

type Dificultad = keyof typeof PESOS_DIFICULTAD_DEFAULT
const DIFICULTADES: { clave: Dificultad; label: string; punto: string }[] = [
  { clave: 'baja', label: 'Baja', punto: 'bg-emerald-500' },
  { clave: 'media', label: 'Media', punto: 'bg-amber-500' },
  { clave: 'alta', label: 'Alta', punto: 'bg-rose-500' },
]

interface Formulario {
  nombre: string
  siglas: string
  tipo: TipoPrograma
  penaliza: boolean
  fraccion: number
  /** Texto del input; vacio = peso por defecto. */
  pesos: Record<Dificultad, string>
  /** Claves del JSON que este formulario no edita: se guardan tal cual. */
  otras: ReglasCalificacion
}

const FORMULARIO_VACIO: Formulario = {
  nombre: '',
  siglas: '',
  tipo: 'ADMISION',
  penaliza: false,
  fraccion: FRACCION_PENALIZACION_DEFAULT,
  pesos: { baja: '', media: '', alta: '' },
  otras: {},
}

function formularioDesde(u: UniversidadAdmin): Formulario {
  const { penaliza_incorrecta, fraccion_penalizacion, pesos_dificultad, ...otras } = u.reglasCalificacion
  return {
    nombre: u.nombre,
    siglas: u.siglas,
    tipo: u.tipo,
    penaliza: penaliza_incorrecta === true,
    fraccion: fraccion_penalizacion ?? FRACCION_PENALIZACION_DEFAULT,
    pesos: {
      baja: pesos_dificultad?.baja?.toString() ?? '',
      media: pesos_dificultad?.media?.toString() ?? '',
      alta: pesos_dificultad?.alta?.toString() ?? '',
    },
    otras,
  }
}

function reglasDesde(f: Formulario): ReglasCalificacion {
  const reglas: ReglasCalificacion = { ...f.otras }
  if (f.penaliza) {
    reglas.penaliza_incorrecta = true
    reglas.fraccion_penalizacion = f.fraccion
  }
  const pesos = Object.fromEntries(DIFICULTADES.filter((d) => f.pesos[d.clave].trim() !== '').map((d) => [d.clave, Number(f.pesos[d.clave])]))
  if (Object.keys(pesos).length > 0) reglas.pesos_dificultad = pesos
  return reglas
}

function pesoEfectivo(f: Formulario, d: Dificultad): number {
  const texto = f.pesos[d].trim()
  return texto === '' ? PESOS_DIFICULTAD_DEFAULT[d] : Number(texto)
}

function plural(n: number, singular: string, pluralTexto: string): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`
}

function mensajeError(err: unknown, porDefecto: string): string {
  return err instanceof ApiError ? err.message : porDefecto
}

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div>
        <div className="text-sm font-semibold text-slate-800">{titulo}</div>
        <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>
      </div>
      {children}
    </div>
  )
}

export default function AdminUniversidadesPage() {
  const [universidades, setUniversidades] = useState<UniversidadAdmin[] | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('TODAS')
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoPrograma>('TODOS')
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState<string | null>(null)

  /** null = nada abierto, 'nueva' = alta, o el id de la universidad seleccionada. */
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO)
  const [errorPanel, setErrorPanel] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  function cargar() {
    return listarUniversidades()
      .then(setUniversidades)
      .catch(() => setError('No se pudieron cargar los programas.'))
  }

  useEffect(() => {
    cargar()
  }, [])

  const seleccionada = universidades?.find((u) => u.id === seleccion) ?? null

  const filtradas = useMemo(() => {
    if (!universidades) return null
    const q = busqueda.trim().toLowerCase()
    return universidades.filter(
      (u) =>
        (filtro === 'TODAS' || u.activo === (filtro === 'ACTIVAS')) &&
        (filtroTipo === 'TODOS' || u.tipo === filtroTipo) &&
        (!q || u.nombre.toLowerCase().includes(q) || u.siglas.toLowerCase().includes(q)),
    )
  }, [universidades, filtro, filtroTipo, busqueda])

  const activas = universidades?.filter((u) => u.activo).length ?? 0
  const totalPublicados = universidades?.reduce((s, u) => s + u.examenesPublicados, 0) ?? 0
  const totalBorradores = universidades?.reduce((s, u) => s + u.examenesBorrador, 0) ?? 0
  const totalPreguntas = universidades?.reduce((s, u) => s + u.preguntas, 0) ?? 0

  /** En pantallas angostas el editor va debajo de la lista: se lleva a la vista al abrirlo. */
  function mostrarPanel() {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: 'start' }))
    }
  }

  function abrir(universidad: UniversidadAdmin | null) {
    setErrorPanel(null)
    setMensajeExito(null)
    setFormulario(universidad ? formularioDesde(universidad) : FORMULARIO_VACIO)
    setSeleccion(universidad ? universidad.id : 'nueva')
    mostrarPanel()
  }

  async function handleGuardar(evento: FormEvent) {
    evento.preventDefault()
    setErrorPanel(null)
    setMensajeExito(null)
    const request = { nombre: formulario.nombre, siglas: formulario.siglas, tipo: formulario.tipo, reglasCalificacion: reglasDesde(formulario) }
    setGuardando(true)
    try {
      const guardada = seleccionada ? await actualizarUniversidad(seleccionada.id, request) : await crearUniversidad(request)
      setSeleccion(guardada.id)
      setFormulario(formularioDesde(guardada))
      setMensajeExito(seleccionada ? 'Cambios guardados.' : 'Programa creado.')
      await cargar()
    } catch (err) {
      setErrorPanel(mensajeError(err, 'No se pudo guardar el programa.'))
    } finally {
      setGuardando(false)
    }
  }

  async function handleCambiarActivo(universidad: UniversidadAdmin) {
    if (universidad.activo) {
      const aviso =
        universidad.examenesPublicados > 0
          ? ` Tiene ${plural(universidad.examenesPublicados, 'examen publicado', 'exámenes publicados')}: dejará de aparecer para los estudiantes.`
          : ''
      if (!window.confirm(`¿Desactivar ${universidad.nombre}?${aviso}`)) return
    }
    setErrorPanel(null)
    setMensajeExito(null)
    setGuardando(true)
    try {
      await (universidad.activo ? desactivarUniversidad(universidad.id) : activarUniversidad(universidad.id))
      await cargar()
    } catch (err) {
      setErrorPanel(mensajeError(err, 'No se pudo cambiar el estado de la universidad.'))
    } finally {
      setGuardando(false)
    }
  }

  const panelAbierto = seleccion === 'nueva' || seleccionada !== null
  const ejemploPuntos = 4
  const descuentoEjemplo = Math.round(ejemploPuntos * formulario.fraccion * 100) / 100
  const pesosInvalidos = DIFICULTADES.some((d) => !(pesoEfectivo(formulario, d.clave) > 0))

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        title="Programas"
        description="Universidades de admisión y programas de idiomas y tecnología, con las reglas que califican sus simulacros."
        actions={
          <Button icon="add" onClick={() => abrir(null)}>
            Nuevo programa
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {universidades && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Programas activos"
            icon="account_balance"
            value={
              <>
                {activas} <span className="text-base font-semibold text-slate-400">/ {universidades.length}</span>
              </>
            }
            hint={universidades.length - activas > 0 ? plural(universidades.length - activas, 'inactivo', 'inactivos') : 'Todos visibles para los estudiantes'}
          />
          <StatCard label="Exámenes publicados" icon="assignment" tone="success" value={totalPublicados} hint={plural(totalBorradores, 'borrador', 'borradores')} />
          <StatCard label="Preguntas etiquetadas" icon="quiz" tone="info" value={totalPreguntas} hint="Preguntas marcadas para una universidad" />
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Card className="flex flex-col overflow-hidden lg:col-span-7">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input aria-label="Buscar programa" className="pl-9" placeholder="Buscar por nombre o siglas..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <Select aria-label="Filtrar por estado" className="sm:w-48" value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
                {OPCIONES_FILTRO.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <SegmentedControl
              options={[{ value: 'TODOS' as const, label: 'Todos' }, ...ORDEN_TIPOS_PROGRAMA.map((t) => ({ value: t, label: TIPOS_PROGRAMA[t].etiqueta, icon: TIPOS_PROGRAMA[t].icono }))]}
              value={filtroTipo}
              onChange={setFiltroTipo}
            />
          </div>

          {filtradas === null && !error && <EmptyState icon="hourglass_empty" title="Cargando programas..." />}
          {filtradas !== null && filtradas.length === 0 && <EmptyState icon="search_off" title="No hay programas que coincidan." />}

          {filtradas !== null && filtradas.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {filtradas.map((u) => {
                const activo = u.id === seleccion
                const penalizacion = penalizacionDe(u.reglasCalificacion)
                const examenes = u.examenesPublicados + u.examenesBorrador
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => abrir(u)}
                      aria-current={activo ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-center gap-4 border-l-[3px] px-4 py-3 text-left transition-colors',
                        activo ? 'border-primary-600 bg-primary-50/60' : 'border-transparent hover:bg-slate-50/80',
                        !u.activo && 'opacity-60',
                      )}
                    >
                      <span className={cn('flex h-10 w-12 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold', TIPOS_PROGRAMA[u.tipo].fondo)}>
                        {u.siglas.slice(0, 5).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={cn('truncate font-semibold', activo ? 'text-primary-700' : 'text-slate-900')}>{u.nombre}</div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {TIPOS_PROGRAMA[u.tipo].etiqueta} · {plural(examenes, 'examen', 'exámenes')} · {plural(u.preguntas, 'pregunta', 'preguntas')}
                        </div>
                      </div>
                      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                        {u.activo ? <Badge tone="success">Activo</Badge> : <Badge>Inactivo</Badge>}
                        <span className="text-xs text-slate-500">{penalizacion !== null ? `Resta ${formatearFraccion(penalizacion)}` : 'Sin penalización'}</span>
                      </div>
                      <Icon name="chevron_right" className={cn('shrink-0', activo ? 'text-primary-600' : 'text-slate-300')} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Sticky: al elegir una universidad de abajo de la lista, el editor sigue a la vista. */}
        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-[92px] lg:col-span-5">
          <Card className="flex flex-col overflow-hidden lg:max-h-[calc(100vh-116px)]">
            {!panelAbierto ? (
              <EmptyState icon="tune" title="Selecciona un programa para editar sus datos y reglas de calificación, o crea uno nuevo." />
            ) : (
              <form onSubmit={handleGuardar} className="flex min-h-0 flex-col">
                <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                  <span className={cn('flex h-10 w-12 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold', TIPOS_PROGRAMA[formulario.tipo].fondo)}>
                    {(formulario.siglas || '?').slice(0, 5).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-500">{seleccionada ? 'Editar programa' : 'Nuevo programa'}</span>
                    <div className="truncate font-display text-base font-bold text-slate-900">{formulario.nombre || 'Sin nombre'}</div>
                  </div>
                  <Button variant="ghost" size="icon" icon="close" aria-label="Cerrar editor" disabled={guardando} onClick={() => setSeleccion(null)} />
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto p-5">
                  {errorPanel && <Alert>{errorPanel}</Alert>}
                  {mensajeExito && <Alert tone="success">{mensajeExito}</Alert>}

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">Tipo de programa</span>
                    <SegmentedControl
                      options={ORDEN_TIPOS_PROGRAMA.map((t) => ({ value: t, label: TIPOS_PROGRAMA[t].etiqueta, icon: TIPOS_PROGRAMA[t].icono }))}
                      value={formulario.tipo}
                      onChange={(tipo) => setFormulario({ ...formulario, tipo })}
                    />
                    <span className="text-xs text-slate-500">
                      {formulario.tipo === 'ADMISION'
                        ? 'Cuenta como universidad meta del plan Free.'
                        : 'Solo para planes de pago; no cuenta como universidad meta.'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Nombre" className="sm:col-span-2">
                      <Input value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} required />
                    </Field>
                    <Field label="Siglas">
                      <Input value={formulario.siglas} maxLength={20} onChange={(e) => setFormulario({ ...formulario, siglas: e.target.value })} required />
                    </Field>
                  </div>

                  <div className="pt-1 text-sm font-semibold text-slate-700">Reglas de calificación</div>

                  <Seccion titulo="Respuestas incorrectas" descripcion="Si se activa, cada respuesta incorrecta resta una parte del puntaje de la pregunta. En blanco nunca resta.">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={formulario.penaliza}
                        onChange={(e) => setFormulario({ ...formulario, penaliza: e.target.checked })}
                        className="peer sr-only"
                      />
                      <span className="relative h-5 w-9 shrink-0 rounded-full bg-slate-200 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-primary-600 peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-primary-600" />
                      <span className="text-sm text-slate-700">{formulario.penaliza ? 'Descuenta por respuesta incorrecta' : 'No descuenta'}</span>
                    </label>

                    {formulario.penaliza && (
                      <>
                        <SegmentedControl
                          options={FRACCIONES.map((f) => ({ value: String(f), label: f === 1 ? 'Todo' : formatearFraccion(f) }))
                            .concat(FRACCIONES.some((f) => Math.abs(f - formulario.fraccion) < 1e-9) ? [] : [{ value: String(formulario.fraccion), label: formatearFraccion(formulario.fraccion) }])}
                          value={String(FRACCIONES.find((f) => Math.abs(f - formulario.fraccion) < 1e-9) ?? formulario.fraccion)}
                          onChange={(valor) => setFormulario({ ...formulario, fraccion: Number(valor) })}
                        />
                        <p className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Icon name="lightbulb" size={16} className="text-amber-500" />
                          Una pregunta de {ejemploPuntos} pts mal respondida resta {descuentoEjemplo} {descuentoEjemplo === 1 ? 'pt' : 'pts'}.
                        </p>
                      </>
                    )}
                  </Seccion>

                  <Seccion
                    titulo="Peso por dificultad"
                    descripcion="Solo en exámenes aleatorios por área: el puntaje se reparte según la dificultad de cada pregunta. Vacío = valor por defecto."
                  >
                    <div className="grid grid-cols-3 gap-3">
                      {DIFICULTADES.map((d) => (
                        <label key={d.clave} className="flex flex-col gap-1.5">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <span className={cn('h-2 w-2 rounded-full', d.punto)} />
                            {d.label}
                          </span>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            placeholder={String(PESOS_DIFICULTAD_DEFAULT[d.clave])}
                            value={formulario.pesos[d.clave]}
                            onChange={(e) => setFormulario({ ...formulario, pesos: { ...formulario.pesos, [d.clave]: e.target.value } })}
                          />
                        </label>
                      ))}
                    </div>
                    {!pesosInvalidos && (
                      <p className="text-xs text-slate-600">
                        Una pregunta alta vale {Math.round((pesoEfectivo(formulario, 'alta') / pesoEfectivo(formulario, 'baja')) * 100) / 100}× lo que una baja.
                      </p>
                    )}
                  </Seccion>

                  {Object.keys(formulario.otras).length > 0 && (
                    <details className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                      <summary className="cursor-pointer font-semibold">Otras reglas guardadas (se conservan)</summary>
                      <pre className="mt-2 overflow-x-auto font-mono">{JSON.stringify(formulario.otras, null, 2)}</pre>
                    </details>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5">
                  {seleccionada ? (
                    <Button variant={seleccionada.activo ? 'danger' : 'secondary'} icon={seleccionada.activo ? 'block' : 'check_circle'} disabled={guardando} onClick={() => handleCambiarActivo(seleccionada)}>
                      {seleccionada.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  ) : (
                    <span />
                  )}
                  <Button type="submit" loading={guardando} disabled={pesosInvalidos}>
                    {seleccionada ? 'Guardar cambios' : 'Crear programa'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
