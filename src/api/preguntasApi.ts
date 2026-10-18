import { ApiError, apiFetch, apiFetchArchivo, apiFetchPagina, type ApiPageEnvelope } from './client'

export type TipoPregunta = 'OPCION_UNICA' | 'OPCION_MULTIPLE' | 'EMPAREJAMIENTO' | 'DESARROLLO' | 'NUMERICA'
export type Dificultad = 'BAJA' | 'MEDIA' | 'ALTA'
export type EstadoPregunta = 'BORRADOR' | 'APROBADA' | 'PUBLICADA'

export interface Alternativa {
  id: string
  textoHtml: string
  imagenUrl: string | null
  esCorrecta: boolean
  orden: number
}

export interface AlternativaRequest {
  textoHtml: string
  imagenUrl?: string | null
  esCorrecta: boolean
  orden: number
}

export type Acento = 'en-US' | 'en-GB'
export type Velocidad = 'lenta' | 'normal'
export type Hablante = 'A' | 'B'

export interface LineaDialogo {
  hablante: Hablante
  texto: string
}

/** Listening: guion de un dialogo; al guardar la pregunta lleva tambien el audio generado. */
export interface GuionAudio {
  acento: Acento
  velocidad: Velocidad
  lineas: LineaDialogo[]
  audioUrl?: string | null
}

export interface Pregunta {
  id: string
  temaId: string
  autorDocenteId: string | null
  tipoPregunta: TipoPregunta
  dificultad: Dificultad
  enunciadoHtml: string
  metadataTipo: Record<string, unknown>
  version: number
  estado: EstadoPregunta
  tiempoSugeridoSeg: number | null
  alternativas: Alternativa[]
  universidadesObjetivoIds: string[]
  preguntaAnteriorId: string | null
  guionAudio: GuionAudio | null
}

export interface PreguntaRequest {
  temaId: string
  tipoPregunta: TipoPregunta
  dificultad: Dificultad
  enunciadoHtml: string
  tiempoSugeridoSeg?: number | null
  metadataTipo?: Record<string, unknown>
  alternativas?: AlternativaRequest[]
  universidadesObjetivoIds?: string[]
  guionAudio?: GuionAudio | null
}

export interface ListarPreguntasParams {
  temaId?: string
  dificultad?: Dificultad
  estado?: EstadoPregunta
  autorDocenteId?: string
  page: number
  limit: number
}

export function listarPreguntas(params: ListarPreguntasParams): Promise<ApiPageEnvelope<Pregunta>> {
  const query = new URLSearchParams()
  if (params.temaId) query.set('temaId', params.temaId)
  if (params.dificultad) query.set('dificultad', params.dificultad)
  if (params.estado) query.set('estado', params.estado)
  if (params.autorDocenteId) query.set('autorDocenteId', params.autorDocenteId)
  query.set('page', String(params.page))
  query.set('limit', String(params.limit))
  return apiFetchPagina<Pregunta>(`/preguntas?${query.toString()}`)
}

export function obtenerPregunta(id: string): Promise<Pregunta> {
  return apiFetch<Pregunta>(`/preguntas/${id}`)
}

export function crearPregunta(request: PreguntaRequest): Promise<Pregunta> {
  return apiFetch<Pregunta>('/preguntas', { method: 'POST', body: JSON.stringify(request) })
}

export function actualizarPregunta(id: string, request: PreguntaRequest): Promise<Pregunta> {
  return apiFetch<Pregunta>(`/preguntas/${id}`, { method: 'PUT', body: JSON.stringify(request) })
}

export function duplicarPregunta(id: string): Promise<Pregunta> {
  return apiFetch<Pregunta>(`/preguntas/${id}/duplicar`, { method: 'POST' })
}

export function aprobarPregunta(id: string): Promise<Pregunta> {
  return apiFetch<Pregunta>(`/preguntas/${id}/aprobar`, { method: 'PATCH' })
}

export function publicarPregunta(id: string): Promise<Pregunta> {
  return apiFetch<Pregunta>(`/preguntas/${id}/publicar`, { method: 'PATCH' })
}

export function eliminarPregunta(id: string): Promise<void> {
  return apiFetch<void>(`/preguntas/${id}`, { method: 'DELETE' })
}

/** Listening: genera con voz sintetica (Azure, en el backend) el audio del dialogo y devuelve su URL. */
export async function generarAudioDialogo(guion: GuionAudio): Promise<string> {
  const { audioUrl } = await apiFetch<{ audioUrl: string }>('/preguntas/audio-dialogo', {
    method: 'POST',
    body: JSON.stringify({ acento: guion.acento, velocidad: guion.velocidad, lineas: guion.lineas }),
  })
  return audioUrl
}

interface UrlSubidaImagen {
  urlSubida: string
  apiKey: string
  timestamp: number
  carpeta: string
  firma: string
}

/**
 * RF-41: el backend solo firma la subida (nunca ve los bytes) - el archivo
 * se sube directo a Cloudinary con esos datos, y se guarda la `secure_url`
 * que Cloudinary devuelve. Sirve para imagenes y para audio (listening): el
 * backend devuelve la URL de subida que corresponde a cada tipo.
 */
export async function subirArchivoPregunta(archivo: File): Promise<string> {
  const firma = await apiFetch<UrlSubidaImagen>('/preguntas/imagenes', {
    method: 'POST',
    body: JSON.stringify({ tipoContenido: archivo.type }),
  })

  const formData = new FormData()
  formData.append('file', archivo)
  formData.append('api_key', firma.apiKey)
  formData.append('timestamp', String(firma.timestamp))
  formData.append('folder', firma.carpeta)
  formData.append('signature', firma.firma)

  const respuesta = await fetch(firma.urlSubida, { method: 'POST', body: formData })
  if (!respuesta.ok) {
    throw new ApiError('SUBIDA_FALLIDA', 'No se pudo subir el archivo a Cloudinary.')
  }
  const resultado = (await respuesta.json()) as { secure_url: string }
  return resultado.secure_url
}

/** Mismo flujo que [subirArchivoPregunta]; se conserva el nombre para las imagenes de alternativas. */
export const subirImagenPregunta = subirArchivoPregunta

export interface ErrorFilaImportacion {
  /** Fila del CSV tal como se ve en Excel (el encabezado es la fila 1). */
  fila: number
  mensaje: string
}

export interface ResultadoImportacion {
  totalFilas: number
  creadas: number
  preguntaIds: string[]
  errores: ErrorFilaImportacion[]
}

/** RF-24: importa un `.csv` (solo texto) o un `.zip` (CSV + imagenes referenciadas por nombre). */
export function importarPreguntasArchivo(archivo: File): Promise<ResultadoImportacion> {
  const formData = new FormData()
  formData.append('archivo', archivo)
  return apiFetch<ResultadoImportacion>('/preguntas/importar-archivo', { method: 'POST', body: formData })
}

export function descargarPlantillaImportacion(): Promise<Blob> {
  return apiFetchArchivo('/preguntas/importar-archivo/plantilla')
}
