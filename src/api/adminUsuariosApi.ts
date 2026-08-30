import { apiFetch, apiFetchPagina, type ApiPageEnvelope } from './client'

export type RolUsuario = 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN' | 'COORDINADOR'
export type EstadoUsuario = 'ACTIVO' | 'SUSPENDIDO' | 'ELIMINADO'

export interface UsuarioAdmin {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
  estado: EstadoUsuario
  emailVerificado: boolean
  institucionId: string | null
  creadoEn: string | null
}

export interface ListarUsuariosParams {
  rol?: RolUsuario
  estado?: EstadoUsuario
  page: number
  limit: number
}

export function listarUsuarios(params: ListarUsuariosParams): Promise<ApiPageEnvelope<UsuarioAdmin>> {
  const query = new URLSearchParams()
  if (params.rol) query.set('rol', params.rol)
  if (params.estado) query.set('estado', params.estado)
  query.set('page', String(params.page))
  query.set('limit', String(params.limit))
  return apiFetchPagina<UsuarioAdmin>(`/admin/usuarios?${query.toString()}`)
}

export function suspenderUsuario(id: string): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>(`/admin/usuarios/${id}/suspender`, { method: 'PATCH' })
}

export function reactivarUsuario(id: string): Promise<UsuarioAdmin> {
  return apiFetch<UsuarioAdmin>(`/admin/usuarios/${id}/reactivar`, { method: 'PATCH' })
}

export function eliminarUsuario(id: string): Promise<void> {
  return apiFetch<void>(`/admin/usuarios/${id}`, { method: 'DELETE' })
}
