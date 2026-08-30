import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { listarMisExamenesPublicados, type ExamenResumen } from '../../api/examenesApi'
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
  type Grupo,
} from '../../api/gruposApi'
import { useAuth } from '../../hooks/useAuth'
import './docente.css'

export default function GrupoDetallePage() {
  const { id: grupoId } = useParams<{ id: string }>()
  const { usuario } = useAuth()

  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [grupoNoEncontrado, setGrupoNoEncontrado] = useState(false)
  const [alumnos, setAlumnos] = useState<AlumnoDeGrupo[] | null>(null)
  const [asignaciones, setAsignaciones] = useState<Asignacion[] | null>(null)
  const [examenes, setExamenes] = useState<ExamenResumen[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<AlumnoBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [alumnoEnProceso, setAlumnoEnProceso] = useState<string | null>(null)

  const [examenSeleccionado, setExamenSeleccionado] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [asignando, setAsignando] = useState(false)
  const [asignacionEnProceso, setAsignacionEnProceso] = useState<string | null>(null)

  function cargarGrupo() {
    if (!grupoId) return
    listarGrupos()
      .then((grupos) => {
        const encontrado = grupos.find((g) => g.id === grupoId)
        if (!encontrado) {
          setGrupoNoEncontrado(true)
          return
        }
        setGrupo(encontrado)
      })
      .catch(() => setError('No se pudo cargar el grupo.'))
  }

  function cargarAlumnos() {
    if (!grupoId) return
    listarAlumnosDeGrupo(grupoId)
      .then(setAlumnos)
      .catch(() => setError('No se pudieron cargar los alumnos del grupo.'))
  }

  function cargarAsignaciones() {
    if (!grupoId) return
    listarAsignaciones(grupoId)
      .then(setAsignaciones)
      .catch(() => setError('No se pudieron cargar las asignaciones del grupo.'))
  }

  useEffect(cargarGrupo, [grupoId])
  useEffect(cargarAlumnos, [grupoId])
  useEffect(cargarAsignaciones, [grupoId])

  useEffect(() => {
    if (!usuario) return
    listarMisExamenesPublicados(usuario.id)
      .then(setExamenes)
      .catch(() => setError('No se pudieron cargar tus examenes publicados.'))
  }, [usuario])

  async function handleBuscar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setBuscando(true)
    try {
      setResultadosBusqueda(await buscarAlumnosDisponibles(busqueda))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo buscar alumnos.')
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
      setError(err instanceof ApiError ? err.message : 'No se pudo agregar al alumno.')
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
      setError(err instanceof ApiError ? err.message : 'No se pudo quitar al alumno.')
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
      setError(err instanceof ApiError ? err.message : 'No se pudo asignar el examen.')
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
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar la asignacion.')
    } finally {
      setAsignacionEnProceso(null)
    }
  }

  if (grupoNoEncontrado) {
    return (
      <div className="docente-page">
        <p className="docente-error">Este grupo no existe o no te pertenece.</p>
        <Link to="/docente/grupos">Volver a mis grupos</Link>
      </div>
    )
  }

  const idsYaEnGrupo = new Set(alumnos?.map((a) => a.alumnoId))

  return (
    <div className="docente-page">
      <header className="docente-header">
        <div>
          <Link to="/docente/grupos" className="docente-volver">
            &larr; Mis grupos
          </Link>
          <h1>{grupo?.nombre ?? 'Cargando...'}</h1>
        </div>
      </header>

      {error && <p className="docente-error">{error}</p>}

      <section className="docente-seccion">
        <h2>Alumnos</h2>
        <ul className="docente-lista">
          {alumnos?.map((alumno) => (
            <li key={alumno.alumnoId} className="docente-alumno">
              <div>
                <p className="docente-alumno-nombre">{alumno.nombre}</p>
                <p className="docente-alumno-email">{alumno.email}</p>
              </div>
              <button
                type="button"
                className="docente-eliminar"
                disabled={alumnoEnProceso === alumno.alumnoId}
                onClick={() => handleQuitar(alumno)}
              >
                {alumnoEnProceso === alumno.alumnoId ? 'Quitando...' : 'Quitar'}
              </button>
            </li>
          ))}
          {alumnos !== null && alumnos.length === 0 && <p>Todavia no hay alumnos en este grupo.</p>}
        </ul>

        <form className="docente-buscar-alumno" onSubmit={handleBuscar}>
          <input
            type="text"
            placeholder="Buscar alumno por nombre o correo"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
          <button type="submit" disabled={buscando || busqueda.trim().length < 2}>
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {resultadosBusqueda.length > 0 && (
          <ul className="docente-lista">
            {resultadosBusqueda.map((alumno) => (
              <li key={alumno.id} className="docente-alumno">
                <div>
                  <p className="docente-alumno-nombre">{alumno.nombre}</p>
                  <p className="docente-alumno-email">{alumno.email}</p>
                </div>
                <button
                  type="button"
                  className="docente-agregar"
                  disabled={alumnoEnProceso === alumno.id || idsYaEnGrupo.has(alumno.id)}
                  onClick={() => handleAgregar(alumno)}
                >
                  {idsYaEnGrupo.has(alumno.id) ? 'Ya esta en el grupo' : alumnoEnProceso === alumno.id ? 'Agregando...' : 'Agregar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="docente-seccion">
        <h2>Examenes asignados</h2>
        <ul className="docente-lista">
          {asignaciones?.map((asignacion) => (
            <li key={asignacion.id} className="docente-asignacion">
              <div>
                <p className="docente-alumno-nombre">{asignacion.examenNombre}</p>
                <p className="docente-alumno-email">
                  {new Date(asignacion.fechaInicio).toLocaleString()} &rarr; {new Date(asignacion.fechaFin).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                className="docente-eliminar"
                disabled={asignacionEnProceso === asignacion.id}
                onClick={() => handleEliminarAsignacion(asignacion)}
              >
                {asignacionEnProceso === asignacion.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </li>
          ))}
          {asignaciones !== null && asignaciones.length === 0 && <p>Todavia no hay examenes asignados.</p>}
        </ul>

        <form className="docente-asignar-examen" onSubmit={handleAsignarExamen}>
          <select value={examenSeleccionado} onChange={(evento) => setExamenSeleccionado(evento.target.value)} required>
            <option value="">Elige un examen publicado...</option>
            {examenes?.map((examen) => (
              <option key={examen.id} value={examen.id}>
                {examen.nombre}
              </option>
            ))}
          </select>
          <label>
            Inicio
            <input type="datetime-local" value={fechaInicio} onChange={(evento) => setFechaInicio(evento.target.value)} required />
          </label>
          <label>
            Fin
            <input type="datetime-local" value={fechaFin} onChange={(evento) => setFechaFin(evento.target.value)} required />
          </label>
          <button type="submit" disabled={asignando}>
            {asignando ? 'Asignando...' : 'Asignar examen'}
          </button>
        </form>
        {examenes !== null && examenes.length === 0 && <p>Todavia no tienes examenes publicados para asignar.</p>}
      </section>
    </div>
  )
}
