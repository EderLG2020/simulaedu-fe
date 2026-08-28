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
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const body = await response.json()

  if (!response.ok) {
    const { error } = body as ApiErrorEnvelope
    throw new ApiError(error.code, error.message, error.details)
  }

  return (body as ApiSuccessEnvelope<T>).data
}
