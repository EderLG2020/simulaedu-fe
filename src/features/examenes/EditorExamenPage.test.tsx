import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EditorExamenPage from './EditorExamenPage'

const UNI = { id: 'u-uni', nombre: 'Universidad Nacional de Ingenieria', siglas: 'UNI', tipo: 'ADMISION' as const }

const mocks = vi.hoisted(() => ({ crear: vi.fn() }))

vi.mock('../../api/universidadesApi', () => ({ listarUniversidades: () => Promise.resolve([UNI]) }))
vi.mock('../../api/cursosApi', () => ({ listarCursos: () => Promise.resolve([]) }))
vi.mock('../../api/preguntasApi', () => ({ listarPreguntas: vi.fn(), obtenerPregunta: vi.fn() }))
vi.mock('../../api/examenesApi', () => ({
  crearExamen: (...args: unknown[]) => mocks.crear(...args),
  actualizarExamen: vi.fn(),
  componerExamenAreas: vi.fn(),
  componerExamenFijo: vi.fn(),
  obtenerExamen: vi.fn(),
  publicarExamen: vi.fn(),
}))

function renderNuevo() {
  return render(
    <MemoryRouter initialEntries={['/docente/examenes/nuevo']}>
      <Routes>
        <Route path="/docente/examenes/:examenId" element={<EditorExamenPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('EditorExamenPage - tipo y descripcion', () => {
  it('envia el tipo de examen y la descripcion al crear', async () => {
    mocks.crear.mockRejectedValue(new Error('corta el flujo despues de crear'))
    renderNuevo()

    fireEvent.change(await screen.findByRole('combobox'), { target: { value: UNI.id } })
    fireEvent.change(screen.getByPlaceholderText(/Simulacro UNMSM/), { target: { value: 'Práctica: Álgebra' } })
    fireEvent.click(screen.getByRole('button', { name: /Práctica/ }))
    fireEvent.change(screen.getByRole('textbox', { name: /Descripción/ }), { target: { value: '  Ecuaciones y factorización.  ' } })
    fireEvent.click(screen.getByRole('button', { name: /Crear y continuar/ }))

    expect(mocks.crear).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'PRACTICA_TEMA', descripcion: 'Ecuaciones y factorización.' }))
  })

  it('por defecto es simulacro completo y sin descripcion; limita la descripcion a 300', async () => {
    mocks.crear.mockRejectedValue(new Error('x'))
    renderNuevo()

    fireEvent.change(await screen.findByRole('combobox'), { target: { value: UNI.id } })
    fireEvent.change(screen.getByPlaceholderText(/Simulacro UNMSM/), { target: { value: 'Simulacro UNI' } })
    expect(screen.getByRole('button', { name: /Simulacro completo/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('textbox', { name: /Descripción/ })).toHaveAttribute('maxLength', '300')
    expect(screen.getByText('0 / 300')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Crear y continuar/ }))

    expect(mocks.crear).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'SIMULACRO_COMPLETO', descripcion: null }))
  })
})
