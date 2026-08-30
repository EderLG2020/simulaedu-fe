import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { crearGrupo, eliminarGrupo, listarGrupos, type Grupo } from '../../api/gruposApi'
import { useAuth } from '../../hooks/useAuth'
import ReporteBoton from './ReporteBoton'
import './docente.css'

export default function GruposPage() {
  const { cerrarSesion } = useAuth()
  const [grupos, setGrupos] = useState<Grupo[] | null>(null)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  function alternarSeleccion(grupoId: string) {
    setSeleccionados((actual) =>
      actual.includes(grupoId) ? actual.filter((id) => id !== grupoId) : [...actual, grupoId],
    )
  }

  function cargar() {
    listarGrupos()
      .then(setGrupos)
      .catch(() => setError('No se pudieron cargar tus grupos.'))
  }

  useEffect(cargar, [])

  async function handleCrear(evento: FormEvent) {
    evento.preventDefault()
    if (!nombreNuevo.trim()) return

    setError(null)
    setCreando(true)
    try {
      await crearGrupo(nombreNuevo.trim())
      setNombreNuevo('')
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el grupo.')
    } finally {
      setCreando(false)
    }
  }

  async function handleEliminar(grupo: Grupo) {
    setError(null)
    setEliminandoId(grupo.id)
    try {
      await eliminarGrupo(grupo.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar el grupo.')
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div className="docente-page">
      <header className="docente-header">
        <h1>Mis grupos</h1>
        <button type="button" className="docente-cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </header>

      {error && <p className="docente-error">{error}</p>}

      <form className="docente-crear-grupo" onSubmit={handleCrear}>
        <input
          type="text"
          placeholder="Nombre del grupo (ej. Seccion A)"
          value={nombreNuevo}
          onChange={(evento) => setNombreNuevo(evento.target.value)}
        />
        <button type="submit" disabled={creando || !nombreNuevo.trim()}>
          {creando ? 'Creando...' : 'Crear grupo'}
        </button>
      </form>

      {grupos === null && !error && <p>Cargando grupos...</p>}
      {grupos !== null && grupos.length === 0 && <p>Todavia no tienes grupos.</p>}

      <ul className="docente-lista">
        {grupos?.map((grupo) => (
          <li key={grupo.id} className="docente-grupo">
            <input
              type="checkbox"
              checked={seleccionados.includes(grupo.id)}
              onChange={() => alternarSeleccion(grupo.id)}
              aria-label={`Seleccionar ${grupo.nombre} para comparar`}
            />
            <Link to={`/docente/grupos/${grupo.id}`} className="docente-grupo-link">
              <h2>{grupo.nombre}</h2>
              <p>{grupo.totalAlumnos} alumno(s)</p>
            </Link>
            <Link to={`/docente/grupos/${grupo.id}/estadisticas`}>Estadisticas</Link>
            <button
              type="button"
              className="docente-eliminar"
              disabled={eliminandoId === grupo.id}
              onClick={() => handleEliminar(grupo)}
            >
              {eliminandoId === grupo.id ? 'Eliminando...' : 'Eliminar'}
            </button>
          </li>
        ))}
      </ul>

      {seleccionados.length >= 2 && (
        <p className="docente-reporte-grupo">
          Reporte comparativo de {seleccionados.length} grupos:{' '}
          <ReporteBoton base={{ tipo: 'COMPARATIVO', grupoIds: seleccionados }} etiqueta="Generar" />
        </p>
      )}
    </div>
  )
}
