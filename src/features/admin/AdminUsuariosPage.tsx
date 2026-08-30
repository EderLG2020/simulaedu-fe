import { useEffect, useState } from 'react'
import {
  eliminarUsuario,
  listarUsuarios,
  reactivarUsuario,
  suspenderUsuario,
  type EstadoUsuario,
  type RolUsuario,
  type UsuarioAdmin,
} from '../../api/adminUsuariosApi'
import { ApiError } from '../../api/client'
import type { PageMeta } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import './admin.css'

const LIMITE_POR_PAGINA = 20

function formatearFecha(fecha: string | null): string {
  return fecha === null ? '-' : new Date(fecha).toLocaleDateString()
}

export default function AdminUsuariosPage() {
  const { usuario: propioUsuario, cerrarSesion } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null)
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [rolFiltro, setRolFiltro] = useState<RolUsuario | ''>('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoUsuario | ''>('')
  const [pagina, setPagina] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)

  function cargar() {
    listarUsuarios({
      rol: rolFiltro || undefined,
      estado: estadoFiltro || undefined,
      page: pagina,
      limit: LIMITE_POR_PAGINA,
    })
      .then((resultado) => {
        setUsuarios(resultado.data)
        setMeta(resultado.meta)
      })
      .catch(() => setError('No se pudieron cargar los usuarios.'))
  }

  useEffect(cargar, [rolFiltro, estadoFiltro, pagina])

  function handleCambiarRolFiltro(valor: RolUsuario | '') {
    setRolFiltro(valor)
    setPagina(1)
  }

  function handleCambiarEstadoFiltro(valor: EstadoUsuario | '') {
    setEstadoFiltro(valor)
    setPagina(1)
  }

  function esAccionPropiaOAdmin(usuarioObjetivo: UsuarioAdmin): boolean {
    return usuarioObjetivo.id === propioUsuario?.id || usuarioObjetivo.rol === 'ADMIN'
  }

  async function handleSuspender(usuarioObjetivo: UsuarioAdmin) {
    setError(null)
    setAccionEnProceso(usuarioObjetivo.id)
    try {
      await suspenderUsuario(usuarioObjetivo.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo suspender al usuario.')
    } finally {
      setAccionEnProceso(null)
    }
  }

  async function handleReactivar(usuarioObjetivo: UsuarioAdmin) {
    setError(null)
    setAccionEnProceso(usuarioObjetivo.id)
    try {
      await reactivarUsuario(usuarioObjetivo.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo reactivar al usuario.')
    } finally {
      setAccionEnProceso(null)
    }
  }

  async function handleEliminar(usuarioObjetivo: UsuarioAdmin) {
    if (!window.confirm(`¿Eliminar la cuenta de ${usuarioObjetivo.nombre}? Esta accion no se puede deshacer.`)) return

    setError(null)
    setAccionEnProceso(usuarioObjetivo.id)
    try {
      await eliminarUsuario(usuarioObjetivo.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar al usuario.')
    } finally {
      setAccionEnProceso(null)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Usuarios</h1>
        <button type="button" className="admin-cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-filtros">
        <select value={rolFiltro} onChange={(evento) => handleCambiarRolFiltro(evento.target.value as RolUsuario | '')}>
          <option value="">Todos los roles</option>
          <option value="ESTUDIANTE">Estudiante</option>
          <option value="DOCENTE">Docente</option>
          <option value="COORDINADOR">Coordinador</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={estadoFiltro}
          onChange={(evento) => handleCambiarEstadoFiltro(evento.target.value as EstadoUsuario | '')}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="SUSPENDIDO">Suspendido</option>
          <option value="ELIMINADO">Eliminado</option>
        </select>
      </div>

      {usuarios === null && !error && <p>Cargando usuarios...</p>}
      {usuarios !== null && usuarios.length === 0 && <p>No hay usuarios que coincidan con estos filtros.</p>}

      {usuarios !== null && usuarios.length > 0 && (
        <table className="admin-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Verificado</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuarioFila) => (
              <tr key={usuarioFila.id}>
                <td>{usuarioFila.nombre}</td>
                <td>{usuarioFila.email}</td>
                <td>{usuarioFila.rol}</td>
                <td>{usuarioFila.estado}</td>
                <td>{usuarioFila.emailVerificado ? 'Si' : 'No'}</td>
                <td>{formatearFecha(usuarioFila.creadoEn)}</td>
                <td className="admin-acciones">
                  {usuarioFila.estado === 'ACTIVO' && (
                    <button
                      type="button"
                      disabled={accionEnProceso === usuarioFila.id || esAccionPropiaOAdmin(usuarioFila)}
                      onClick={() => handleSuspender(usuarioFila)}
                    >
                      Suspender
                    </button>
                  )}
                  {usuarioFila.estado === 'SUSPENDIDO' && (
                    <button type="button" disabled={accionEnProceso === usuarioFila.id} onClick={() => handleReactivar(usuarioFila)}>
                      Reactivar
                    </button>
                  )}
                  {usuarioFila.estado !== 'ELIMINADO' && (
                    <button
                      type="button"
                      className="admin-eliminar"
                      disabled={accionEnProceso === usuarioFila.id || esAccionPropiaOAdmin(usuarioFila)}
                      onClick={() => handleEliminar(usuarioFila)}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {meta !== null && meta.totalPages > 1 && (
        <div className="admin-paginacion">
          <button type="button" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Pagina {meta.page} de {meta.totalPages} ({meta.total} usuarios)
          </span>
          <button type="button" disabled={pagina >= meta.totalPages} onClick={() => setPagina((p) => p + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
