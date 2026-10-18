import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import PanelDialogo from './PanelDialogo'

const mocks = vi.hoisted(() => ({ generar: vi.fn() }))

vi.mock('../../api/preguntasApi', () => ({
  generarAudioDialogo: (...args: unknown[]) => mocks.generar(...args),
}))

function escribir(linea: number, texto: string) {
  fireEvent.change(screen.getByLabelText(`Texto de la línea ${linea}`), { target: { value: texto } })
}

describe('PanelDialogo', () => {
  const onInsertar = vi.fn()
  const onCerrar = vi.fn()

  beforeEach(() => {
    mocks.generar.mockReset()
    onInsertar.mockReset()
  })
  afterEach(cleanup)

  it('no deja generar hasta que todas las lineas tengan texto', () => {
    render(<PanelDialogo guionInicial={null} onInsertar={onInsertar} onCerrar={onCerrar} />)
    expect(screen.getByRole('button', { name: /Generar audio/ })).toBeDisabled()

    escribir(1, 'Hi, where is the station?')
    escribir(2, "It's two blocks away.")
    expect(screen.getByRole('button', { name: /Generar audio/ })).toBeEnabled()
  })

  it('genera el audio con el acento y la velocidad elegidos y lo inserta con su guion', async () => {
    mocks.generar.mockResolvedValue('https://res.cloudinary.com/x/dialogo.mp3')
    render(<PanelDialogo guionInicial={null} onInsertar={onInsertar} onCerrar={onCerrar} />)
    escribir(1, 'Hi')
    escribir(2, 'Hello')
    fireEvent.click(screen.getByRole('button', { name: 'Británico' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lenta' }))

    fireEvent.click(screen.getByRole('button', { name: /Generar audio/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Insertar en la pregunta/ }))

    const guion = {
      acento: 'en-GB',
      velocidad: 'lenta',
      lineas: [
        { hablante: 'A', texto: 'Hi' },
        { hablante: 'B', texto: 'Hello' },
      ],
    }
    expect(mocks.generar).toHaveBeenCalledWith(guion)
    expect(onInsertar).toHaveBeenCalledWith({ ...guion, audioUrl: 'https://res.cloudinary.com/x/dialogo.mp3' })
  })

  it('al cambiar el texto despues de generar descarta ese audio', async () => {
    mocks.generar.mockResolvedValue('https://x/1.mp3')
    render(<PanelDialogo guionInicial={null} onInsertar={onInsertar} onCerrar={onCerrar} />)
    escribir(1, 'Hi')
    escribir(2, 'Hello')
    fireEvent.click(screen.getByRole('button', { name: /Generar audio/ }))
    await screen.findByRole('button', { name: /Insertar en la pregunta/ })

    escribir(2, 'Hello there')
    expect(screen.queryByRole('button', { name: /Insertar en la pregunta/ })).toBeNull()
  })

  it('al editar una pregunta abre con su guion y agrega lineas alternando quien habla', () => {
    render(
      <PanelDialogo
        guionInicial={{ acento: 'en-US', velocidad: 'normal', lineas: [{ hablante: 'A', texto: 'Hi' }, { hablante: 'B', texto: 'Hello' }], audioUrl: 'https://x/1.mp3' }}
        onInsertar={onInsertar}
        onCerrar={onCerrar}
      />,
    )
    expect(screen.getByLabelText('Texto de la línea 2')).toHaveValue('Hello')

    fireEvent.click(screen.getByRole('button', { name: /Agregar línea/ }))
    expect(screen.getByLabelText('Quién habla en la línea 3')).toHaveValue('A')
  })

  it('muestra el error del backend si no se pudo generar', async () => {
    mocks.generar.mockRejectedValue(new ApiError('VOZ_NO_CONFIGURADA', 'La generacion de audio no esta configurada.'))
    render(<PanelDialogo guionInicial={null} onInsertar={onInsertar} onCerrar={onCerrar} />)
    escribir(1, 'Hi')
    escribir(2, 'Hello')
    fireEvent.click(screen.getByRole('button', { name: /Generar audio/ }))

    expect(await screen.findByText('La generacion de audio no esta configurada.')).toBeInTheDocument()
  })
})
