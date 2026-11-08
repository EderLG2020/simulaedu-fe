import type { Idioma } from '../lib/tipos/idioma'
import { apiFetch } from './client'

interface OpcionesTraduccion {
  /** Por defecto, el otro idioma: en textos cortos DeepL puede detectar mal el origen ("occitano"). */
  origen?: Idioma
  /** true para textos HTML (enunciado, alternativas, explicacion): se conservan las etiquetas. */
  html?: boolean
}

/**
 * Traduce los textos con DeepL (en el backend, la clave nunca llega al navegador) y los devuelve en el
 * mismo orden. Los vacios vuelven tal cual y una lista vacia no hace ninguna llamada.
 */
export async function traducirTextos(textos: string[], destino: Idioma, { origen = destino === 'EN' ? 'ES' : 'EN', html = false }: OpcionesTraduccion = {}): Promise<string[]> {
  if (textos.every((texto) => texto.trim() === '')) return textos
  const respuesta = await apiFetch<{ textos: string[] }>('/traducciones', {
    method: 'POST',
    body: JSON.stringify({ textos, origen, destino, html }),
  })
  return respuesta.textos
}
