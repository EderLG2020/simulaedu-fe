import { apiFetch } from './client'

export type TipoInstitucion = 'ACADEMIA' | 'COLEGIO'

export interface InstitucionAdmin {
  id: string
  nombre: string
  tipo: TipoInstitucion
  licenciasTotales: number
  licenciasUsadas: number
  licenciasDisponibles: number
}

export interface InstitucionAdminRequest {
  nombre: string
  tipo: TipoInstitucion
}

export function listarInstituciones(): Promise<InstitucionAdmin[]> {
  return apiFetch<InstitucionAdmin[]>('/admin/instituciones')
}

export function crearInstitucion(request: InstitucionAdminRequest): Promise<InstitucionAdmin> {
  return apiFetch<InstitucionAdmin>('/admin/instituciones', { method: 'POST', body: JSON.stringify(request) })
}

export function actualizarInstitucion(id: string, request: InstitucionAdminRequest): Promise<InstitucionAdmin> {
  return apiFetch<InstitucionAdmin>(`/admin/instituciones/${id}`, { method: 'PUT', body: JSON.stringify(request) })
}

export function asignarLicencias(id: string, licenciasTotales: number): Promise<InstitucionAdmin> {
  return apiFetch<InstitucionAdmin>(`/admin/instituciones/${id}/licencias`, {
    method: 'PATCH',
    body: JSON.stringify({ licenciasTotales }),
  })
}
