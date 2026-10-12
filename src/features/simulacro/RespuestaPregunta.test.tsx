import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PreguntaSimulacro } from '../../api/simulacrosApi'
import RespuestaPregunta from './RespuestaPregunta'

function pregunta(parcial: Partial<PreguntaSimulacro>): PreguntaSimulacro {
  return {
    respuestaSimulacroId: 'r-1',
    preguntaId: 'p-1',
    tipoPregunta: 'OPCION_UNICA',
    dificultad: 'MEDIA',
    enunciadoHtml: '<p>Enunciado</p>',
    metadataTipo: {},
    tiempoSugeridoSeg: null,
    alternativas: [],
    respuestaDada: {},
    marcadaParaRevision: false,
    ...parcial,
  }
}

function renderRespuesta(p: PreguntaSimulacro) {
  const onCambiar = vi.fn()
  const onCambiarConDebounce = vi.fn()
  render(<RespuestaPregunta pregunta={p} onCambiar={onCambiar} onCambiarConDebounce={onCambiarConDebounce} />)
  return { onCambiar, onCambiarConDebounce }
}

afterEach(cleanup)

describe('RespuestaPregunta - desarrollo', () => {
  const desarrollo = pregunta({ tipoPregunta: 'DESARROLLO', metadataTipo: { limiteCaracteres: 500 } })

  it('permite escribir la respuesta y la guarda como texto (con debounce)', () => {
    const { onCambiarConDebounce } = renderRespuesta(desarrollo)

    fireEvent.change(screen.getByRole('textbox', { name: 'Tu respuesta' }), { target: { value: 'Usaria el patron Saga.' } })

    expect(onCambiarConDebounce).toHaveBeenCalledWith({ texto: 'Usaria el patron Saga.' })
  })

  it('muestra lo ya respondido y cuantos caracteres quedan del limite', () => {
    renderRespuesta({ ...desarrollo, respuestaDada: { texto: 'Hola' } })

    const campo = screen.getByRole('textbox', { name: 'Tu respuesta' })
    expect(campo).toHaveValue('Hola')
    expect(campo).toHaveAttribute('maxLength', '500')
    expect(screen.getByText('4 / 500')).toBeInTheDocument()
  })

  it('una respuesta vacia se guarda en blanco (texto null), no como respondida', () => {
    const { onCambiarConDebounce } = renderRespuesta({ ...desarrollo, respuestaDada: { texto: 'Hola' } })

    fireEvent.change(screen.getByRole('textbox', { name: 'Tu respuesta' }), { target: { value: '   ' } })

    expect(onCambiarConDebounce).toHaveBeenCalledWith({ texto: null })
  })
})

describe('RespuestaPregunta - emparejamiento', () => {
  const emparejamiento = pregunta({
    tipoPregunta: 'EMPAREJAMIENTO',
    metadataTipo: { columnaIzquierda: ['HTTP', 'TCP', 'IP'], columnaDerecha: ['Red', 'Aplicacion', 'Transporte'] },
  })

  it('muestra un selector por cada elemento de la izquierda con las opciones de la derecha', () => {
    renderRespuesta(emparejamiento)

    const http = screen.getByRole('combobox', { name: 'HTTP' })
    expect(within(http).getAllByRole('option').map((o) => o.textContent)).toEqual(['Elige...', 'A. Red', 'B. Aplicacion', 'C. Transporte'])
    expect(screen.getAllByRole('combobox')).toHaveLength(3)
  })

  it('guarda los pares elegidos con los indices de cada columna', () => {
    const { onCambiar } = renderRespuesta({ ...emparejamiento, respuestaDada: { pares: [{ izquierda: 1, derecha: 2 }] } })

    expect(screen.getByRole('combobox', { name: 'TCP' })).toHaveValue('2')

    fireEvent.change(screen.getByRole('combobox', { name: 'HTTP' }), { target: { value: '1' } })

    expect(onCambiar).toHaveBeenCalledWith({
      pares: [
        { izquierda: 0, derecha: 1 },
        { izquierda: 1, derecha: 2 },
      ],
    })
  })

  it('quitar la eleccion de la unica fila deja la pregunta en blanco', () => {
    const { onCambiar } = renderRespuesta({ ...emparejamiento, respuestaDada: { pares: [{ izquierda: 0, derecha: 1 }] } })

    fireEvent.change(screen.getByRole('combobox', { name: 'HTTP' }), { target: { value: '' } })

    expect(onCambiar).toHaveBeenCalledWith({ pares: [] })
  })
})
