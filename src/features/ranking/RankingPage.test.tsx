import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../api/authApi'
import { ApiError } from '../../api/client'
import type { Ranking, RankingEntrada } from '../../api/rankingApi'
import { useAuthStore } from '../../stores/authStore'
import RankingPage from './RankingPage'
import { renderConQuery } from '../../test/conQuery'

const UNI = { id: 'u-uni', nombre: 'Universidad Nacional de Ingenieria', siglas: 'UNI', tipo: 'ADMISION' as const }

const mocks = vi.hoisted(() => ({ ranking: vi.fn() }))

vi.mock('../../api/rankingApi', async (original) => ({
  ...(await original<typeof import('../../api/rankingApi')>()),
  obtenerRanking: (...args: unknown[]) => mocks.ranking(...args),
}))
vi.mock('../../api/universidadesApi', () => ({ listarUniversidades: () => Promise.resolve([UNI]) }))

const usuarioBase: Usuario = { id: 'est-1', nombre: 'Ana', email: 'ana@example.com', rol: 'ESTUDIANTE', emailVerificado: true }

function entrada(posicion: number, nombre: string, esUsuarioActual = false): RankingEntrada {
  return { usuarioId: `u-${posicion}`, nombre, posicion, puntajeReferencia: 100 - posicion, esUsuarioActual }
}

function ranking(entradas: RankingEntrada[]): Ranking {
  return {
    ambito: 'GLOBAL',
    referenciaId: null,
    periodo: 'HISTORICO',
    fechaPeriodo: '1970-01-01',
    entradas,
    posicionUsuarioActual: entradas.find((e) => e.esUsuarioActual)?.posicion ?? null,
  }
}

function renderPagina() {
  return renderConQuery(
    <MemoryRouter>
      <RankingPage />
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

describe('RankingPage', () => {
  it('con plan Free muestra que el ranking es Premium, sin filtros', async () => {
    mocks.ranking.mockRejectedValue(new ApiError('RANKING_SIN_ACCESO', 'El ranking es un beneficio exclusivo...'))
    renderPagina()

    expect(await screen.findByText('Compárate con otros postulantes')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Periodo' })).not.toBeInTheDocument()
  })

  it('muestra el podio, el resto en la tabla y la posicion del alumno', async () => {
    mocks.ranking.mockResolvedValue(
      ranking([entrada(1, 'Bruno'), entrada(2, 'Carla'), entrada(3, 'Diego'), entrada(4, 'Ana', true), entrada(5, 'Elena')]),
    )
    renderPagina()

    const podio = await screen.findByRole('list', { name: 'Podio' })
    expect(within(podio).getAllByRole('listitem')).toHaveLength(3)
    const resto = screen.getByRole('list', { name: 'Resto del ranking' })
    expect(within(resto).getByText('Ana')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tu posición' })).toHaveTextContent('#4')
  })

  it('avisa si el alumno todavia no aparece en el ranking', async () => {
    mocks.ranking.mockResolvedValue(ranking([entrada(1, 'Bruno')]))
    renderPagina()

    expect(await screen.findByText('Todavía no apareces en este ranking')).toBeInTheDocument()
  })

  it('con universidad meta empieza por su ranking y puede pasar al global', async () => {
    useAuthStore.setState({ usuario: { ...usuarioBase, universidadObjetivoId: UNI.id } })
    mocks.ranking.mockResolvedValue(ranking([]))
    renderPagina()

    expect(await screen.findByText('Aún no hay nadie en este ranking')).toBeInTheDocument()
    expect(mocks.ranking).toHaveBeenLastCalledWith('UNIVERSIDAD', 'HISTORICO', UNI.id)

    fireEvent.click(screen.getByRole('button', { name: /Global/ }))
    await screen.findByText('Aún no hay nadie en este ranking')
    expect(mocks.ranking).toHaveBeenLastCalledWith('GLOBAL', 'HISTORICO', null)
  })
})
