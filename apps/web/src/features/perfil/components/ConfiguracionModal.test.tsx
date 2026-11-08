import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../../shared/api/authApi'
import { useAuthStore } from '../../../shared/stores/authStore'
import { renderConQuery } from '../../../shared/test/conQuery'
import ConfiguracionModal from './ConfiguracionModal'

const mocks = vi.hoisted(() => ({ unirse: vi.fn() }))

vi.mock('../../../shared/api/usuariosApi', () => ({
  actualizarPerfil: vi.fn(),
  cambiarPassword: vi.fn(),
  subirFotoPerfil: vi.fn(),
  obtenerPerfil: vi.fn(),
  unirseAInstitucion: (...args: unknown[]) => mocks.unirse(...args),
}))

function usuario(rol: string, institucionId: string | null = null): Usuario {
  return { id: 'u-1', nombre: 'Ana', email: 'ana@example.com', rol, emailVerificado: true, institucionId }
}

function abrir(u: Usuario) {
  useAuthStore.setState({ accessToken: 'token', usuario: u })
  return renderConQuery(<ConfiguracionModal onCerrar={() => {}} />)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ConfiguracionModal > Institución', () => {
  it('un alumno sin institución se une con el código y la sesión queda con su institucionId', async () => {
    mocks.unirse.mockResolvedValue(usuario('ESTUDIANTE', 'inst-1'))
    abrir(usuario('ESTUDIANTE'))

    fireEvent.click(screen.getByRole('button', { name: /Institución/ }))
    fireEvent.change(screen.getByLabelText(/Código de invitación/), { target: { value: 'demo2026' } })
    fireEvent.click(screen.getByRole('button', { name: 'Unirme' }))

    await waitFor(() => expect(mocks.unirse).toHaveBeenCalledWith('DEMO2026'))
    expect(await screen.findByText(/Ya perteneces a una institución/)).toBeInTheDocument()
    expect(useAuthStore.getState().usuario?.institucionId).toBe('inst-1')
  })

  it('no se ofrece al coordinador ni a quien ya pertenece a una institución', () => {
    abrir(usuario('COORDINADOR'))
    expect(screen.queryByRole('button', { name: /Institución/ })).not.toBeInTheDocument()
    cleanup()

    abrir(usuario('DOCENTE', 'inst-1'))
    expect(screen.queryByRole('button', { name: /Institución/ })).not.toBeInTheDocument()
  })
})
