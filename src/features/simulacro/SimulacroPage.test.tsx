import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PreguntaSimulacro, SimulacroActual } from '../../api/simulacrosApi'
import SimulacroPage from './SimulacroPage'
import { renderConQuery } from '../../test/conQuery'

function pregunta(n: number, parcial: Partial<PreguntaSimulacro> = {}): PreguntaSimulacro {
  return {
    respuestaSimulacroId: `r-${n}`,
    preguntaId: `p-${n}`,
    tipoPregunta: 'OPCION_UNICA',
    dificultad: 'MEDIA',
    enunciadoHtml: `<p>Enunciado de la pregunta ${n}</p>`,
    metadataTipo: {},
    tiempoSugeridoSeg: null,
    alternativas: [
      { id: `a-${n}-1`, textoHtml: '8 campanadas', imagenUrl: null, orden: 1 },
      { id: `a-${n}-2`, textoHtml: '10 campanadas', imagenUrl: null, orden: 2 },
    ],
    respuestaDada: {},
    marcadaParaRevision: false,
    ...parcial,
  }
}

function simulacro(parcial: Partial<SimulacroActual> = {}): SimulacroActual {
  return {
    id: 'sim-1',
    examenId: 'ex-1',
    timestampInicio: new Date().toISOString(),
    timestampLimite: new Date(Date.now() + 3_600_000).toISOString(),
    estado: 'EN_CURSO',
    modo: 'PRACTICA_LIBRE',
    navegacion: 'LIBRE',
    permitePausa: true,
    preguntas: [pregunta(1), pregunta(2, { respuestaDada: { alternativaId: 'a-2-1' }, marcadaParaRevision: true }), pregunta(3)],
    ...parcial,
  }
}

const api = vi.hoisted(() => ({
  reanudar: vi.fn(),
  autoguardar: vi.fn(),
  finalizar: vi.fn(),
  marcar: vi.fn(),
  pausar: vi.fn(),
}))

vi.mock('../../api/simulacrosApi', () => ({
  reanudarSimulacro: (...a: unknown[]) => api.reanudar(...a),
  obtenerTiempoRestante: () => Promise.resolve({ segundosRestantes: 3590, expirado: false }),
  autoguardarRespuesta: (...a: unknown[]) => api.autoguardar(...a),
  finalizarSimulacro: (...a: unknown[]) => api.finalizar(...a),
  marcarParaRevision: (...a: unknown[]) => api.marcar(...a),
  pausarSimulacro: (...a: unknown[]) => api.pausar(...a),
}))
vi.mock('../../api/examenesApi', () => ({
  obtenerExamen: () =>
    Promise.resolve({ id: 'ex-1', nombre: 'Simulacro General UNMSM 2026', universidadNombre: 'UNMSM', puntajeTotal: 100, duracionSeg: 3600, preguntas: [] }),
}))

function PantallaResumen() {
  const location = useLocation()
  return <p>resumen: {JSON.stringify(location.state)}</p>
}

function renderPagina(actual: SimulacroActual) {
  api.reanudar.mockResolvedValue(actual)
  return renderConQuery(
    <MemoryRouter initialEntries={[{ pathname: '/simulacros/sim-1', state: { simulacro: actual } }]}>
      <Routes>
        <Route path="/simulacros/:id" element={<SimulacroPage />} />
        <Route path="/simulacros/:id/resumen" element={<PantallaResumen />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  api.autoguardar.mockResolvedValue({})
  api.marcar.mockResolvedValue({})
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SimulacroPage', () => {
  it('explica que no hay preguntas en vez de mostrar solo el cronómetro', async () => {
    renderPagina(simulacro({ preguntas: [] }))

    expect(await screen.findByText(/Este simulacro no tiene preguntas/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver a exámenes' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Finalizar simulacro/ })).not.toBeInTheDocument()
  })

  it('muestra el nombre del examen, el progreso y guarda al elegir una alternativa', async () => {
    renderPagina(simulacro())

    expect(await screen.findByText('Simulacro General UNMSM 2026')).toBeInTheDocument()
    expect(screen.getByText('1 de 3 respondidas')).toBeInTheDocument()
    expect(screen.getByText('Pregunta 1 de 3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /10 campanadas/ }))
    expect(api.autoguardar).toHaveBeenCalledWith('sim-1', 'r-1', { alternativaId: 'a-1-2' })
    expect(await screen.findByText('2 de 3 respondidas')).toBeInTheDocument()
  })

  it('permite responder con el teclado (A-E) y navegar con las flechas', async () => {
    renderPagina(simulacro())
    await screen.findByText('Pregunta 1 de 3')

    fireEvent.keyDown(window, { key: 'b' })
    expect(api.autoguardar).toHaveBeenCalledWith('sim-1', 'r-1', { alternativaId: 'a-1-2' })

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('Pregunta 2 de 3')).toBeInTheDocument()
  })

  it('en navegación secuencial avanza con Siguiente pero no deja saltar a preguntas no vistas', async () => {
    renderPagina(simulacro({ navegacion: 'SECUENCIAL' }))
    await screen.findByText('Pregunta 1 de 3')
    expect(screen.getByRole('button', { name: /^Pregunta 3,/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(screen.getByText('Pregunta 2 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Pregunta 3,/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /^Pregunta 1,/ }))
    expect(screen.getByText('Pregunta 1 de 3')).toBeInTheDocument()
  })

  it('borrar respuesta deja la pregunta en blanco', async () => {
    renderPagina(simulacro())
    await screen.findByText('Pregunta 1 de 3')
    fireEvent.click(screen.getByRole('button', { name: /^Pregunta 2,/ }))

    fireEvent.click(screen.getByRole('button', { name: /Borrar respuesta/ }))
    expect(api.autoguardar).toHaveBeenCalledWith('sim-1', 'r-2', {})
  })

  it('pide confirmación antes de finalizar, con el resumen de lo respondido', async () => {
    api.finalizar.mockResolvedValue({ simulacroId: 'sim-1', puntajeTotal: 20, tiempoUsadoSeg: 60, correctas: 1, incorrectas: 0, enBlanco: 2, desglosePorTema: [] })
    renderPagina(simulacro())
    await screen.findByText('Pregunta 1 de 3')

    fireEvent.click(screen.getByRole('button', { name: /Finalizar simulacro/ }))
    const modal = screen.getByRole('dialog', { name: '¿Finalizar simulacro?' })
    expect(within(modal).getByText('Sin responder').previousSibling).toHaveTextContent('2')
    expect(api.finalizar).not.toHaveBeenCalled()

    fireEvent.click(within(modal).getByRole('button', { name: 'Seguir respondiendo' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Finalizar simulacro/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, finalizar' }))
    expect(await screen.findByText(/resumen:/)).toHaveTextContent('Simulacro General UNMSM 2026')
    expect(api.finalizar).toHaveBeenCalledWith('sim-1')
  })

  it('en pausa oculta la pregunta y ofrece reanudar', async () => {
    renderPagina(simulacro({ estado: 'PAUSADO' }))

    expect(await screen.findByText('Simulacro en pausa')).toBeInTheDocument()
    expect(screen.queryByText('Enunciado de la pregunta 1')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Reanudar/ }).length).toBeGreaterThan(0)
  })
})
