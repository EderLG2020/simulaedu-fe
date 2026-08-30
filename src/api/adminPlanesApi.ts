import { apiFetch } from './client'

export type TipoPlan = 'ESTUDIANTE' | 'DOCENTE' | 'INSTITUCION'

export interface PlanAdmin {
  id: string
  nombre: string
  tipo: TipoPlan
  tier: string
  precioMensual: number
  simulacrosPorMes: number | null
  universidadesMax: number | null
  alumnosMax: number | null
  gruposMax: number | null
  rankingHabilitado: boolean
  estadisticasAvanzadas: boolean
  reportesDescargables: boolean
}

export interface PlanCrearRequest {
  nombre: string
  tipo: TipoPlan
  tier: string
  precioMensual: number
  simulacrosPorMes: number | null
  universidadesMax: number | null
  alumnosMax: number | null
  gruposMax: number | null
  rankingHabilitado: boolean
  estadisticasAvanzadas: boolean
  reportesDescargables: boolean
}

/** RF-33: tipo/tier no son editables tras crear el plan (ver com.simulaedu.admin.dto.PlanActualizarRequest). */
export type PlanActualizarRequest = Omit<PlanCrearRequest, 'tipo' | 'tier'>

export function listarPlanes(tipo?: TipoPlan): Promise<PlanAdmin[]> {
  const query = tipo === undefined ? '' : `?tipo=${tipo}`
  return apiFetch<PlanAdmin[]>(`/admin/planes${query}`)
}

export function crearPlan(request: PlanCrearRequest): Promise<PlanAdmin> {
  return apiFetch<PlanAdmin>('/admin/planes', { method: 'POST', body: JSON.stringify(request) })
}

export function actualizarPlan(id: string, request: PlanActualizarRequest): Promise<PlanAdmin> {
  return apiFetch<PlanAdmin>(`/admin/planes/${id}`, { method: 'PUT', body: JSON.stringify(request) })
}

export function eliminarPlan(id: string): Promise<void> {
  return apiFetch<void>(`/admin/planes/${id}`, { method: 'DELETE' })
}
