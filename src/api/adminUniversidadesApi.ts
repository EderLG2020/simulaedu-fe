import { apiFetch } from './client'
import type { ReglasCalificacion } from '../lib/reglasCalificacion'
import type { TipoPrograma } from './universidadesApi'
import { invalidarCache } from '../lib/requestCache'

export interface UniversidadAdmin {
  id: string
  nombre: string
  siglas: string
  reglasCalificacion: ReglasCalificacion
  activo: boolean
  tipo: TipoPrograma
  examenesPublicados: number
  examenesBorrador: number
  /** Preguntas etiquetadas para esta universidad. */
  preguntas: number
}

export interface UniversidadAdminRequest {
  nombre: string
  siglas: string
  reglasCalificacion: ReglasCalificacion
  tipo: TipoPrograma
}

/** Cada cambio descarta el catalogo publico cacheado por universidadesApi.listarUniversidades. */
async function mutar(peticion: Promise<UniversidadAdmin>): Promise<UniversidadAdmin> {
  const resultado = await peticion
  invalidarCache('universidades')
  return resultado
}

export function listarUniversidades(activo?: boolean): Promise<UniversidadAdmin[]> {
  const query = activo === undefined ? '' : `?activo=${activo}`
  return apiFetch<UniversidadAdmin[]>(`/admin/universidades${query}`)
}

export function crearUniversidad(request: UniversidadAdminRequest): Promise<UniversidadAdmin> {
  return mutar(
    apiFetch<UniversidadAdmin>('/admin/universidades', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
  )
}

export function actualizarUniversidad(id: string, request: UniversidadAdminRequest): Promise<UniversidadAdmin> {
  return mutar(
    apiFetch<UniversidadAdmin>(`/admin/universidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }),
  )
}

export function desactivarUniversidad(id: string): Promise<UniversidadAdmin> {
  return mutar(apiFetch<UniversidadAdmin>(`/admin/universidades/${id}/desactivar`, { method: 'PATCH' }))
}

export function activarUniversidad(id: string): Promise<UniversidadAdmin> {
  return mutar(apiFetch<UniversidadAdmin>(`/admin/universidades/${id}/activar`, { method: 'PATCH' }))
}
