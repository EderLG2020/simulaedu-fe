import { apiFetch } from './client'

export type AmbitoRanking = 'GLOBAL' | 'UNIVERSIDAD' | 'EXAMEN' | 'INSTITUCION'
export type PeriodoRanking = 'SEMANAL' | 'MENSUAL' | 'HISTORICO'

export interface RankingEntrada {
  usuarioId: string
  nombre: string
  posicion: number
  puntajeReferencia: number
  esUsuarioActual: boolean
}

export interface Ranking {
  ambito: AmbitoRanking
  referenciaId: string | null
  periodo: PeriodoRanking
  fechaPeriodo: string
  entradas: RankingEntrada[]
  /** Null si el alumno no tiene entrada en este corte (no rindio un examen oficial en el ambito/periodo). */
  posicionUsuarioActual: number | null
}

/**
 * Codigo del error (422) cuando el plan no incluye ranking (RN-03: Free). La pantalla se fija en
 * el codigo, nunca en el status HTTP.
 */
export const ERROR_RANKING_SIN_ACCESO = 'RANKING_SIN_ACCESO'

/**
 * RF-15 a RF-18. El backend lo recalcula en segundo plano (job diario), no al terminar cada
 * simulacro: un examen recien rendido puede tardar en aparecer.
 */
export function obtenerRanking(ambito: AmbitoRanking, periodo: PeriodoRanking, referenciaId?: string | null): Promise<Ranking> {
  const query = new URLSearchParams({ ambito, periodo })
  if (referenciaId) query.set('referenciaId', referenciaId)
  return apiFetch<Ranking>(`/ranking?${query.toString()}`)
}
