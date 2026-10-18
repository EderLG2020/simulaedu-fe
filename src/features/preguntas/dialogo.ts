import type { LineaDialogo } from '../../api/preguntasApi'

// Mismos limites que valida el backend (GuionAudioDto / DialogoAudioService).
export const MAX_LINEAS = 20
export const MAX_CARACTERES_LINEA = 300
export const MAX_CARACTERES_DIALOGO = 2000

/** Devuelve por que el dialogo no se puede generar, o null si esta listo. */
export function problemaDelDialogo(lineas: LineaDialogo[]): string | null {
  if (lineas.length < 2) return 'El diálogo necesita al menos 2 líneas.'
  if (lineas.length > MAX_LINEAS) return `El diálogo puede tener hasta ${MAX_LINEAS} líneas.`
  if (lineas.some((l) => l.texto.trim() === '')) return 'Completa el texto de todas las líneas.'
  if (lineas.some((l) => l.texto.trim().length > MAX_CARACTERES_LINEA)) return `Cada línea puede tener hasta ${MAX_CARACTERES_LINEA} caracteres.`
  const total = lineas.reduce((suma, l) => suma + l.texto.trim().length, 0)
  if (total > MAX_CARACTERES_DIALOGO) return `El diálogo puede tener hasta ${MAX_CARACTERES_DIALOGO} caracteres en total (tiene ${total}).`
  return null
}
