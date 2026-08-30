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

/** Examenes publicados propios de un docente - para elegir cual asignarle a un grupo. */
export function listarMisExamenesPublicados(autorId: string): Promise<ExamenResumen[]> {
  return apiFetch<ExamenResumen[]>(`/examenes?estado=PUBLICADO&autorId=${autorId}&limit=50`)
}
