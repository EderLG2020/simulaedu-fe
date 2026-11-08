import type { FormatoReporte } from '../api/coordinadorApi'

const numero = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })
const porcentaje = new Intl.NumberFormat('es-PE', { style: 'percent', maximumFractionDigits: 0 })
const fecha = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
const fechaCorta = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' })

/** Puntaje promedio o un guion si aun no hay simulacros. */
export function formatearPuntaje(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : numero.format(valor)
}

/** Tasa de 0 a 1 como porcentaje ("42 %"). */
export function formatearPorcentaje(tasa: number): string {
  return porcentaje.format(tasa)
}

/** Fecha ISO (con o sin hora) legible; "Nunca" si es null. */
export function formatearFecha(iso: string | null): string {
  if (!iso) return 'Nunca'
  // Una fecha sola (YYYY-MM-DD) se interpreta en UTC: se le agrega la hora local para no correr el dia.
  const valor = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return Number.isNaN(valor.getTime()) ? iso : fecha.format(valor)
}

/** "3 nov" para el eje de la evolucion semanal. */
export function formatearSemana(iso: string): string {
  const valor = new Date(`${iso}T00:00:00`)
  return Number.isNaN(valor.getTime()) ? iso : fechaCorta.format(valor)
}

const EXTENSION: Record<FormatoReporte, string> = { PDF: 'pdf', EXCEL: 'xlsx' }

/** Nombre del archivo descargado: `reporte-<base>-<YYYY-MM-DD>.pdf|xlsx`. */
export function nombreArchivoReporte(base: string, formato: FormatoReporte, hoy = new Date()): string {
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const dia = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  return `reporte-${slug || 'institucion'}-${dia}.${EXTENSION[formato]}`
}

/** Dispara la descarga de un archivo ya recibido (el GET autenticado lo hace la API, no el enlace). */
export function guardarArchivo(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}
