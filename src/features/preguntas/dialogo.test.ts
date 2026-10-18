import { describe, expect, it } from 'vitest'
import { problemaDelDialogo } from './dialogo'
import { FORMULARIO_VACIO, formularioARequest, insertarAudioDialogo } from './formularioPregunta'

const linea = (texto: string, hablante: 'A' | 'B' = 'A') => ({ hablante, texto })

describe('problemaDelDialogo', () => {
  it('acepta un dialogo de 2 lineas con texto', () => {
    expect(problemaDelDialogo([linea('Hi'), linea('Hello', 'B')])).toBeNull()
  })

  it('pide al menos 2 lineas y texto en todas', () => {
    expect(problemaDelDialogo([linea('Hi')])).toMatch(/al menos 2/)
    expect(problemaDelDialogo([linea('Hi'), linea('   ', 'B')])).toMatch(/Completa/)
  })

  it('respeta los limites del backend: 300 por linea y 2000 en total', () => {
    expect(problemaDelDialogo([linea('a'.repeat(301)), linea('b', 'B')])).toMatch(/300/)
    const lineas = Array.from({ length: 7 }, (_, i) => linea('a'.repeat(300), i % 2 ? 'B' : 'A'))
    expect(problemaDelDialogo(lineas)).toMatch(/2000/)
  })
})

describe('insertarAudioDialogo', () => {
  const reproductor = (url: string) => `<p><audio controls preload="none" src="${url}"></audio></p>`

  it('agrega el reproductor al final del enunciado', () => {
    expect(insertarAudioDialogo('<p>Listen.</p>', null, 'https://x/1.mp3')).toBe(`<p>Listen.</p>\n${reproductor('https://x/1.mp3')}`)
    expect(insertarAudioDialogo('', null, 'https://x/1.mp3')).toBe(reproductor('https://x/1.mp3'))
  })

  it('al regenerar reemplaza el audio anterior en vez de agregar otro', () => {
    const enunciado = `<p>Listen.</p>\n${reproductor('https://x/1.mp3')}`
    expect(insertarAudioDialogo(enunciado, 'https://x/1.mp3', 'https://x/2.mp3')).toBe(`<p>Listen.</p>\n${reproductor('https://x/2.mp3')}`)
  })
})

describe('formularioARequest con dialogo', () => {
  const guion = { acento: 'en-US' as const, velocidad: 'normal' as const, lineas: [linea('Hi'), linea('Hello', 'B')], audioUrl: 'https://x/1.mp3' }

  it('envia el guion si su audio sigue en el enunciado', () => {
    const request = formularioARequest({ ...FORMULARIO_VACIO, enunciadoHtml: '<audio src="https://x/1.mp3"></audio>', guionAudio: guion })
    expect(request.guionAudio).toEqual(guion)
  })

  it('no envia el guion si el docente borro el reproductor', () => {
    const request = formularioARequest({ ...FORMULARIO_VACIO, enunciadoHtml: '<p>Sin audio</p>', guionAudio: guion })
    expect(request.guionAudio).toBeNull()
  })
})
