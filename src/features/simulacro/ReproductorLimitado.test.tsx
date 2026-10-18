import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { separarAudios } from './formatoSimulacro'
import ReproductorLimitado from './ReproductorLimitado'

// jsdom no reproduce audio: se simula que el archivo carga (canplaythrough) y que play() funciona.
let play: Mock<() => Promise<void>>
let cargaFalla = false

beforeEach(() => {
  play = vi.fn().mockResolvedValue(undefined)
  cargaFalla = false
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    return play()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(function (this: HTMLMediaElement) {
    this.dispatchEvent(new Event(cargaFalla ? 'error' : 'canplaythrough'))
  })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ReproductorLimitado', () => {
  it('registra la escucha despues de cargar y recien ahi reproduce', async () => {
    const onEscuchar = vi.fn().mockResolvedValue(true)
    render(<ReproductorLimitado src="https://x/1.mp3" escuchasRestantes={2} onEscuchar={onEscuchar} />)

    await act(async () => fireEvent.click(screen.getByRole('button', { name: /quedan 2 veces/ })))

    expect(onEscuchar).toHaveBeenCalledOnce()
    expect(play).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: /Reproduciendo/ })).toBeDisabled()
  })

  it('no reproduce si el servidor no da la escucha', async () => {
    const onEscuchar = vi.fn().mockResolvedValue(false)
    render(<ReproductorLimitado src="https://x/1.mp3" escuchasRestantes={1} onEscuchar={onEscuchar} />)

    await act(async () => fireEvent.click(screen.getByRole('button', { name: /queda 1 vez/ })))

    expect(play).not.toHaveBeenCalled()
  })

  it('si el audio no carga no gasta la escucha', async () => {
    cargaFalla = true
    const onEscuchar = vi.fn()
    render(<ReproductorLimitado src="https://x/1.mp3" escuchasRestantes={2} onEscuchar={onEscuchar} />)

    await act(async () => fireEvent.click(screen.getByRole('button', { name: /quedan 2 veces/ })))

    expect(onEscuchar).not.toHaveBeenCalled()
    expect(screen.getByText(/no se descontó la escucha/)).toBeInTheDocument()
  })

  it('sin escuchas restantes queda deshabilitado', () => {
    render(<ReproductorLimitado src="https://x/1.mp3" escuchasRestantes={0} onEscuchar={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Ya escuchaste este audio 2 veces/ })).toBeDisabled()
  })
})

describe('separarAudios', () => {
  it('saca los audios del enunciado y el parrafo que queda vacio', () => {
    const { html, audios } = separarAudios('<p>Listen.</p><p><audio controls src="https://x/1.mp3"></audio></p>')
    expect(audios).toEqual(['https://x/1.mp3'])
    expect(html).toBe('<p>Listen.</p>')
  })

  it('toma la URL de un source y no repite audios', () => {
    const { audios } = separarAudios('<audio><source src="https://x/1.mp3"></audio><audio src="https://x/1.mp3"></audio>')
    expect(audios).toEqual(['https://x/1.mp3'])
  })
})
