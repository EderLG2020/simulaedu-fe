import { queryClient } from '../lib/queryClient'
import type { ReglasCalificacion } from '../lib/reglasCalificacion'
import { claves } from './claves'
import { apiFetch, apiFetchPagina, todasLasPaginas, type ApiPageEnvelope } from './client'

export type TipoSeleccion = 'FIJA' | 'ALEATORIA_POR_AREA'
export type EstadoExamen = 'BORRADOR' | 'PUBLICADO'
export type NavegacionExamen = 'LIBRE' | 'SECUENCIAL'
/** Como lo ve el alumno: practica de un tema concreto o simulacro que mezcla todo el programa. */
export type TipoExamen = 'PRACTICA_TEMA' | 'SIMULACRO_COMPLETO'

export type DificultadObjetivo = 'BAJA' | 'MEDIA' | 'ALTA' | 'MIXTA'

export interface ExamenArea {
  id: string
  cursoId: string
  cursoNombre: string
  temaId: string | null
  cantidadPreguntas: number
  dificultadObjetivo: DificultadObjetivo
  puntajeAsignado: number
}

/** temaId/temaNombre en null: un area de "todo el curso". */
export interface TemaCubierto {
  cursoId: string
  cursoNombre: string
  /** Icono de Material Symbols del curso; mostrarlo con iconoDeCurso() (lib/iconosCurso). */
  cursoIcono: string
  temaId: string | null
  temaNombre: string | null
}

export type { ReglasCalificacion } from '../lib/reglasCalificacion'

export interface ExamenPregunta {
  preguntaId: string
  orden: number
  puntajeAsignado: number
}

export interface ExamenResumen {
  id: string
  universidadId: string
  universidadNombre: string
  autorId: string | null
  nombre: string
  duracionSeg: number
  permitePausa: boolean
  puntajeTotal: number
  tipoSeleccion: TipoSeleccion
  reglasCalificacion: ReglasCalificacion
  navegacion: NavegacionExamen
  estado: EstadoExamen
  preguntas: ExamenPregunta[]
  areas: ExamenArea[]
  /** Si iniciar un simulacro hoy tendria preguntas (fijo con preguntas, o cada area con suficientes publicadas). */
  disponible: boolean
  tipo: TipoExamen
  descripcion: string | null
  /** Calculado por el backend: temas de las areas o de las preguntas fijas, sin repetir. */
  temasCubiertos: TemaCubierto[]
  /** Calculado por el backend: suma de las areas o cantidad de preguntas fijas. */
  cantidadPreguntas: number
}

export interface ExamenRequest {
  universidadId: string
  nombre: string
  duracionSeg: number
  permitePausa?: boolean
  puntajeTotal?: number
  tipoSeleccion: TipoSeleccion
  reglasCalificacion?: Record<string, unknown>
  navegacion?: NavegacionExamen
  tipo?: TipoExamen
  descripcion?: string | null
}

export interface ListarExamenesParams {
  estado?: EstadoExamen
  universidadId?: string
  autorId?: string
  page: number
  limit: number
}

export interface ExamenPreguntaItem {
  preguntaId: string
  orden: number
  puntajeAsignado: number
}

export interface ExamenAreaItem {
  cursoId: string
  temaId?: string | null
  cantidadPreguntas: number
  dificultadObjetivo: DificultadObjetivo
  puntajeAsignado: number
}

/** Todos los examenes publicados (home y elegir programa). Se cachea con claves.examenes.publicados. */
export function listarExamenesPublicados(): Promise<ExamenResumen[]> {
  return todasLasPaginas<ExamenResumen>('/examenes?estado=PUBLICADO')
}

/** Examenes publicados propios de un docente - para elegir cual asignarle a un grupo. */
export function listarMisExamenesPublicados(autorId: string): Promise<ExamenResumen[]> {
  return todasLasPaginas<ExamenResumen>(`/examenes?estado=PUBLICADO&autorId=${autorId}`)
}

/** Todos los examenes publicados de una universidad: la pagina del alumno busca y pagina en el navegador. */
export function listarExamenesPorUniversidad(universidadId: string): Promise<ExamenResumen[]> {
  return todasLasPaginas<ExamenResumen>(`/examenes?estado=PUBLICADO&universidadId=${universidadId}`)
}

/** Panel de gestion: respeta visibilidad del backend (un docente ve sus propios borradores + todos los publicados; admin ve todo). */
export function listarExamenes(params: ListarExamenesParams): Promise<ApiPageEnvelope<ExamenResumen>> {
  const query = new URLSearchParams()
  if (params.estado) query.set('estado', params.estado)
  if (params.universidadId) query.set('universidadId', params.universidadId)
  if (params.autorId) query.set('autorId', params.autorId)
  query.set('page', String(params.page))
  query.set('limit', String(params.limit))
  return apiFetchPagina<ExamenResumen>(`/examenes?${query.toString()}`)
}

/** Un examen nuevo o recien publicado cambia todas las listas de examenes cacheadas. */
function invalidarCacheExamenes() {
  void queryClient.invalidateQueries({ queryKey: claves.examenes.todos })
}

export function crearExamen(request: ExamenRequest): Promise<ExamenResumen> {
  return apiFetch<ExamenResumen>('/examenes', { method: 'POST', body: JSON.stringify(request) }).then((r) => {
    invalidarCacheExamenes()
    return r
  })
}

export function actualizarExamen(id: string, request: ExamenRequest): Promise<ExamenResumen> {
  return apiFetch<ExamenResumen>(`/examenes/${id}`, { method: 'PUT', body: JSON.stringify(request) })
}

export function componerExamenFijo(id: string, preguntas: ExamenPreguntaItem[]): Promise<ExamenResumen> {
  return apiFetch<ExamenResumen>(`/examenes/${id}/preguntas`, { method: 'PUT', body: JSON.stringify({ preguntas }) })
}

export function componerExamenAreas(id: string, areas: ExamenAreaItem[]): Promise<ExamenResumen> {
  return apiFetch<ExamenResumen>(`/examenes/${id}/areas`, { method: 'PUT', body: JSON.stringify({ areas }) })
}

export function publicarExamen(id: string): Promise<ExamenResumen> {
  return apiFetch<ExamenResumen>(`/examenes/${id}/publicar`, { method: 'PATCH' }).then((r) => {
    invalidarCacheExamenes()
    return r
  })
}

export function obtenerExamen(id: string): Promise<ExamenResumen> {
  return apiFetch<ExamenResumen>(`/examenes/${id}`)
}
