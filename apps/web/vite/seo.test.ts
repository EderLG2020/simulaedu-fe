import { describe, expect, it } from 'vitest'
import { construirRobots, construirSitemap, normalizarSiteUrl, sitemapBackend } from './seo'

describe('seo (plugin de Vite)', () => {
  it('normaliza el dominio y cae en localhost si no hay', () => {
    expect(normalizarSiteUrl(' https://simulaedu.pe// ')).toBe('https://simulaedu.pe')
    expect(normalizarSiteUrl(undefined)).toBe('http://localhost:5177')
    expect(normalizarSiteUrl('')).toBe('http://localhost:5177')
  })

  it('ubica el sitemap del backend en la raiz de su origen', () => {
    expect(sitemapBackend('https://api.simulaedu.pe/api/v1')).toBe('https://api.simulaedu.pe/sitemap.xml')
    expect(sitemapBackend('no-es-url')).toBeNull()
    expect(sitemapBackend(undefined)).toBeNull()
  })

  it('el sitemap lista las paginas publicas con URL absoluta', () => {
    const xml = construirSitemap('https://simulaedu.pe')
    expect(xml).toContain('<loc>https://simulaedu.pe/</loc>')
    expect(xml).toContain('<loc>https://simulaedu.pe/registro</loc>')
    expect(xml).not.toContain('/admin')
  })

  it('escapa caracteres especiales del XML', () => {
    expect(construirSitemap('https://x.pe', [{ ruta: '/a&b', prioridad: '0.5' }])).toContain('<loc>https://x.pe/a&amp;b</loc>')
  })

  it('robots bloquea las rutas privadas y declara ambos sitemaps', () => {
    const robots = construirRobots('https://simulaedu.pe', 'https://api.simulaedu.pe/sitemap.xml')
    expect(robots).toContain('Disallow: /admin')
    expect(robots).toContain('Disallow: /simulacros')
    expect(robots).not.toContain('Disallow: /registro')
    expect(robots).toContain('Sitemap: https://simulaedu.pe/sitemap.xml')
    expect(robots).toContain('Sitemap: https://api.simulaedu.pe/sitemap.xml')
    expect(construirRobots('https://simulaedu.pe', null)).not.toContain('api.simulaedu.pe')
  })
})
