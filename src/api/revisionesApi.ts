import { apiFetch } from './client'

export interface RevisionPendiente {
  respuestaSimulacroId: string
  simulacroId: string
  examenId: string
  examenNombre: string
  preguntaId: string
  enunciadoHtml: string
  respuestaDada: Record<string, unknown>
  alumnoId: string
  alumnoNombre: string
  puntajeMaximo: number
}

export interface RevisionCalificada {
  respuestaSimulacroId: string
  puntajeObtenido: number
  esCorrecta: boolean
}

export function listarRevisionesPendientes(): Promise<RevisionPendiente[]> {
  return apiFetch<RevisionPendiente[]>('/revisiones/pendientes')
}

export function calificarRevision(respuestaSimulacroId: string, puntajeObtenido: number): Promise<RevisionCalificada> {
  return apiFetch<RevisionCalificada>(`/revisiones/${respuestaSimulacroId}`, {
    method: 'PATCH',
    body: JSON.stringify({ puntajeObtenido }),
  })
}
