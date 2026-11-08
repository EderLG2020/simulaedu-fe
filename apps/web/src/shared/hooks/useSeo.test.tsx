import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSeo } from './useSeo'

const contenido = (selector: string, atributo = 'content') => document.head.querySelector(selector)?.getAttribute(atributo) ?? null

describe('useSeo', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SITE_URL', 'https://simulaedu.pe')
    document.head.innerHTML = '<meta name="description" content="base"><meta name="robots" content="index, follow">'
    document.title = 'SimulaEdu'
  })
  afterEach(() => vi.unstubAllEnvs())

  it('fija titulo, descripcion, canonical y Open Graph de la pagina', () => {
    renderHook(() => useSeo({ titulo: 'Ingresar', descripcion: 'Entra a tu cuenta', ruta: '/login' }))

    expect(document.title).toBe('Ingresar | SimulaEdu')
    expect(contenido('meta[name="description"]')).toBe('Entra a tu cuenta')
    expect(contenido('meta[property="og:title"]')).toBe('Ingresar | SimulaEdu')
    expect(contenido('link[rel="canonical"]', 'href')).toBe('https://simulaedu.pe/login')
    expect(contenido('meta[property="og:url"]')).toBe('https://simulaedu.pe/login')
  })

  it('al desmontar deja las etiquetas como estaban y quita las que creo', () => {
    const { unmount } = renderHook(() => useSeo({ titulo: 'Verificar correo', ruta: '/verificar-email', noindex: true }))
    expect(contenido('meta[name="robots"]')).toBe('noindex, nofollow')

    unmount()

    expect(document.title).toBe('SimulaEdu')
    expect(contenido('meta[name="robots"]')).toBe('index, follow')
    expect(contenido('meta[name="description"]')).toBe('base')
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
  })
})
