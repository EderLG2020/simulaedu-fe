import { create } from 'zustand'
import type { Usuario } from '../api/authApi'

/**
 * - `iniciando`: hay una sesion previa y se esta renovando con la cookie (al cargar la app).
 * - `autenticado`: hay access token en memoria.
 * - `anonimo`: no hay sesion.
 */
export type EstadoSesion = 'iniciando' | 'autenticado' | 'anonimo'

/** Marca en localStorage de que hubo login: evita llamar a /auth/refresh en visitas anonimas. No guarda ningun token. */
export const MARCA_SESION = 'simulaedu-sesion'

interface AuthState {
  /** Solo en memoria: nunca se persiste (el refresh token vive en una cookie httpOnly, ver lib/sesion.ts). */
  accessToken: string | null
  /** Epoch en ms en que vence el access token (claim `exp` del JWT). */
  expiraEn: number | null
  usuario: Usuario | null
  estado: EstadoSesion
  /** Cambios locales del store; para login/logout usar lib/sesion.ts (sincroniza pestanas y backend). */
  setSesion: (accessToken: string, usuario: Usuario) => void
  actualizarUsuario: (usuario: Usuario) => void
  cerrarSesion: () => void
  setEstado: (estado: EstadoSesion) => void
}

/** Lee el `exp` (segundos) del payload del JWT. El token no se valida aqui: eso lo hace el backend. */
export function expiracionDeToken(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload)) as { exp?: number }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

const habiaSesion = typeof localStorage !== 'undefined' && localStorage.getItem(MARCA_SESION) === '1'

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  expiraEn: null,
  usuario: null,
  estado: habiaSesion ? 'iniciando' : 'anonimo',
  setSesion: (accessToken, usuario) =>
    set({ accessToken, usuario, expiraEn: expiracionDeToken(accessToken), estado: 'autenticado' }),
  actualizarUsuario: (usuario) => set({ usuario }),
  cerrarSesion: () => set({ accessToken: null, expiraEn: null, usuario: null, estado: 'anonimo' }),
  setEstado: (estado) => set({ estado }),
}))
