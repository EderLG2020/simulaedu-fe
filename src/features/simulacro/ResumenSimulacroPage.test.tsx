import { cleanup, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ResumenSimulacro } from '../../api/simulacrosApi'
import ResumenSimulacroPage from './ResumenSimulacroPage'
import { renderConQuery } from '../../test/conQuery'

const resumen: ResumenSimulacro = {
  simulacroId: 'sim-1',
  puntajeTotal: 71.875,
  tiempoUsadoSeg: 2892,
  correctas: 16,
  incorrectas: 5,
  enBlanco: 3,
  desglosePorTema: [
    { temaId: 't-1', temaNombre: 'Álgebra', correctas: 3, incorrectas: 0, enBlanco: 1 },
    { temaId: 't-2', temaNombre: 'Cinemática', correctas: 2, incorrectas: 1, enBlanco: 1 },
  ],
}

function renderPagina(state: unknown) {
  return renderConQuery(
    <MemoryRouter initialEntries={[{ pathname: '/simulacros/sim-1/resumen', state }]}>
      <Routes>
        <Route path="/simulacros/:id/resumen" element={<ResumenSimulacroPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

// La revision pregunta por pregunta tiene su propio test (RevisionRespuestas.test.tsx): aqui queda cargando.
vi.mock('../../api/simulacrosApi', () => ({ obtenerRevision: () => new Promise(() => {}) }))

afterEach(cleanup)

describe('ResumenSimulacroPage', () => {
  it('muestra puntaje, conteos, tiempo y desglose por tema', () => {
    renderPagina({ resumen, examen: { nombre: 'Simulacro General UNMSM 2026', universidadNombre: 'UNMSM', puntajeTotal: 100, duracionSeg: 10800 } })

    expect(screen.getByRole('heading', { name: 'Resultado del simulacro' })).toBeInTheDocument()
    expect(screen.getByText('Simulacro General UNMSM 2026')).toBeInTheDocument()
    expect(screen.getByText('71.88')).toBeInTheDocument()
    expect(screen.getByText('/ 100 pts')).toBeInTheDocument()
    expect(screen.getByText('48m 12s')).toBeInTheDocument()
    expect(screen.getByText('de 3h 00m')).toBeInTheDocument()

    const correctas = screen.getByRole('group', { name: 'Correctas' })
    expect(within(correctas).getByText('16')).toBeInTheDocument()

    const algebra = screen.getByRole('listitem', { name: 'Álgebra' })
    expect(within(algebra).getByText('75% de acierto')).toBeInTheDocument()
    expect(within(algebra).getByText(/4 ítems/)).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Ver mi historial/ })).toHaveAttribute('href', '/simulacros/historial')
    expect(screen.getByRole('link', { name: /Volver a exámenes/ })).toHaveAttribute('href', '/examenes')
  })

  it('funciona sin los datos del examen (sin denominador ni duración total)', () => {
    renderPagina({ resumen })

    expect(screen.getByText('71.88')).toBeInTheDocument()
    expect(screen.queryByText(/\/ \d+ pts/)).not.toBeInTheDocument()
    expect(screen.getByText('48m 12s')).toBeInTheDocument()
  })

  it('explica cuando no hay resumen disponible', () => {
    renderPagina(null)

    expect(screen.getByText('No hay un resumen para mostrar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver mi historial/ })).toBeInTheDocument()
  })
})
