import type { AlternativaSimulacro, PreguntaSimulacro } from '../../api/simulacrosApi'
import { formatearDuracion } from '../../lib/formato'

const dosDigitos = (n: number) => Math.floor(n).toString().padStart(2, '0')

/** Cronometro: mm:ss, o h:mm:ss en examenes de mas de una hora (los de admision duran hasta 3h). */
export function formatearTiempo(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  return h > 0 ? `${h}:${dosDigitos(m)}:${dosDigitos(s)}` : `${dosDigitos(m)}:${dosDigitos(s)}`
}

/** Tiempo usado/ritmo en el resultado: "48m 12s", "40s", "1h 02m". */
export function formatearDuracionLarga(segundos: number): string {
  const total = Math.round(segundos)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${dosDigitos(m)}m`
  if (m > 0) return `${m}m ${dosDigitos(s)}s`
  return `${s}s`
}

/** Tiempo sugerido de una pregunta: "45 s" si es menos de un minuto, si no "30 min" / "1h 15min". */
export function formatearTiempoSugerido(segundos: number): string {
  return segundos < 60 ? `${segundos} s` : formatearDuracion(segundos)
}

export function formatearPuntos(puntos: number): string {
  return Number.isInteger(puntos) ? String(puntos) : puntos.toFixed(2)
}

/** Mismo criterio que CalculadoraPuntajeService.estaEnBlanco en el backend. */
export function tieneRespuesta(respuestaDada: Record<string, unknown>): boolean {
  const valores = Object.values(respuestaDada)
  return valores.length > 0 && valores.some((v) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))
}

/** Alternativas en el orden que definio el docente - el atajo de teclado A-E usa este mismo orden. */
export function alternativasOrdenadas(pregunta: PreguntaSimulacro): AlternativaSimulacro[] {
  return [...pregunta.alternativas].sort((a, b) => a.orden - b.orden)
}

/**
 * Listening en simulacro completo: saca los `<audio>` del enunciado (ya sanitizado) para mostrarlos
 * con el reproductor limitado en vez del nativo. Devuelve el HTML sin ellos y sus URLs; un `<p>` que
 * quede vacio tambien se quita.
 */
export function separarAudios(html: string): { html: string; audios: string[] } {
  const documento = new DOMParser().parseFromString(html, 'text/html')
  const audios: string[] = []
  documento.body.querySelectorAll('audio').forEach((audio) => {
    const src = audio.getAttribute('src') ?? audio.querySelector('source')?.getAttribute('src')
    if (src && !audios.includes(src)) audios.push(src)
    const padre = audio.parentElement
    audio.remove()
    if (padre && padre !== documento.body && padre.tagName === 'P' && padre.textContent?.trim() === '' && padre.children.length === 0) padre.remove()
  })
  return { html: documento.body.innerHTML.trim(), audios }
}
