import { describe, expect, it } from 'vitest'
import { serializarJsonLd, tituloCompleto, urlAbsoluta, urlDelSitio } from './seo'

describe('seo', () => {
  it('usa VITE_SITE_URL sin barra final y, si falta, el origen actual', () => {
    expect(urlDelSitio('https://simulaedu.pe/', 'http://x')).toBe('https://simulaedu.pe')
    expect(urlDelSitio(undefined, 'http://localhost:5177')).toBe('http://localhost:5177')
  })

  it('arma URLs absolutas', () => {
    expect(urlAbsoluta('/', 'https://simulaedu.pe')).toBe('https://simulaedu.pe/')
    expect(urlAbsoluta('/registro', 'https://simulaedu.pe')).toBe('https://simulaedu.pe/registro')
    expect(urlAbsoluta('login', 'https://simulaedu.pe')).toBe('https://simulaedu.pe/login')
  })

  it('agrega el nombre del sitio al titulo una sola vez', () => {
    expect(tituloCompleto('Ingresar')).toBe('Ingresar | SimulaEdu')
    expect(tituloCompleto('SimulaEdu | Simulacros')).toBe('SimulaEdu | Simulacros')
  })

  it('el JSON-LD no puede cerrar el <script>', () => {
    expect(serializarJsonLd({ name: '</script><b>' })).toBe('{"name":"\\u003c/script>\\u003cb>"}')
  })
})
