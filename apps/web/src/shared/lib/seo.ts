/** Nombre del sitio y URLs absolutas para canonical y Open Graph. */
const NOMBRE_SITIO = 'SimulaEdu'

/** Dominio publico sin barra final; sin VITE_SITE_URL, el origen desde el que se sirve la app. */
export function urlDelSitio(valor: string | undefined = import.meta.env.VITE_SITE_URL, origen = globalThis.location?.origin ?? ''): string {
  return (valor?.trim() || origen).replace(/\/+$/, '')
}

export function urlAbsoluta(ruta: string, sitio = urlDelSitio()): string {
  return ruta === '/' ? `${sitio}/` : `${sitio}${ruta.startsWith('/') ? ruta : `/${ruta}`}`
}

/** «Ingresar | SimulaEdu»; el inicio lleva su propio titulo completo. */
export function tituloCompleto(titulo: string): string {
  return titulo.includes(NOMBRE_SITIO) ? titulo : `${titulo} | ${NOMBRE_SITIO}`
}

/** JSON para <script type="application/ld+json">: "<" escapado para que un "</script>" no cierre el bloque. */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, '\\u003c')
}
