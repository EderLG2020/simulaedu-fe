import DOMPurify from 'dompurify'

/** Quita tags y decodifica entidades HTML (&iquest;, &ntilde;...) para mostrar texto plano legible. */
export function textoPlanoDe(html: string, longitud = 140): string {
  const sinTags = html.replace(/<[^>]+>/g, ' ')
  const contenedor = document.createElement('textarea')
  contenedor.innerHTML = sinTags
  const texto = contenedor.value.replace(/\s+/g, ' ').trim()
  return texto.length > longitud ? `${texto.slice(0, longitud)}…` : texto
}

/**
 * HTML de preguntas (enunciado/alternativas) listo para `dangerouslySetInnerHTML`: lo escriben
 * docentes y lo ven todos los estudiantes, asi que se quitan scripts, manejadores `on*` y URLs
 * `javascript:`. El backend ya limpia al guardar (HtmlSeguro); esto cubre lo guardado antes y
 * es la segunda barrera. Conserva formato, tablas, imagenes, `pre`/`code` y `audio`.
 */
export function htmlSeguro(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
