import { describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'

/**
 * index.html solo descarga los iconos listados en `icon_names` (ver scripts/iconos.mjs).
 * Si el codigo usa un icono que no esta en esa lista, se veria su nombre como texto: este
 * test lo detecta. Solucion: correr `npm run iconos`.
 *
 * Lee los archivos con `?raw` e import.meta.glob de Vite, no con fs/path de Node: asi el test
 * compila con los tipos de la app y no rompe `npm run build`.
 */
const lista = new Set(
  (indexHtml.match(/icon_names=([a-z0-9_,]+)/)?.[1] ?? '').split(','),
)

/** Usos explicitos de iconos: <Icon name="x">, icon="x", icono: 'x', y el texto de <span class="material-symbols-outlined">. */
const PATRONES = [
  /<Icon\b[^>]*\bname="([a-z0-9_]+)"/g,
  /\bicon="([a-z0-9_]+)"/g,
  /\b(?:icono|icon|[a-z]+Icono)\s*:\s*'([a-z0-9_]+)'/g,
  /(?:material-symbols-outlined|\$\{iconoBase\})[^>]*>\s*([a-z0-9_]+)\s*</g,
  /\bname=\{\s*'([a-z0-9_]+)'\s*\}/g,
  // Ternarios: solo las ramas (tras ? y :), no lo que se compara (ej. subiendoImagen === 'enunciado').
  /\bname=\{[^}]*?\?\s*'([a-z0-9_]+)'/g,
  /\bname=\{[^}]*?:\s*'([a-z0-9_]+)'\s*\}/g,
]

/** Codigo fuente de la app (sin tests), como texto. */
const fuentes = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true })

describe('iconos de Material Symbols', () => {
  it('index.html pide una lista de iconos (no la fuente completa)', () => {
    expect(lista.size).toBeGreaterThan(10)
  })

  it('todo icono usado en el codigo esta en icon_names de index.html', () => {
    const faltantes = new Set<string>()
    for (const [archivo, codigo] of Object.entries(fuentes)) {
      for (const patron of PATRONES) {
        for (const [, nombre] of codigo.matchAll(patron)) {
          if (!lista.has(nombre)) faltantes.add(`${nombre} (${archivo})`)
        }
      }
    }
    expect([...faltantes], 'Faltan iconos en index.html: corre `npm run iconos`').toEqual([])
  })
})
