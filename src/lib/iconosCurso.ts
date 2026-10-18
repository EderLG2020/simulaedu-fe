/**
 * Iconos que el admin puede asignar a un curso (el backend guarda el nombre en `curso.icono`).
 *
 * index.html solo descarga los iconos de Material Symbols que aparecen en el codigo (`npm run iconos`,
 * ver scripts/iconos.mjs): un icono arbitrario elegido en el panel se veria como texto. Por eso el
 * panel ofrece solo esta lista, y al mostrar un curso cualquier icono fuera de ella (ej. cargado por
 * SQL) cae al generico. Para ofrecer uno nuevo: agregarlo aqui (nombre de https://fonts.google.com/icons)
 * y correr `npm run iconos`; iconosCurso.test.ts avisa si se olvida.
 */
export const ICONOS_CURSO = [
  'auto_stories',
  'menu_book',
  'calculate',
  'function',
  'psychology',
  'lightbulb',
  'science',
  'biotech',
  'eco',
  'history_edu',
  'public',
  'payments',
  'balance',
  'gavel',
  'palette',
  'theater_comedy',
  'edit_note',
  'translate',
  'language',
  'code',
  'terminal',
  'memory',
  'database',
  'lan',
  'security',
  'smart_toy',
  'architecture',
  'school',
] as const

/** Icono generico: el default de la columna `curso.icono` en el backend. */
export const ICONO_CURSO_POR_DEFECTO = 'auto_stories'

const DISPONIBLES = new Set<string>(ICONOS_CURSO)

/** Icono a mostrar para un curso: el suyo si index.html lo descarga, si no el generico. */
export function iconoDeCurso(icono: string | null | undefined): string {
  return icono && DISPONIBLES.has(icono) ? icono : ICONO_CURSO_POR_DEFECTO
}
