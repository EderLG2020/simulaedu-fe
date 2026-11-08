import { beforeEach, describe, expect, it, vi } from 'vitest'
import { traducirTextos } from './traduccionApi'

const apiFetch = vi.hoisted(() => vi.fn())
vi.mock('./client', () => ({ apiFetch }))

describe('traducirTextos', () => {
  beforeEach(() => apiFetch.mockReset())

  it('pide la traduccion al backend y devuelve los textos', async () => {
    apiFetch.mockResolvedValue({ textos: ['<p>Hello</p>'] })

    const traducidos = await traducirTextos(['<p>Hola</p>'], 'EN', { html: true })

    expect(traducidos).toEqual(['<p>Hello</p>'])
    expect(apiFetch).toHaveBeenCalledWith('/traducciones', {
      method: 'POST',
      body: JSON.stringify({ textos: ['<p>Hola</p>'], origen: 'ES', destino: 'EN', html: true }),
    })
  })

  it('respeta un origen explicito; sin texto no llama al backend', async () => {
    apiFetch.mockResolvedValue({ textos: ['Hola'] })
    await traducirTextos(['Hello'], 'ES', { origen: 'EN' })
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ textos: ['Hello'], origen: 'EN', destino: 'ES', html: false })

    apiFetch.mockClear()
    expect(await traducirTextos(['', '  '], 'EN')).toEqual(['', '  '])
    expect(await traducirTextos([], 'EN')).toEqual([])
    expect(apiFetch).not.toHaveBeenCalled()
  })
})
