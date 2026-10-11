import { renovarSesion, terminarSesionLocal, tokenPorVencer } from '../lib/sesion'
import { useAuthStore } from '../stores/authStore'
import { fetchMonitoreado } from '../stores/conexionStore'
import { API_BASE_URL } from './config'

export interface ApiErrorDetail {
  field: string
  message: string
}

export class ApiError extends Error {
  code: string
  details: ApiErrorDetail[]

  constructor(code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message)
    this.code = code
    this.details = details
  }
}

interface ApiSuccessEnvelope<T> {
  data: T
}

interface ApiErrorEnvelope {
  error: {
    code: string
    message: string
    details: ApiErrorDetail[]
  }
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiPageEnvelope<T> {
  data: T[]
  meta: PageMeta
}

/** Endpoints de /auth: llevan la cookie de sesion (credentials) y nunca disparan una renovacion. */
const esAuth = (path: string) => path.startsWith('/auth/')

async function enviar(path: string, options: RequestInit, puedeReintentar = true): Promise<Response> {
  // Renovacion preventiva: mejor renovar antes que mandar un token a punto de vencer. Si no
  // se puede (sin red, servidor lento), se sigue con el token actual, que aun es valido.
  if (!esAuth(path) && tokenPorVencer()) await renovarSesion().catch(() => null)
  const accessToken = useAuthStore.getState().accessToken

  const response = await fetchMonitoreado(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: esAuth(path) ? 'include' : 'same-origin',
    headers: {
      // Con FormData el navegador arma el Content-Type multipart (con su boundary) - no hay que pisarlo.
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  })

  // Token vencido o rechazado: se renueva con la cookie y se reintenta UNA vez. Si la
  // renovacion falla, renovarSesion ya cerro la sesion (la UI vuelve a /login).
  if (response.status === 401 && accessToken && !esAuth(path)) {
    if (puedeReintentar && (await renovarSesion())) return enviar(path, options, false)
    if (!puedeReintentar) terminarSesionLocal()
  }
  return response
}

/** Para endpoints que devuelven un archivo (ej. plantillas) en vez del envelope JSON. */
export async function apiFetchArchivo(path: string): Promise<Blob> {
  const response = await enviar(path, {})
  if (!response.ok) {
    const { error } = (await response.json()) as ApiErrorEnvelope
    throw new ApiError(error.code, error.message, error.details)
  }
  return response.blob()
}

async function realizarPeticion(path: string, options: RequestInit): Promise<unknown> {
  const response = await enviar(path, options)

  // 204 No Content (ej. DELETE): no hay cuerpo que parsear como JSON.
  if (response.status === 204) {
    return undefined
  }

  const body = await response.json()

  if (!response.ok) {
    const { error } = body as ApiErrorEnvelope
    throw new ApiError(error.code, error.message, error.details)
  }

  return body
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const body = await realizarPeticion(path, options)
  if (body === undefined) return undefined as T
  return (body as ApiSuccessEnvelope<T>).data
}

/** Para endpoints paginados (ApiPageResponse en el backend) - conserva `meta` en vez de devolver solo `data`. */
export async function apiFetchPagina<T>(path: string, options: RequestInit = {}): Promise<ApiPageEnvelope<T>> {
  const body = await realizarPeticion(path, options)
  return body as ApiPageEnvelope<T>
}
