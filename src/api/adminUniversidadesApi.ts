import { apiFetch } from './client'

export interface UniversidadAdmin {
  id: string
  nombre: string
  siglas: string
  reglasCalificacion: Record<string, unknown>
  activo: boolean
}

export interface UniversidadAdminRequest {
  nombre: string
  siglas: string
  reglasCalificacion: Record<string, unknown>
}

export function listarUniversidades(activo?: boolean): Promise<UniversidadAdmin[]> {
  const query = activo === undefined ? '' : `?activo=${activo}`
  return apiFetch<UniversidadAdmin[]>(`/admin/universidades${query}`)
}

export function crearUniversidad(request: UniversidadAdminRequest): Promise<UniversidadAdmin> {
  return apiFetch<UniversidadAdmin>('/admin/universidades', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function actualizarUniversidad(id: string, request: UniversidadAdminRequest): Promise<UniversidadAdmin> {
  return apiFetch<UniversidadAdmin>(`/admin/universidades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export function desactivarUniversidad(id: string): Promise<UniversidadAdmin> {
  return apiFetch<UniversidadAdmin>(`/admin/universidades/${id}/desactivar`, { method: 'PATCH' })
}

export function activarUniversidad(id: string): Promise<UniversidadAdmin> {
  return apiFetch<UniversidadAdmin>(`/admin/universidades/${id}/activar`, { method: 'PATCH' })
}
