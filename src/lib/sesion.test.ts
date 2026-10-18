import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '../api/client'
import type { Usuario } from '../api/authApi'
import { MARCA_SESION, useAuthStore } from '../stores/authStore'
import { useConexionStore } from '../stores/conexionStore'
import { cerrarSesion, iniciarSesion, RenovacionPendienteError } from './sesion'

const usuario: Usuario = { id: 'u-1', nombre: 'Ana', email: 'ana@example.com', rol: 'ESTUDIANTE', emailVerificado: true }

/** JWT falso (sin firma valida) con el `exp` indicado; el front solo lee el exp. */
function jwt(nombre: string, venceEnMs: number): string {
  const payload = btoa(JSON.stringify({ sub: nombre, exp: Math.floor((Date.now() + venceEnMs) / 1000) }))
  return `x.${payload}.${nombre}`
}

function respuesta(status: number, body?: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

/** fetch simulado: /auth/refresh responde con `refresh`, el resto 401 si el token es `vencido`, si no 200. */
function simularBackend(refresh: () => ReturnType<typeof respuesta>) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    if (url.endsWith('/auth/refresh')) return refresh()
    if (url.endsWith('/auth/logout')) return respuesta(204)
    const auth = (init.headers as Record<string, string>).Authorization ?? ''
    return auth.includes('vencido') ? respuesta(401, { error: { code: 'X', message: 'no', details: [] } }) : respuesta(200, { data: { ok: true } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const llamadasA = (fetchMock: ReturnType<typeof vi.fn>, ruta: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).endsWith(ruta)).length

describe('sesion', () => {
  beforeEach(() => {
    useAuthStore.getState().cerrarSesion()
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ante un 401 renueva el token con la cookie y reintenta la peticion una vez', async () => {
    useAuthStore.getState().setSesion(jwt('vencido', 10 * 60_000), usuario)
    const nuevo = jwt('nuevo', 15 * 60_000)
    const fetchMock = simularBackend(() => respuesta(200, { data: { accessToken: nuevo, tokenType: 'Bearer', usuario } }))

    await expect(apiFetch('/simulacros')).resolves.toEqual({ ok: true })

    expect(llamadasA(fetchMock, '/auth/refresh')).toBe(1)
    const [, init] = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/refresh'))!
    expect(init.credentials).toBe('include')
    expect((init.headers as Record<string, string>)['X-Requested-With']).toBe('fetch')
    expect(useAuthStore.getState().accessToken).toBe(nuevo)
  })

  it('varias llamadas con 401 al mismo tiempo comparten una sola renovacion', async () => {
    useAuthStore.getState().setSesion(jwt('vencido', 10 * 60_000), usuario)
    const nuevo = jwt('nuevo', 15 * 60_000)
    const fetchMock = simularBackend(() => respuesta(200, { data: { accessToken: nuevo, tokenType: 'Bearer', usuario } }))

    await Promise.all([apiFetch('/a'), apiFetch('/b'), apiFetch('/c')])

    expect(llamadasA(fetchMock, '/auth/refresh')).toBe(1)
  })

  it('renueva antes de llamar si el token esta por vencer', async () => {
    useAuthStore.getState().setSesion(jwt('casi', 10_000), usuario)
    const nuevo = jwt('nuevo', 15 * 60_000)
    const fetchMock = simularBackend(() => respuesta(200, { data: { accessToken: nuevo, tokenType: 'Bearer', usuario } }))

    await apiFetch('/simulacros')

    const llamada = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/simulacros'))!
    expect((llamada[1].headers as Record<string, string>).Authorization).toBe(`Bearer ${nuevo}`)
  })

  it('si la renovacion falla cierra la sesion y borra la marca', async () => {
    localStorage.setItem(MARCA_SESION, '1')
    useAuthStore.getState().setSesion(jwt('vencido', 10 * 60_000), usuario)
    simularBackend(() => respuesta(401, { error: { code: 'SESION_INVALIDA', message: 'expiro', details: [] } }))

    await expect(apiFetch('/simulacros')).rejects.toThrow()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().estado).toBe('anonimo')
    expect(localStorage.getItem(MARCA_SESION)).toBeNull()
  })

  it('iniciarSesion guarda el token solo en memoria y deja la marca de sesion', () => {
    iniciarSesion(jwt('nuevo', 15 * 60_000), usuario)

    expect(useAuthStore.getState().estado).toBe('autenticado')
    expect(localStorage.getItem(MARCA_SESION)).toBe('1')
    expect(JSON.stringify({ ...localStorage })).not.toContain('nuevo')
  })

  it('cerrarSesion avisa al backend y limpia la sesion', async () => {
    iniciarSesion(jwt('nuevo', 15 * 60_000), usuario)
    const fetchMock = simularBackend(() => respuesta(401))

    await cerrarSesion()

    expect(llamadasA(fetchMock, '/auth/logout')).toBe(1)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(localStorage.getItem(MARCA_SESION)).toBeNull()
  })

  it('si el servidor falla al renovar (ej. 503 con internet lento) NO cierra la sesion', async () => {
    localStorage.setItem(MARCA_SESION, '1')
    const token = jwt('vencido', 10 * 60_000)
    useAuthStore.getState().setSesion(token, usuario)
    simularBackend(() => respuesta(503))

    await expect(apiFetch('/simulacros')).rejects.toBeInstanceOf(RenovacionPendienteError)

    expect(useAuthStore.getState().accessToken).toBe(token)
    expect(localStorage.getItem(MARCA_SESION)).toBe('1')
  })

  it('sin red NO cierra la sesion y marca la app como sin conexion', async () => {
    const token = jwt('vencido', 10 * 60_000)
    useAuthStore.getState().setSesion(token, usuario)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiFetch('/simulacros')).rejects.toBeInstanceOf(TypeError)

    expect(useAuthStore.getState().accessToken).toBe(token)
    expect(useConexionStore.getState().sinConexion).toBe(true)
  })

  it('le pasa su token vigente a una pestana nueva que lo solicita (sin ir al backend)', async () => {
    const token = jwt('vigente', 15 * 60_000)
    iniciarSesion(token, usuario)
    const pestanaNueva = new BroadcastChannel('simulaedu-auth')
    const recibido = new Promise<{ tipo: string; accessToken?: string }>((resolve) => {
      pestanaNueva.onmessage = (e) => resolve(e.data)
    })

    pestanaNueva.postMessage({ tipo: 'solicitar' })

    await expect(recibido).resolves.toMatchObject({ tipo: 'sesion', accessToken: token })
    pestanaNueva.close()
  })

  it('aplica la sesion que otra pestana comparte por BroadcastChannel', async () => {
    const otraPestana = new BroadcastChannel('simulaedu-auth')
    const token = jwt('de-otra-pestana', 15 * 60_000)

    otraPestana.postMessage({ tipo: 'sesion', accessToken: token, usuario })
    await vi.waitFor(() => expect(useAuthStore.getState().accessToken).toBe(token))

    otraPestana.postMessage({ tipo: 'logout' })
    await vi.waitFor(() => expect(useAuthStore.getState().accessToken).toBeNull())
    otraPestana.close()
  })
})
