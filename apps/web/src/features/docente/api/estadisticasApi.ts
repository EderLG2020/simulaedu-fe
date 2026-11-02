import { apiFetch } from '../../../shared/api/client'

interface PreguntaTasaError {
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

interface TemaDebil {
  temaId: string
  temaNombre: string
  tasaAcierto: number
}

interface ProgresoAlumno {
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
