import { describe, expect, it } from 'vitest'
import { FORMULARIO_VACIO, type FormularioPregunta } from './formularioPregunta'
import { aplicarTraduccion, textosDePregunta } from './traduccionPregunta'

const formulario: FormularioPregunta = {
  ...FORMULARIO_VACIO,
  enunciadoHtml: '<p>Hola</p>',
  explicacionHtml: '<p>Porque si</p>',
  alternativas: [
    { textoHtml: 'Uno', imagenUrl: 'https://x/1.png', esCorrecta: true },
    { textoHtml: 'Dos', imagenUrl: null, esCorrecta: false },
  ],
  columnaIzquierda: ['Perro', 'Gato'],
  columnaDerecha: ['Ladra', 'Maulla', 'Vuela'],
  rubricaEvaluacion: 'Claridad',
}

describe('traduccionPregunta', () => {
  it('separa los textos HTML de los planos', () => {
    expect(textosDePregunta(formulario)).toEqual({
      html: ['<p>Hola</p>', '<p>Porque si</p>', 'Uno', 'Dos'],
      texto: ['Perro', 'Gato', 'Ladra', 'Maulla', 'Vuela', 'Claridad'],
    })
  })

  it('devuelve cada traduccion a su campo y conserva lo que no es texto', () => {
    const traducido = aplicarTraduccion(formulario, {
      html: ['<p>Hello</p>', '<p>Because</p>', 'One', 'Two'],
      texto: ['Dog', 'Cat', 'Barks', 'Meows', 'Flies', 'Clarity'],
    })

    expect(traducido.enunciadoHtml).toBe('<p>Hello</p>')
    expect(traducido.explicacionHtml).toBe('<p>Because</p>')
    expect(traducido.alternativas).toEqual([
      { textoHtml: 'One', imagenUrl: 'https://x/1.png', esCorrecta: true },
      { textoHtml: 'Two', imagenUrl: null, esCorrecta: false },
    ])
    expect(traducido.columnaIzquierda).toEqual(['Dog', 'Cat'])
    expect(traducido.columnaDerecha).toEqual(['Barks', 'Meows', 'Flies'])
    expect(traducido.rubricaEvaluacion).toBe('Clarity')
    expect(traducido.paresCorrectos).toBe(formulario.paresCorrectos)
  })
})
