import { apiFetch } from './client'

export interface UsuariosActivos {
  total: number
  estudiantes: number
  docentes: number
}

export interface ConversionFreePremium {
  totalEstudiantesConSuscripcion: number
  estudiantesPremium: number
  tasa: number | null
}

export interface IngresoPorPlan {
  planId: string
  planNombre: string
  total: number
}

export interface ReporteGlobal {
  desde: string | null
  hasta: string | null
  usuariosActivos: UsuariosActivos
  simulacrosRendidos: number
  conversionFreePremium: ConversionFreePremium
  ingresosPorPlan: IngresoPorPlan[]
}

export interface ReporteGlobalParams {
  desde?: string
  hasta?: string
}

export function generarReporteGlobal(params: ReporteGlobalParams): Promise<ReporteGlobal> {
  const query = new URLSearchParams()
  if (params.desde) query.set('desde', params.desde)
  if (params.hasta) query.set('hasta', params.hasta)
  const queryString = query.toString()
  return apiFetch<ReporteGlobal>(`/admin/reportes/globales${queryString ? `?${queryString}` : ''}`)
}
