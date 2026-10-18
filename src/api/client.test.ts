import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, apiFetchPagina, ApiError, mensajeDeError, todasLasPaginas } from './client'
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

  it('devuelve undefined en una respuesta 204 sin cuerpo (ej. DELETE)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error('sin cuerpo') } })
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('/coordinador/alumnos/x/licencia', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('apiFetchPagina conserva data y meta de un envelope paginado', async () => {
    mockFetchOnce(200, { data: [{ id: 'a' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } })

    const resultado = await apiFetchPagina<{ id: string }>('/admin/usuarios')

    expect(resultado.data).toEqual([{ id: 'a' }])
    expect(resultado.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 })
  })

  it('limpia la sesion cuando el backend responde 401 a una llamada autenticada', async () => {
    useAuthStore.getState().setSesion('token-vencido', usuario)
    mockFetchOnce(401, { error: { code: 'NO_AUTORIZADO', message: 'Token invalido', details: [] } })

    await expect(apiFetch('/simulacros')).rejects.toBeInstanceOf(ApiError)

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().usuario).toBeNull()
  })
})

describe('mensajeDeError', () => {
  it('usa el mensaje del backend si es un error de la API', () => {
    expect(mensajeDeError(new ApiError('X', 'Mensaje del backend'), 'Por defecto')).toBe('Mensaje del backend')
  })

  it('usa el mensaje por defecto para cualquier otro error', () => {
    expect(mensajeDeError(new TypeError('Failed to fetch'), 'Por defecto')).toBe('Por defecto')
    expect(mensajeDeError('texto', 'Por defecto')).toBe('Por defecto')
  })
})

describe('todasLasPaginas', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function pagina(data: number[], page: number, totalPages: number) {
    return { ok: true, status: 200, json: async () => ({ data, meta: { page, limit: 100, total: 0, totalPages } }) }
  }

  it('pide pagina tras pagina hasta la ultima y junta todo', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(pagina([1, 2], 1, 2)).mockResolvedValueOnce(pagina([3], 2, 2))
    vi.stubGlobal('fetch', fetchMock)

    expect(await todasLasPaginas<number>('/examenes?estado=PUBLICADO')).toEqual([1, 2, 3])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toContain('/examenes?estado=PUBLICADO&page=2&limit=100')
  })

  it('con una sola pagina hace una sola peticion', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(pagina([], 1, 0))
    vi.stubGlobal('fetch', fetchMock)

    expect(await todasLasPaginas<number>('/grupos')).toEqual([])
    expect(fetchMock.mock.calls[0][0]).toContain('/grupos?page=1&limit=100')
  })
})
