import { useAuthStore } from '../stores/authStore'

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

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

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  })

  // Sesion vencida o token invalido: no tiene sentido conservar una sesion
  // que el backend ya no reconoce, se limpia para que la UI vuelva a /login.
  if (response.status === 401 && accessToken) {
    useAuthStore.getState().cerrarSesion()
  }

  // 204 No Content (ej. DELETE): no hay cuerpo que parsear como JSON.
  if (response.status === 204) {
    return undefined as T
  }

  const body = await response.json()

  if (!response.ok) {
    const { error } = body as ApiErrorEnvelope
    throw new ApiError(error.code, error.message, error.details)
  }

  return (body as ApiSuccessEnvelope<T>).data
}
