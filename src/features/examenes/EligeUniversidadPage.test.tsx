import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../api/authApi'
import type { ExamenResumen } from '../../api/examenesApi'
import { useAuthStore } from '../../stores/authStore'
import EligeUniversidadPage from './EligeUniversidadPage'

const UNI = { id: 'u-uni', nombre: 'Universidad Nacional de Ingenieria', siglas: 'UNI', tipo: 'ADMISION' as const }
const ING_A1 = { id: 'u-a1', nombre: 'Inglés A1', siglas: 'ING-A1', tipo: 'IDIOMAS' as const }
const ING_A2 = { id: 'u-a2', nombre: 'Inglés A2', siglas: 'ING-A2', tipo: 'IDIOMAS' as const }

const mocks = vi.hoisted(() => ({ perfil: vi.fn() }))

vi.mock('../../api/universidadesApi', () => ({ listarUniversidades: () => Promise.resolve([UNI, ING_A1, ING_A2]) }))
vi.mock('../../api/examenesApi', () => ({
  listarExamenesPublicados: () =>
    Promise.resolve([
      { id: 'ex-1', universidadId: ING_A1.id, tipo: 'SIMULACRO_COMPLETO' },
      { id: 'ex-2', universidadId: ING_A1.id, tipo: 'PRACTICA_TEMA' },
      { id: 'ex-3', universidadId: ING_A1.id, tipo: 'PRACTICA_TEMA' },
    ] as ExamenResumen[]),
}))
vi.mock('../../api/usuariosApi', () => ({ obtenerPerfil: () => mocks.perfil() }))
vi.mock('../home/StudentHeader', () => ({ default: () => null }))
vi.mock('../landing/Reveal', () => ({ default: ({ children, className }: { children: ReactNode; className?: string }) => <div className={className}>{children}</div> }))

const usuarioBase: Usuario = { id: 'est-1', nombre: 'Ana', email: 'ana@example.com', rol: 'ESTUDIANTE', emailVerificado: true }

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/examenes']}>
      <EligeUniversidadPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: 'token', usuario: usuarioBase })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('EligeUniversidadPage', () => {
  it('muestra cuantos simulacros y practicas tiene cada programa', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, planIncluyeProgramas: true })
    renderPagina()

    const a1 = await screen.findByRole('button', { name: /Inglés A1/ })
    expect(a1).toHaveTextContent('1 simulacro · 2 prácticas')
    expect(screen.getByRole('button', { name: /Inglés A2/ })).toHaveTextContent('Sin examenes aún')
  })

  it('avisa de Premium una sola vez por seccion, no en cada tarjeta', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, planIncluyeProgramas: false })
    renderPagina()

    expect(await screen.findAllByText('Incluido en Premium')).toHaveLength(1)
  })
})
