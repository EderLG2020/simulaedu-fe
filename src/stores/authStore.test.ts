import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './authStore'
import type { Usuario } from '../api/authApi'

const usuario: Usuario = {
  id: 'u-1',
  nombre: 'Ana',
  email: 'ana@example.com',
  rol: 'ESTUDIANTE',
  emailVerificado: true,
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, usuario: null })
  })

  it('empieza sin sesion', () => {
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().usuario).toBeNull()
  })

  it('setSesion guarda el token y el usuario', () => {
    useAuthStore.getState().setSesion('token-123', usuario)

    expect(useAuthStore.getState().accessToken).toBe('token-123')
    expect(useAuthStore.getState().usuario).toEqual(usuario)
  })

  it('cerrarSesion limpia el token y el usuario', () => {
    useAuthStore.getState().setSesion('token-123', usuario)

    useAuthStore.getState().cerrarSesion()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().usuario).toBeNull()
  })
})
