/**
 * Reglas de calificacion que entiende el backend (CalculadoraPuntajeService). Se configuran por
 * universidad en el panel admin y cada examen las hereda (puede sobrescribirlas). El JSON admite
 * otras claves: se conservan tal cual aunque aqui no se editen.
 */
export interface ReglasCalificacion {
  /** Si una respuesta incorrecta resta puntos. */
  penaliza_incorrecta?: boolean
  /** Fraccion del puntaje de la pregunta que se resta (default 0.25). */
  fraccion_penalizacion?: number
  /** Peso de cada dificultad al repartir el puntaje en examenes aleatorios por area. */
  pesos_dificultad?: Partial<Record<'baja' | 'media' | 'alta', number>>
  [otra: string]: unknown
}

export const FRACCION_PENALIZACION_DEFAULT = 0.25
export const PESOS_DIFICULTAD_DEFAULT = { baja: 1, media: 1.5, alta: 2 } as const

/** 0.25 -> "1/4", 0.2 -> "1/5"; si no es 1/n, en porcentaje ("30%"). */
export function formatearFraccion(fraccion: number): string {
  const n = 1 / fraccion
  if (Math.abs(n - Math.round(n)) < 1e-9) return `1/${Math.round(n)}`
  return `${Math.round(fraccion * 100)}%`
}

/** Fraccion que se resta por respuesta incorrecta, o null si no hay penalizacion. */
export function penalizacionDe(reglas: ReglasCalificacion | undefined): number | null {
  if (!reglas?.penaliza_incorrecta) return null
  return reglas.fraccion_penalizacion ?? FRACCION_PENALIZACION_DEFAULT
}
