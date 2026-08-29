import { apiFetch } from './client'
import type { NavegacionExamen } from './examenesApi'

export type TipoPregunta = 'OPCION_UNICA' | 'OPCION_MULTIPLE' | 'EMPAREJAMIENTO' | 'DESARROLLO' | 'NUMERICA'
export type Dificultad = 'BAJA' | 'MEDIA' | 'ALTA'
export type EstadoSimulacro = 'EN_CURSO' | 'FINALIZADO' | 'FINALIZADO_POR_TIEMPO' | 'PAUSADO'
export type ModoSimulacro = 'EXAMEN_OFICIAL' | 'PRACTICA_LIBRE'

export interface AlternativaSimulacro {
  id: string
  textoHtml: string
  imagenUrl: string | null
  orden: number
}

export interface PreguntaSimulacro {
  respuestaSimulacroId: string
  preguntaId: string
  tipoPregunta: TipoPregunta
  dificultad: Dificultad
  enunciadoHtml: string
  metadataTipo: Record<string, unknown>
  tiempoSugeridoSeg: number | null
  alternativas: AlternativaSimulacro[]
  respuestaDada: Record<string, unknown>
  marcadaParaRevision: boolean
}

export interface SimulacroActual {
  id: string
  examenId: string
  timestampInicio: string
  timestampLimite: string
  estado: EstadoSimulacro
  modo: ModoSimulacro
  navegacion: NavegacionExamen
  permitePausa: boolean
  preguntas: PreguntaSimulacro[]
}

export interface TiempoRestante {
  segundosRestantes: number
  expirado: boolean
  estado: EstadoSimulacro
}

export interface DesglosePorTema {
  temaId: string
  temaNombre: string
  correctas: number
  incorrectas: number
  enBlanco: number
}

export interface ResumenSimulacro {
  simulacroId: string
  puntajeTotal: number
  tiempoUsadoSeg: number
  correctas: number
  incorrectas: number
  enBlanco: number
  desglosePorTema: DesglosePorTema[]
}

export function iniciarSimulacro(examenId: string, modo: ModoSimulacro): Promise<SimulacroActual> {
  return apiFetch<SimulacroActual>('/simulacros', {
    method: 'POST',
    body: JSON.stringify({ examenId, modo }),
  })
}

export function obtenerTiempoRestante(simulacroId: string): Promise<TiempoRestante> {
  return apiFetch<TiempoRestante>(`/simulacros/${simulacroId}/tiempo-restante`)
}

export function autoguardarRespuesta(
  simulacroId: string,
  respuestaId: string,
  respuestaDada: Record<string, unknown>,
): Promise<{ id: string; preguntaId: string; respuestaDada: Record<string, unknown> }> {
  return apiFetch(`/simulacros/${simulacroId}/respuestas/${respuestaId}`, {
    method: 'PATCH',
    body: JSON.stringify({ respuestaDada }),
  })
}

export function marcarParaRevision(
  simulacroId: string,
  respuestaId: string,
  marcada: boolean,
): Promise<{ respuestaSimulacroId: string; marcadaParaRevision: boolean }> {
  return apiFetch(`/simulacros/${simulacroId}/respuestas/${respuestaId}/marcar`, {
    method: 'PATCH',
    body: JSON.stringify({ marcada }),
  })
}

export function pausarSimulacro(simulacroId: string): Promise<SimulacroActual> {
  return apiFetch(`/simulacros/${simulacroId}/pausar`, { method: 'PATCH' })
}

export function reanudarSimulacro(simulacroId: string): Promise<SimulacroActual> {
  return apiFetch(`/simulacros/${simulacroId}/reanudar`, { method: 'PATCH' })
}

export function finalizarSimulacro(simulacroId: string): Promise<ResumenSimulacro> {
  return apiFetch(`/simulacros/${simulacroId}/finalizar`, { method: 'PATCH' })
}
