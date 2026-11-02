import { apiFetch } from './client'
import type { TipoPrograma } from '../lib/tipos/programa'

/** Definido en lib/ para que stores/ y lib/ lo usen sin depender de api/. */
export type { TipoPrograma }

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
