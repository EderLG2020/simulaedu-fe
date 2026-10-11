/**
 * Cache simple en memoria para peticiones GET de datos que casi no cambian
 * durante una sesion (universidades, examenes publicados). Evita volver a
 * pedirle al backend lo mismo cuando el usuario navega entre pantallas que
 * comparten esos datos (ej. elegir universidad -> asignaturas de esa universidad).
 */
const cache = new Map<string, Promise<unknown>>()

export function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existente = cache.get(key)
  if (existente) return existente as Promise<T>

  const promesa = fetcher().catch((err) => {
    cache.delete(key)
    throw err
  })
  cache.set(key, promesa)
  return promesa
}

/** Descarta una entrada (o todo el cache) para forzar que la proxima llamada vuelva a pedir al backend. */
export function invalidarCache(key?: string): void {
  if (key) cache.delete(key)
  else cache.clear()
}
