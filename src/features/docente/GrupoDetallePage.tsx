import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { claves } from '../../api/claves'
import { mensajeDeError } from '../../api/client'
import { listarMisExamenesPublicados } from '../../api/examenesApi'
import {
  agregarAlumno,
  asignarExamen,
  buscarAlumnosDisponibles,
  eliminarAsignacion,
  listarAlumnosDeGrupo,
  listarAsignaciones,
  listarGrupos,
  quitarAlumno,
  type AlumnoBusqueda,
  type AlumnoDeGrupo,
  type Asignacion,
} from '../../api/gruposApi'
import { Alert, Button, buttonClasses, Card, EmptyState, Field, Icon, Input, PageHeader, Select } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

/** Encabezado de cada seccion (Alumnos / Examenes asignados) dentro de su Card. */
function EncabezadoSeccion({ icon, titulo }: { icon: string; titulo: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
      <Icon name={icon} className="text-primary-600" />
      <h2 className="font-display text-base font-semibold text-slate-900">{titulo}</h2>
    </div>
  )
}

/** Fila de alumno (nombre + correo) con una accion a la derecha. */
function FilaPersona({ nombre, email, children }: { nombre: string; email: string; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/60">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon name="person" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{nombre}</p>
        <p className="truncate text-xs text-slate-500">{email}</p>
      </div>
      {children}
    </li>
  )
}

export default function GrupoDetallePage() {
  const { id: grupoId = '' } = useParams<{ id: string }>()
  const { usuario } = useAuth()

  // El grupo sale de la misma lista que GruposPage (misma clave): llegando desde ahi ya esta cacheada.
  const consultaGrupos = useQuery({ queryKey: claves.grupos.todos, queryFn: listarGrupos })
  const consultaAlumnos = useQuery({ queryKey: claves.grupos.alumnos(grupoId), queryFn: () => listarAlumnosDeGrupo(grupoId) })
  const consultaAsignaciones = useQuery({ queryKey: claves.grupos.asignaciones(grupoId), queryFn: () => listarAsignaciones(grupoId) })
  const consultaExamenes = useQuery({
    queryKey: claves.examenes.deAutor(usuario?.id ?? ''),
    queryFn: () => listarMisExamenesPublicados(usuario!.id),
    enabled: usuario !== null,
  })
  const grupo = consultaGrupos.data?.find((g) => g.id === grupoId) ?? null
  const grupoNoEncontrado = consultaGrupos.isSuccess && grupo === null
  const alumnos = consultaAlumnos.data ?? null
  const asignaciones = consultaAsignaciones.data ?? null
  const examenes = consultaExamenes.data ?? null
  const [errorAccion, setError] = useState<string | null>(null)
  const error =
    errorAccion ??
    (consultaGrupos.isError
      ? 'No se pudo cargar el grupo.'
      : consultaAlumnos.isError
        ? 'No se pudieron cargar los alumnos del grupo.'
        : consultaAsignaciones.isError
          ? 'No se pudieron cargar las asignaciones del grupo.'
          : consultaExamenes.isError
            ? 'No se pudieron cargar tus examenes publicados.'
            : null)

  const [busqueda, setBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<AlumnoBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [alumnoEnProceso, setAlumnoEnProceso] = useState<string | null>(null)

  const [examenSeleccionado, setExamenSeleccionado] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [asignando, setAsignando] = useState(false)
  const [asignacionEnProceso, setAsignacionEnProceso] = useState<string | null>(null)

  /** El grupo muestra la cantidad de alumnos: se refresca al agregar o quitar uno. */
  function cargarGrupo() {
    void consultaGrupos.refetch()
  }

  function cargarAlumnos() {
    void consultaAlumnos.refetch()
  }

  function cargarAsignaciones() {
    void consultaAsignaciones.refetch()
  }

  async function handleBuscar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setBuscando(true)
    try {
      setResultadosBusqueda(await buscarAlumnosDisponibles(busqueda))
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo buscar alumnos.'))
    } finally {
      setBuscando(false)
    }
  }

  async function handleAgregar(alumno: AlumnoBusqueda) {
    if (!grupoId) return
    setError(null)
    setAlumnoEnProceso(alumno.id)
    try {
      await agregarAlumno(grupoId, alumno.id)
      setResultadosBusqueda((resultados) => resultados.filter((a) => a.id !== alumno.id))
      cargarAlumnos()
      cargarGrupo()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo agregar al alumno.'))
    } finally {
      setAlumnoEnProceso(null)
    }
  }

  async function handleQuitar(alumno: AlumnoDeGrupo) {
    if (!grupoId) return
    setError(null)
    setAlumnoEnProceso(alumno.alumnoId)
    try {
      await quitarAlumno(grupoId, alumno.alumnoId)
      cargarAlumnos()
      cargarGrupo()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo quitar al alumno.'))
    } finally {
      setAlumnoEnProceso(null)
    }
  }

  async function handleAsignarExamen(evento: FormEvent) {
    evento.preventDefault()
    if (!grupoId || !examenSeleccionado || !fechaInicio || !fechaFin) return

    setError(null)
    setAsignando(true)
    try {
      await asignarExamen(grupoId, examenSeleccionado, new Date(fechaInicio).toISOString(), new Date(fechaFin).toISOString())
      setExamenSeleccionado('')
      setFechaInicio('')
      setFechaFin('')
      cargarAsignaciones()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo asignar el examen.'))
    } finally {
      setAsignando(false)
    }
  }

  async function handleEliminarAsignacion(asignacion: Asignacion) {
    if (!grupoId) return
    setError(null)
    setAsignacionEnProceso(asignacion.id)
    try {
      await eliminarAsignacion(grupoId, asignacion.id)
      cargarAsignaciones()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar la asignacion.'))
    } finally {
      setAsignacionEnProceso(null)
    }
  }

  if (grupoNoEncontrado) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Alert>Este grupo no existe o no te pertenece.</Alert>
        <Link to="/docente/grupos" className={buttonClasses('secondary', 'md', 'self-start')}>
          <Icon name="arrow_back" />
          Volver a mis grupos
        </Link>
      </div>
    )
  }

  const idsYaEnGrupo = new Set(alumnos?.map((a) => a.alumnoId))

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/docente/grupos"
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-slate-500 transition-colors hover:text-primary-600"
        >
          <Icon name="arrow_back" size={16} />
          Mis grupos
        </Link>
        <PageHeader
          title={grupo?.nombre ?? 'Cargando...'}
          actions={
            grupoId && (
              <Link to={`/docente/grupos/${grupoId}/estadisticas`} className={buttonClasses('secondary')}>
                <Icon name="bar_chart" />
                Ver estadisticas
              </Link>
            )
          }
        />
      </div>

      {error && <Alert>{error}</Alert>}

      <Card className="overflow-hidden">
        <section>
          <EncabezadoSeccion icon="groups" titulo="Alumnos" />
          {alumnos !== null && alumnos.length === 0 && <EmptyState icon="person_off" title="Todavia no hay alumnos en este grupo." />}
          {alumnos !== null && alumnos.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {alumnos.map((alumno) => (
                <FilaPersona key={alumno.alumnoId} nombre={alumno.nombre} email={alumno.email}>
                  <Button
                    variant="danger"
                    size="sm"
                    icon="person_remove"
                    loading={alumnoEnProceso === alumno.alumnoId}
                    onClick={() => handleQuitar(alumno)}
                  >
                    {alumnoEnProceso === alumno.alumnoId ? 'Quitando...' : 'Quitar'}
                  </Button>
                </FilaPersona>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 p-4">
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleBuscar}>
              <Input
                type="text"
                placeholder="Buscar alumno por nombre o correo"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
              />
              <Button type="submit" icon="search" className="shrink-0" loading={buscando} disabled={busqueda.trim().length < 2}>
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>
            </form>

            {resultadosBusqueda.length > 0 && (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {resultadosBusqueda.map((alumno) => {
                  const yaEnGrupo = idsYaEnGrupo.has(alumno.id)
                  return (
                    <FilaPersona key={alumno.id} nombre={alumno.nombre} email={alumno.email}>
                      {yaEnGrupo ? (
                        <Button variant="ghost" size="sm" icon="check" disabled>
                          Ya esta en el grupo
                        </Button>
                      ) : (
                        <Button size="sm" icon="person_add" loading={alumnoEnProceso === alumno.id} onClick={() => handleAgregar(alumno)}>
                          {alumnoEnProceso === alumno.id ? 'Agregando...' : 'Agregar'}
                        </Button>
                      )}
                    </FilaPersona>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </Card>

      <Card className="overflow-hidden">
        <section>
          <EncabezadoSeccion icon="assignment" titulo="Examenes asignados" />
          {asignaciones !== null && asignaciones.length === 0 && <EmptyState icon="event_busy" title="Todavia no hay examenes asignados." />}
          {asignaciones !== null && asignaciones.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {asignaciones.map((asignacion) => (
                <li key={asignacion.id} className="flex flex-wrap items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50/60">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{asignacion.examenNombre}</p>
                    <p className="mt-0.5 inline-flex flex-wrap items-center gap-1 text-xs text-slate-500">
                      <Icon name="schedule" size={14} />
                      {new Date(asignacion.fechaInicio).toLocaleString()} &rarr; {new Date(asignacion.fechaFin).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link to={`/docente/examenes/${asignacion.examenId}/estadisticas`} className={buttonClasses('ghost', 'sm')}>
                      <Icon name="bar_chart" size={16} />
                      Estadisticas
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      icon="delete"
                      loading={asignacionEnProceso === asignacion.id}
                      onClick={() => handleEliminarAsignacion(asignacion)}
                    >
                      {asignacionEnProceso === asignacion.id ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 p-4">
            <form className="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={handleAsignarExamen}>
              <Field label="Examen">
                <Select value={examenSeleccionado} onChange={(evento) => setExamenSeleccionado(evento.target.value)} required>
                  <option value="">Elige un examen publicado...</option>
                  {examenes?.map((examen) => (
                    <option key={examen.id} value={examen.id}>
                      {examen.nombre}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Inicio">
                <Input type="datetime-local" value={fechaInicio} onChange={(evento) => setFechaInicio(evento.target.value)} required />
              </Field>
              <Field label="Fin">
                <Input type="datetime-local" value={fechaFin} onChange={(evento) => setFechaFin(evento.target.value)} required />
              </Field>
              <Button type="submit" icon="event_available" loading={asignando}>
                {asignando ? 'Asignando...' : 'Asignar examen'}
              </Button>
            </form>
            {examenes !== null && examenes.length === 0 && (
              <Alert tone="info">Todavia no tienes examenes publicados para asignar.</Alert>
            )}
          </div>
        </section>
      </Card>
    </div>
  )
}
