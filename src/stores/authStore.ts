import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '../api/authApi'

interface AuthState {
  accessToken: string | null
  usuario: Usuario | null
  setSesion: (accessToken: string, usuario: Usuario) => void
  cerrarSesion: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      usuario: null,
      setSesion: (accessToken, usuario) => set({ accessToken, usuario }),
      cerrarSesion: () => set({ accessToken: null, usuario: null }),
    }),
    { name: 'simulaedu-auth' },
  ),
)
