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

/**
 * fetch que informa el estado de la conexion: marca "sin conexion" si falla por red,
 * "lenta" mientras supera el umbral, y vuelve a "conectado" con cualquier respuesta.
 */
export async function fetchMonitoreado(url: string, init?: RequestInit): Promise<Response> {
  const store = useConexionStore.getState()
  let lenta = false
  const temporizador = setTimeout(() => {
    lenta = true
    store.sumarLenta()
  }, UMBRAL_LENTITUD_MS)
  try {
    const respuesta = await fetch(url, init)
    store.setSinConexion(false)
    return respuesta
  } catch (err) {
    if (err instanceof TypeError) store.setSinConexion(true)
    throw err
  } finally {
    clearTimeout(temporizador)
    if (lenta) store.restarLenta()
  }
}
