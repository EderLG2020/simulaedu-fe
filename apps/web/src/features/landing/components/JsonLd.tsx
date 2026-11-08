import { serializarJsonLd } from '../../../shared/lib/seo'

/** Inserta datos estructurados schema.org (JSON-LD) para los buscadores. */
export default function JsonLd({ datos }: { datos: unknown }) {
  // JSON-LD necesita el texto sin escapar; serializarJsonLd neutraliza "<".
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(datos) }} />
}
