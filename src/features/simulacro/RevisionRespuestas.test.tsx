import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PreguntaRevision, RevisionSimulacro } from '../../api/simulacrosApi'
import RevisionRespuestas from './RevisionRespuestas'
import { renderConQuery } from '../../test/conQuery'

const mocks = vi.hoisted(() => ({ revision: vi.fn() }))
vi.mock('../../api/simulacrosApi', () => ({ obtenerRevision: (...a: unknown[]) => mocks.revision(...a) }))

function pregunta(numero: number, parcial: Partial<PreguntaRevision>): PreguntaRevision {
  return {
    numero,
    respuestaSimulacroId: `r-${numero}`,
    preguntaId: `p-${numero}`,
    tipoPregunta: 'OPCION_UNICA',
    dificultad: 'MEDIA',
    temaNombre: 'Álgebra',
    enunciadoHtml: `<p>Enunciado ${numero}</p>`,
    metadataTipo: {},
    alternativas: [
      { id: `a-${numero}-1`, textoHtml: '9', imagenUrl: null, orden: 1, esCorrecta: true },
      { id: `a-${numero}-2`, textoHtml: '12', imagenUrl: null, orden: 2, esCorrecta: false },
    ],
    respuestaDada: {},
    resultado: 'EN_BLANCO',
    puntajeObtenido: null,
    explicacionHtml: null,
    ...parcial,
  }
}

function revision(parcial: Partial<RevisionSimulacro> = {}): RevisionSimulacro {
  return {
    simulacroId: 'sim-1',
    explicacionesDisponibles: true,
    preguntas: [
      pregunta(1, { resultado: 'CORRECTA', respuestaDada: { alternativaId: 'a-1-1' } }),
      pregunta(2, { resultado: 'INCORRECTA', respuestaDada: { alternativaId: 'a-2-2' }, explicacionHtml: '<p>Se divide 27 entre 3.</p>' }),
      pregunta(3, {
        tipoPregunta: 'NUMERICA',
        alternativas: [],
        metadataTipo: { valorCorrecto: 4 },
        respuestaDada: { valor: 5 },
        resultado: 'INCORRECTA',
      }),
      pregunta(4, {}),
    ],
    ...parcial,
  }
}

function abrir(numero: number) {
  const tarjeta = screen.getByText(`Enunciado ${numero}`, { selector: 'p.truncate' }).closest('details')!
  fireEvent.click(within(tarjeta).getByText(`Enunciado ${numero}`, { selector: 'p.truncate' }))
  tarjeta.open = true
  return tarjeta
}

beforeEach(() => mocks.revision.mockReset())
afterEach(cleanup)

describe('RevisionRespuestas', () => {
  it('abre en las incorrectas y muestra la respuesta del alumno, la correcta y la explicacion', async () => {
    mocks.revision.mockResolvedValue(revision())
    renderConQuery(<RevisionRespuestas simulacroId="sim-1" />)

    expect(await screen.findByRole('button', { name: 'Incorrectas (2)' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Enunciado 1', { selector: 'p.truncate' })).toBeNull()

    const tarjeta = abrir(2)
    const [correcta, elegida] = within(tarjeta).getAllByRole('listitem')
    expect(within(correcta).getByText('Respuesta correcta')).toBeInTheDocument()
    expect(within(elegida).getByText('Tu respuesta')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Se divide 27 entre 3.')).toBeInTheDocument()

    const numerica = abrir(3)
    expect(within(numerica).getByText('5')).toBeInTheDocument()
    expect(within(numerica).getByText('4')).toBeInTheDocument()
    expect(mocks.revision).toHaveBeenCalledWith('sim-1')
  })

  it('el filtro cambia las preguntas que se ven', async () => {
    mocks.revision.mockResolvedValue(revision())
    renderConQuery(<RevisionRespuestas simulacroId="sim-1" />)

    fireEvent.click(await screen.findByRole('button', { name: 'En blanco (1)' }))
    expect(screen.getByText('Enunciado 4', { selector: 'p.truncate' })).toBeInTheDocument()
    expect(screen.queryByText('Enunciado 2', { selector: 'p.truncate' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Todas (4)' }))
    expect(screen.getByText('Enunciado 1', { selector: 'p.truncate' })).toBeInTheDocument()
  })

  it('sin Premium avisa que la explicacion es del plan Premium', async () => {
    // Sin el beneficio el backend no manda ninguna explicacion.
    const sinExplicaciones = revision().preguntas.map((p) => ({ ...p, explicacionHtml: null }))
    mocks.revision.mockResolvedValue(revision({ explicacionesDisponibles: false, preguntas: sinExplicaciones }))
    renderConQuery(<RevisionRespuestas simulacroId="sim-1" />)

    expect(await screen.findByText(/Con el plan Premium verás además la explicación/)).toBeInTheDocument()
    const tarjeta = abrir(2)
    expect(within(tarjeta).getByText(/disponible con el plan Premium/)).toBeInTheDocument()
  })

  it('si todo salio bien abre en todas', async () => {
    mocks.revision.mockResolvedValue(revision({ preguntas: [pregunta(1, { resultado: 'CORRECTA', respuestaDada: { alternativaId: 'a-1-1' } })] }))
    renderConQuery(<RevisionRespuestas simulacroId="sim-1" />)

    expect(await screen.findByRole('button', { name: 'Todas (1)' })).toHaveAttribute('aria-pressed', 'true')
  })
})
