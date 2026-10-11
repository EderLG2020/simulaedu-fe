import { apiFetch } from './client'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  emailVerificado: boolean
  universidadObjetivoId?: string | null
  /** RN-02: solo lo trae GET/PUT /usuarios/me; en login llega null (desconocido). */
  planLimitaUniversidades?: boolean | null
  /** V20: si el plan incluye los programas de idiomas y tecnologia. Mismo criterio de null. */
  planIncluyeProgramas?: boolean | null
  /** Foto de perfil (Cloudinary); null = se muestran las iniciales. */
  fotoUrl?: string | null
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  usuario: Usuario
}

export interface RegisterInput {
  nombre: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export function register(input: RegisterInput): Promise<Usuario> {
  return apiFetch<Usuario>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function loginConGoogle(code: string, redirectUri: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ code, redirectUri }),
  })
}

export interface MensajeResponse {
  mensaje: string
}

export function verificarEmail(token: string): Promise<MensajeResponse> {
  return apiFetch<MensajeResponse>('/auth/verificar-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export function reenviarVerificacion(email: string): Promise<MensajeResponse> {
  return apiFetch<MensajeResponse>('/auth/verificar-email/reenviar', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function recuperarPassword(email: string): Promise<MensajeResponse> {
  return apiFetch<MensajeResponse>('/auth/recuperar-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function restablecerPassword(token: string, nuevaPassword: string): Promise<MensajeResponse> {
  return apiFetch<MensajeResponse>('/auth/restablecer-password', {
    method: 'POST',
    body: JSON.stringify({ token, nuevaPassword }),
  })
}
