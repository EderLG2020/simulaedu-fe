import { apiFetch } from './client'
import { cachedFetch } from '../lib/requestCache'

/** Admision universitaria, o programas de idiomas / tecnologia (solo planes de pago). */
export type TipoPrograma = 'ADMISION' | 'IDIOMAS' | 'TECNOLOGIA'

export interface UniversidadResumen {
  id: string
  nombre: string
  siglas: string
  tipo: TipoPrograma
}

/** La lista de universidades casi no cambia en una sesion - se cachea para no volver a pedirla en cada pantalla. */
export function listarUniversidades(): Promise<UniversidadResumen[]> {
  return cachedFetch('universidades', () => apiFetch<UniversidadResumen[]>('/universidades'))
}
