import { queryClient } from '../lib/queryClient'
import { claves } from './claves'
import { apiFetch, apiFetchPagina, type ApiPageEnvelope } from './client'
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
  /** Listening: escuchas del audio que quedan (simulacro completo, maximo 2). null = sin limite. */
  escuchasRestantes: number | null
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

/** Listening: registra una reproduccion del audio de la pregunta antes de reproducirlo. */
export function registrarEscucha(simulacroId: string, respuestaId: string): Promise<{ escuchasRestantes: number | null }> {
  return apiFetch(`/simulacros/${simulacroId}/respuestas/${respuestaId}/escuchas`, { method: 'POST' })
}

export function pausarSimulacro(simulacroId: string): Promise<SimulacroActual> {
  return apiFetch(`/simulacros/${simulacroId}/pausar`, { method: 'PATCH' })
}

export function reanudarSimulacro(simulacroId: string): Promise<SimulacroActual> {
  return apiFetch(`/simulacros/${simulacroId}/reanudar`, { method: 'PATCH' })
}

/** Un simulacro terminado cambia el historial y puede generar un aviso (limite del plan Free). */
export async function finalizarSimulacro(simulacroId: string): Promise<ResumenSimulacro> {
  const resumen = await apiFetch<ResumenSimulacro>(`/simulacros/${simulacroId}/finalizar`, { method: 'PATCH' })
  void queryClient.invalidateQueries({ queryKey: claves.historialTodo })
  void queryClient.invalidateQueries({ queryKey: claves.noLeidas })
  return resumen
}

export interface HistorialSimulacro {
  simulacroId: string
  examenNombre: string
  universidadNombre: string
  fecha: string | null
  puntajeTotal: number
  estado: EstadoSimulacro
}

/**
 * RN-08: el plan Free siempre recibe un solo item (el backend ignora `page`
 * y fuerza tamano 1), aunque `meta.total`/`totalPages` reflejen el total real.
 */
export function listarHistorial(page: number, limit: number): Promise<ApiPageEnvelope<HistorialSimulacro>> {
  return apiFetchPagina<HistorialSimulacro>(`/simulacros/historial?page=${page}&limit=${limit}`)
}
