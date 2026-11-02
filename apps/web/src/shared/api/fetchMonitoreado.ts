import { UMBRAL_LENTITUD_MS, useConexionStore } from '../stores/conexionStore'

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
