/** Reparte `total` puntos enteros entre `cantidad` elementos; el sobrante va a los primeros para que la suma cuadre exacto (RN-06). */
export function repartirEquitativamente(total: number, cantidad: number): number[] {
  if (cantidad <= 0) return []
  const base = Math.floor(total / cantidad)
  const sobrante = total - base * cantidad
  return Array.from({ length: cantidad }, (_, i) => base + (i < sobrante ? 1 : 0))
}

/** Mueve el elemento en `indice` una posicion (`-1` arriba, `1` abajo). Fuera de rango devuelve la misma lista. */
export function moverElemento<T>(lista: T[], indice: number, direccion: -1 | 1): T[] {
  const destino = indice + direccion
  if (destino < 0 || destino >= lista.length) return lista
  const copia = [...lista]
  ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
  return copia
}
