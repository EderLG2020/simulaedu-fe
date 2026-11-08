import { useEffect } from 'react'
import { tituloCompleto, urlAbsoluta } from '../lib/seo'

export interface OpcionesSeo {
  titulo: string
  /** Sin descripcion se deja la de index.html. */
  descripcion?: string
  /** Ruta canonica (sin query): una URL con ?token=... no debe indexarse como otra pagina. */
  ruta?: string
  /** Paginas de un solo uso (verificar correo, restablecer clave...): el buscador no las indexa. */
  noindex?: boolean
}

/** Etiqueta del <head>: cual es (tag + atributo que la identifica) y el valor que se le fija. */
interface Etiqueta {
  tag: 'meta' | 'link'
  clave: 'name' | 'property' | 'rel'
  nombre: string
  atributo: 'content' | 'href'
  valor: string
}

const porNombre = (nombre: string, valor: string): Etiqueta => ({ tag: 'meta', clave: 'name', nombre, atributo: 'content', valor })
const porPropiedad = (nombre: string, valor: string): Etiqueta => ({ tag: 'meta', clave: 'property', nombre, atributo: 'content', valor })

function etiquetas({ titulo, descripcion, ruta, noindex }: OpcionesSeo): Etiqueta[] {
  const completo = tituloCompleto(titulo)
  const lista = [
    porPropiedad('og:title', completo),
    porNombre('twitter:title', completo),
    porNombre('robots', noindex ? 'noindex, nofollow' : 'index, follow'),
  ]
  if (descripcion) {
    lista.push(porNombre('description', descripcion), porPropiedad('og:description', descripcion), porNombre('twitter:description', descripcion))
  }
  if (ruta) {
    const url = urlAbsoluta(ruta)
    lista.push(porPropiedad('og:url', url), { tag: 'link', clave: 'rel', nombre: 'canonical', atributo: 'href', valor: url })
  }
  return lista
}

/** Fija el valor de la etiqueta (creandola si falta) y devuelve como dejarla como estaba. */
function fijar({ tag, clave, nombre, atributo, valor }: Etiqueta): () => void {
  const existente = document.head.querySelector<HTMLElement>(`${tag}[${clave}="${nombre}"]`)
  const elemento = existente ?? document.head.appendChild(document.createElement(tag))
  const anterior = elemento.getAttribute(atributo)
  elemento.setAttribute(clave, nombre)
  elemento.setAttribute(atributo, valor)
  return () => (existente && anterior !== null ? elemento.setAttribute(atributo, anterior) : elemento.remove())
}

/**
 * Titulo, descripcion, canonical, Open Graph y robots de la pagina actual. Ajusta las etiquetas
 * que ya trae index.html (o las crea) y al desmontar deja las anteriores, asi la pagina siguiente
 * no hereda un noindex ni un canonical ajeno.
 */
export function useSeo({ titulo, descripcion, ruta, noindex = false }: OpcionesSeo) {
  useEffect(() => {
    const tituloAnterior = document.title
    document.title = tituloCompleto(titulo)
    const deshacer = etiquetas({ titulo, descripcion, ruta, noindex }).map(fijar)

    return () => {
      document.title = tituloAnterior
      deshacer.forEach((restaurar) => restaurar())
    }
  }, [titulo, descripcion, ruta, noindex])
}
