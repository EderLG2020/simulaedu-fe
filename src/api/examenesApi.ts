import { apiFetch } from './client'

export type TipoSeleccion = 'FIJA' | 'ALEATORIA_POR_AREA'
export type EstadoExamen = 'BORRADOR' | 'PUBLICADO'
export type NavegacionExamen = 'LIBRE' | 'SECUENCIAL'

export interface ExamenResumen {
  id: string
  universidadId: string
  autorId: string | null
  nombre: string
  duracionSeg: number
  permitePausa: boolean
  puntajeTotal: number
  tipoSeleccion: TipoSeleccion
  navegacion: NavegacionExamen
  estado: EstadoExamen
}

/** El envelope de paginacion ya trae `data` como arreglo - apiFetch lo devuelve tal cual. */
export function listarExamenesPublicados(): Promise<ExamenResumen[]> {
  return apiFetch<ExamenResumen[]>('/examenes?estado=PUBLICADO&limit=50')
}
