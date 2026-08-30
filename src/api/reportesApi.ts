import { apiFetch } from './client'

export type TipoReporte = 'ALUMNO' | 'GRUPO' | 'COMPARATIVO'
export type FormatoReporte = 'PDF' | 'EXCEL'
export type EstadoReporte = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'FALLIDO'

export interface Reporte {
  id: string
  tipo: TipoReporte
  formato: FormatoReporte
  estado: EstadoReporte
  urlDescarga: string | null
  error: string | null
}

export interface SolicitarReporteInput {
  tipo: TipoReporte
  formato: FormatoReporte
  alumnoId?: string
  grupoId?: string
  grupoIds?: string[]
}

export function solicitarReporte(input: SolicitarReporteInput): Promise<Reporte> {
  return apiFetch<Reporte>('/reportes', { method: 'POST', body: JSON.stringify(input) })
}

export function obtenerReporte(id: string): Promise<Reporte> {
  return apiFetch<Reporte>(`/reportes/${id}`)
}
