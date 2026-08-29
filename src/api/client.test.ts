import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError } from './client'
import { useAuthStore } from '../stores/authStore'
import type { Usuario } from './authApi'

const usuario: Usuario = {
  id: 'u-1',
  nombre: 'Ana',
  email: 'ana@example.com',
  rol: 'ESTUDIANTE',
  emailVerificado: true,
}

function mockFetchOnce(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('apiFetch', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, usuario: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('no adjunta Authorization cuando no hay sesion', async () => {
    const fetchMock = mockFetchOnce(200, { data: { ok: true } })

    await apiFetch('/examenes')

    const [, init] = fetchMock.mock.calls[0]
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('adjunta el header Authorization con el token de la sesion actual', async () => {
    useAuthStore.getState().setSesion('token-123', usuario)
    const fetchMock = mockFetchOnce(200, { data: { ok: true } })

    await apiFetch('/simulacros')

    const [, init] = fetchMock.mock.calls[0]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-123')
  })

  it('devuelve el campo data de la respuesta exitosa', async () => {
    mockFetchOnce(200, { data: { id: 'abc' } })

    const resultado = await apiFetch<{ id: string }>('/examenes')

    expect(resultado).toEqual({ id: 'abc' })
  })

  it('lanza ApiError con el code/message/details del backend en una respuesta de error', async () => {
    mockFetchOnce(400, {
      error: { code: 'VALIDACION', message: 'Datos invalidos', details: [{ field: 'email', message: 'requerido' }] },
    })

    await expect(apiFetch('/auth/register')).rejects.toMatchObject({
      code: 'VALIDACION',
      message: 'Datos invalidos',
      details: [{ field: 'email', message: 'requerido' }],
    })
  })

  it('limpia la sesion cuando el backend responde 401 a una llamada autenticada', async () => {
    useAuthStore.getState().setSesion('token-vencido', usuario)
    mockFetchOnce(401, { error: { code: 'NO_AUTORIZADO', message: 'Token invalido', details: [] } })

    await expect(apiFetch('/simulacros')).rejects.toBeInstanceOf(ApiError)

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().usuario).toBeNull()
  })
})
