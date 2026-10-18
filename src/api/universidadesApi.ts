import { apiFetch } from './client'

/** Admision universitaria, o programas de idiomas / tecnologia (solo planes de pago). */
export type TipoPrograma = 'ADMISION' | 'IDIOMAS' | 'TECNOLOGIA'

export interface UniversidadResumen {
  id: string
  nombre: string
  siglas: string
  tipo: TipoPrograma
}

/** Catalogo de programas: las pantallas lo cachean con claves.universidades (staleTime ESTABLE). */
export function listarUniversidades(): Promise<UniversidadResumen[]> {
  return apiFetch<UniversidadResumen[]>('/universidades')
}
