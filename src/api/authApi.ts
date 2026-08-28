import { apiFetch } from './client'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  emailVerificado: boolean
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
