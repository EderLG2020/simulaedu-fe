import { apiFetch } from './client'

export interface LandingEstadisticas {
  simulacrosRendidos: number
  postulantesRegistrados: number
  universidades: number
  preguntasBanco: number
}

export function obtenerEstadisticasLanding(): Promise<LandingEstadisticas> {
  return apiFetch<LandingEstadisticas>('/landing/estadisticas')
}
