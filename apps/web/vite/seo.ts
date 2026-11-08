/**
 * SEO de la SPA en build: genera /robots.txt y /sitemap.xml (en dev los sirve el servidor de Vite)
 * y sustituye __SITE_URL__ en index.html por el dominio publico (VITE_SITE_URL).
 *
 * El sitemap de la SPA solo trae sus paginas publicas fijas. Las paginas de la landing que se
 * publican desde el panel (por universidad) las lista el backend en su propio /sitemap.xml, que
 * robots.txt tambien declara.
 */
import type { Plugin } from 'vite'

const SITE_URL_LOCAL = 'http://localhost:5177'

export interface PaginaSitemap {
  ruta: string
  prioridad: string
}

const PAGINAS_PUBLICAS: PaginaSitemap[] = [
  { ruta: '/', prioridad: '1.0' },
  { ruta: '/registro', prioridad: '0.8' },
  { ruta: '/login', prioridad: '0.5' },
]

// Con sesion o de un solo uso: no aportan nada a un buscador (y sin sesion redirigen a /login).
const RUTAS_PRIVADAS = [
  '/admin',
  '/docente',
  '/coordinador',
  '/examenes',
  '/simulacros',
  '/ranking',
  '/notificaciones',
  '/auth/',
  '/verificar-email',
  '/restablecer-password',
]

export function normalizarSiteUrl(valor: string | undefined): string {
  const url = valor?.trim().replace(/\/+$/, '')
  return url || SITE_URL_LOCAL
}

/** /sitemap.xml del backend: va en la raiz de su origen, no bajo /api/v1. */
export function sitemapBackend(apiUrl: string | undefined): string | null {
  if (!apiUrl) return null
  try {
    return `${new URL(apiUrl).origin}/sitemap.xml`
  } catch {
    return null
  }
}

const escaparXml = (valor: string) =>
  valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export function construirSitemap(siteUrl: string, paginas: PaginaSitemap[] = PAGINAS_PUBLICAS): string {
  const urls = paginas
    .map(({ ruta, prioridad }) => {
      const loc = ruta === '/' ? `${siteUrl}/` : `${siteUrl}${ruta}`
      return `  <url><loc>${escaparXml(loc)}</loc><changefreq>weekly</changefreq><priority>${prioridad}</priority></url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

export function construirRobots(siteUrl: string, sitemapDelBackend: string | null): string {
  const lineas = [
    'User-agent: *',
    'Allow: /',
    ...RUTAS_PRIVADAS.map((ruta) => `Disallow: ${ruta}`),
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ...(sitemapDelBackend ? [`Sitemap: ${sitemapDelBackend}`] : []),
  ]
  return `${lineas.join('\n')}\n`
}

export function seo(): Plugin {
  let siteUrl = SITE_URL_LOCAL
  let robots = ''
  let sitemap = ''

  return {
    name: 'simulaedu-seo',
    configResolved(config) {
      siteUrl = normalizarSiteUrl(config.env.VITE_SITE_URL)
      robots = construirRobots(siteUrl, sitemapBackend(config.env.VITE_API_URL))
      sitemap = construirSitemap(siteUrl)
      if (config.command === 'build' && !config.env.VITE_SITE_URL) {
        config.logger.warn(`[seo] VITE_SITE_URL no esta definida: canonical, Open Graph y sitemap usaran ${siteUrl}`)
      }
    },
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const archivo = req.url === '/robots.txt' ? robots : req.url === '/sitemap.xml' ? sitemap : null
        if (archivo === null) return next()
        res.setHeader('Content-Type', req.url === '/robots.txt' ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8')
        res.end(archivo)
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    },
  }
}
