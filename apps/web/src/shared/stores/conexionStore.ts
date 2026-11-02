import { create } from 'zustand'

/** Una peticion que tarda mas que esto marca la conexion como lenta. */
export const UMBRAL_LENTITUD_MS = 8_000

interface ConexionState {
  /** El navegador reporta que no hay red, o una peticion fallo por red. */
  sinConexion: boolean
  /** Peticiones en curso que ya superaron UMBRAL_LENTITUD_MS. */
  peticionesLentas: number
  setSinConexion: (sinConexion: boolean) => void
  sumarLenta: () => void
  restarLenta: () => void
}

export const useConexionStore = create<ConexionState>()((set) => ({
  sinConexion: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  peticionesLentas: 0,
  setSinConexion: (sinConexion) => set({ sinConexion }),
  sumarLenta: () => set((s) => ({ peticionesLentas: s.peticionesLentas + 1 })),
  restarLenta: () => set((s) => ({ peticionesLentas: Math.max(0, s.peticionesLentas - 1) })),
}))

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useConexionStore.getState().setSinConexion(false))
  window.addEventListener('offline', () => useConexionStore.getState().setSinConexion(true))
}
