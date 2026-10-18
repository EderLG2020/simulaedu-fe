import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HistorialSimulacro } from '../../api/simulacrosApi'
import HistorialSimulacroPage from './HistorialSimulacroPage'
import { renderConQuery } from '../../test/conQuery'

const listar = vi.hoisted(() => vi.fn())
vi.mock('../../api/simulacrosApi', () => ({ listarHistorial: (...a: unknown[]) => listar(...a) }))

function item(n: number, parcial: Partial<HistorialSimulacro> = {}): HistorialSimulacro {
  return {
    simulacroId: `s-${n}`,
    examenNombre: `Simulacro ${n}`,
    universidadNombre: 'Universidad Nacional Mayor de San Marcos',
    fecha: `2026-09-${String(20 - n).padStart(2, '0')}T18:42:00Z`,
    puntajeTotal: 50,
    estado: 'FINALIZADO',
    ...parcial,
  }
}

function pagina(data: HistorialSimulacro[], meta: { page?: number; total?: number; totalPages?: number } = {}) {
  return Promise.resolve({ data, meta: { page: 1, limit: 20, total: data.length, totalPages: 1, ...meta } })
}

function renderPagina() {
  return renderConQuery(
    <MemoryRouter>
      <HistorialSimulacroPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('HistorialSimulacroPage', () => {
  it('muestra el resumen, la evolución y cada simulacro con su estado', async () => {
    listar.mockReturnValue(
      pagina([
        item(1, { examenNombre: 'Simulacro General PUCP 2026', universidadNombre: 'Pontificia Universidad Católica del Perú', puntajeTotal: 82.25 }),
        item(2, { puntajeTotal: 58.5, estado: 'FINALIZADO_POR_TIEMPO' }),
        item(3, { puntajeTotal: 45 }),
      ]),
    )
    renderPagina()

    const rendidos = await screen.findByRole('group', { name: 'Simulacros rendidos' })
    expect(within(rendidos).getByText('3')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Mejor puntaje' })).getByText('82.25')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Puntaje promedio' })).getByText('61.92')).toBeInTheDocument()

    expect(screen.getByRole('img', { name: /Evolución de tu puntaje/ })).toBeInTheDocument()

    const fila = screen.getAllByRole('listitem', { name: 'Simulacro General PUCP 2026' })[0]
    expect(within(fila).getByText('Pontificia Universidad Católica del Perú')).toBeInTheDocument()
    expect(within(fila).getByTitle('Finalizado')).toBeInTheDocument()
    expect(screen.getByTitle('Finalizado por tiempo')).toBeInTheDocument()
  })

  it('invita a rendir el primer simulacro cuando no hay historial', async () => {
    listar.mockReturnValue(pagina([]))
    renderPagina()

    expect(await screen.findByText('Todavía no has rendido ningún simulacro')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Rendir mi primer simulacro/ })).toHaveAttribute('href', '/examenes')
  })

  it('permite reintentar si falla la carga', async () => {
    listar.mockRejectedValueOnce(new Error('red')).mockReturnValue(pagina([item(1)]))
    renderPagina()

    fireEvent.click(await screen.findByRole('button', { name: /Reintentar/ }))
    expect(await screen.findAllByRole('listitem', { name: 'Simulacro 1' })).not.toHaveLength(0)
    expect(listar).toHaveBeenCalledTimes(2)
  })

  it('en plan Free (solo llega el último pese a haber más) avisa que el resto está bloqueado y oculta la paginación', async () => {
    listar.mockReturnValue(pagina([item(1)], { total: 12, totalPages: 12 }))
    renderPagina()

    expect(await screen.findByText(/Tienes 12 simulacros rendidos/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Siguiente/ })).not.toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Simulacros rendidos' })).getByText('12')).toBeInTheDocument()
  })

  it('pagina hacia adelante', async () => {
    const veinte = Array.from({ length: 20 }, (_, i) => item(i))
    listar.mockReturnValue(pagina(veinte, { total: 47, totalPages: 3 }))
    renderPagina()

    expect(await screen.findByText('Página 1 de 3 (47 simulacros)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(listar).toHaveBeenLastCalledWith(2, 20)
  })
})
