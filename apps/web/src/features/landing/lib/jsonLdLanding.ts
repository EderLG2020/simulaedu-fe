/** Datos estructurados schema.org de la landing (la organizacion y el sitio ya van en index.html). */
export interface PreguntaFrecuente {
  pregunta: string
  respuesta: string
}

/** FAQPage: Google puede mostrar las preguntas desplegables bajo el resultado. */
export function construirFaqJsonLd(faqs: PreguntaFrecuente[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ pregunta, respuesta }) => ({
      '@type': 'Question',
      name: pregunta,
      acceptedAnswer: { '@type': 'Answer', text: respuesta },
    })),
  }
}
