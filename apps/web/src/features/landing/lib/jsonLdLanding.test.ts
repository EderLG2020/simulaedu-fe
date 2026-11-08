import { describe, expect, it } from 'vitest'
import { FAQS } from './datosLanding'
import { construirFaqJsonLd } from './jsonLdLanding'

describe('construirFaqJsonLd', () => {
  it('convierte cada pregunta frecuente en un Question con su respuesta', () => {
    const jsonLd = construirFaqJsonLd(FAQS)

    expect(jsonLd['@type']).toBe('FAQPage')
    expect(jsonLd.mainEntity).toHaveLength(FAQS.length)
    expect(jsonLd.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: FAQS[0].pregunta,
      acceptedAnswer: { '@type': 'Answer', text: FAQS[0].respuesta },
    })
  })
})
