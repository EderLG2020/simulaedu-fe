import { apiFetch } from './client'

export interface PreguntaTasaError {
  preguntaId: string
  enunciadoHtml: string
  tasaError: number
  totalRespuestas: number
}

export interface EstadisticasExamen {
  examenId: string
  totalIntentos: number
  puntajePromedio: number | null
  tiempoPromedioSeg: number | null
  preguntasConMayorTasaError: PreguntaTasaError[]
}

export interface TemaDebil {
  temaId: string
  temaNombre: string
  tasaAcierto: number
}

export interface ProgresoAlumno {
  alumnoId: string
  nombre: string
  totalIntentos: number
  puntajePromedio: number | null
  temasDebiles: TemaDebil[] | null
}

export interface EstadisticasGrupo {
  grupoId: string
  estadisticasAvanzadasDisponibles: boolean
  alumnos: ProgresoAlumno[]
}

export function obtenerEstadisticasExamen(examenId: string): Promise<EstadisticasExamen> {
  return apiFetch<EstadisticasExamen>(`/examenes/${examenId}/estadisticas`)
}

export function obtenerEstadisticasGrupo(grupoId: string): Promise<EstadisticasGrupo> {
  return apiFetch<EstadisticasGrupo>(`/grupos/${grupoId}/estadisticas`)
}
