import { useEffect, useState } from 'react'
import {
  activarUniversidad,
  crearUniversidad,
  desactivarUniversidad,
  listarUniversidades,
  actualizarUniversidad,
  type UniversidadAdmin,
} from '../../api/adminUniversidadesApi'
import { ApiError } from '../../api/client'
import './admin.css'

type FiltroActivo = '' | 'true' | 'false'

interface FormularioUniversidad {
  nombre: string
  siglas: string
  reglasCalificacionTexto: string
}

const FORMULARIO_VACIO: FormularioUniversidad = { nombre: '', siglas: '', reglasCalificacionTexto: '{}' }

export default function AdminUniversidadesPage() {
  const [universidades, setUniversidades] = useState<UniversidadAdmin[] | null>(null)
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>('')
  const [error, setError] = useState<string | null>(null)
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)

  const [universidadEnEdicion, setUniversidadEnEdicion] = useState<UniversidadAdmin | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [formulario, setFormulario] = useState<FormularioUniversidad>(FORMULARIO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    listarUniversidades(filtroActivo === '' ? undefined : filtroActivo === 'true')
      .then(setUniversidades)
      .catch(() => setError('No se pudieron cargar las universidades.'))
  }

  useEffect(cargar, [filtroActivo])

  function abrirCrear() {
    setUniversidadEnEdicion(null)
    setFormulario(FORMULARIO_VACIO)
    setErrorFormulario(null)
    setFormularioAbierto(true)
  }

  function abrirEditar(universidad: UniversidadAdmin) {
    setUniversidadEnEdicion(universidad)
    setFormulario({
      nombre: universidad.nombre,
      siglas: universidad.siglas,
      reglasCalificacionTexto: JSON.stringify(universidad.reglasCalificacion, null, 2),
    })
    setErrorFormulario(null)
    setFormularioAbierto(true)
  }

  function cerrarFormulario() {
    setFormularioAbierto(false)
    setUniversidadEnEdicion(null)
  }

  async function handleGuardar(evento: React.FormEvent) {
    evento.preventDefault()
    setErrorFormulario(null)

    let reglasCalificacion: Record<string, unknown>
    try {
      reglasCalificacion = formulario.reglasCalificacionTexto.trim() === '' ? {} : JSON.parse(formulario.reglasCalificacionTexto)
    } catch {
      setErrorFormulario('Las reglas de calificacion deben ser un JSON valido.')
      return
    }

    const request = { nombre: formulario.nombre, siglas: formulario.siglas, reglasCalificacion }

    setGuardando(true)
    try {
      if (universidadEnEdicion) {
        await actualizarUniversidad(universidadEnEdicion.id, request)
      } else {
        await crearUniversidad(request)
      }
      cerrarFormulario()
      cargar()
    } catch (err) {
      setErrorFormulario(err instanceof ApiError ? err.message : 'No se pudo guardar la universidad.')
    } finally {
      setGuardando(false)
    }
  }

  async function handleDesactivar(universidad: UniversidadAdmin) {
    setError(null)
    setAccionEnProceso(universidad.id)
    try {
      await desactivarUniversidad(universidad.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo desactivar la universidad.')
    } finally {
      setAccionEnProceso(null)
    }
  }

  async function handleActivar(universidad: UniversidadAdmin) {
    setError(null)
    setAccionEnProceso(universidad.id)
    try {
      await activarUniversidad(universidad.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo activar la universidad.')
    } finally {
      setAccionEnProceso(null)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Universidades</h1>
        <button type="button" onClick={abrirCrear}>
          Nueva universidad
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-filtros">
        <select value={filtroActivo} onChange={(evento) => setFiltroActivo(evento.target.value as FiltroActivo)}>
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </div>

      {formularioAbierto && (
        <form className="admin-formulario" onSubmit={handleGuardar}>
          <h2>{universidadEnEdicion ? 'Editar universidad' : 'Nueva universidad'}</h2>
          {errorFormulario && <p className="admin-error">{errorFormulario}</p>}
          <label>
            Nombre
            <input
              value={formulario.nombre}
              onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
              required
            />
          </label>
          <label>
            Siglas
            <input
              value={formulario.siglas}
              maxLength={20}
              onChange={(evento) => setFormulario({ ...formulario, siglas: evento.target.value })}
              required
            />
          </label>
          <label>
            Reglas de calificacion (JSON)
            <textarea
              rows={6}
              value={formulario.reglasCalificacionTexto}
              onChange={(evento) => setFormulario({ ...formulario, reglasCalificacionTexto: evento.target.value })}
            />
          </label>
          <div className="admin-formulario-acciones">
            <button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={cerrarFormulario} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {universidades === null && !error && <p>Cargando universidades...</p>}
      {universidades !== null && universidades.length === 0 && <p>No hay universidades que coincidan con este filtro.</p>}

      {universidades !== null && universidades.length > 0 && (
        <table className="admin-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Siglas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {universidades.map((universidad) => (
              <tr key={universidad.id}>
                <td>{universidad.nombre}</td>
                <td>{universidad.siglas}</td>
                <td>{universidad.activo ? 'Activa' : 'Inactiva'}</td>
                <td className="admin-acciones">
                  <button type="button" disabled={accionEnProceso === universidad.id} onClick={() => abrirEditar(universidad)}>
                    Editar
                  </button>
                  {universidad.activo ? (
                    <button
                      type="button"
                      className="admin-eliminar"
                      disabled={accionEnProceso === universidad.id}
                      onClick={() => handleDesactivar(universidad)}
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button type="button" disabled={accionEnProceso === universidad.id} onClick={() => handleActivar(universidad)}>
                      Activar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
