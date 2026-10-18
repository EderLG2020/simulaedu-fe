import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CursoAdmin } from '../../api/adminCursosApi'
import { renderConQuery } from '../../test/conQuery'
import AdminCursosPage from './AdminCursosPage'

const FISICA: CursoAdmin = { id: 'c-fis', nombre: 'Fisica', categoria: 'CIENCIAS', icono: 'science', temas: [] }

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
  actualizar: vi.fn(),
  crear: vi.fn(),
}))

vi.mock('../../api/adminCursosApi', () => ({
  listarCursosAdmin: () => mocks.listar(),
  actualizarCurso: (...args: unknown[]) => mocks.actualizar(...args),
  crearCurso: (...args: unknown[]) => mocks.crear(...args),
  eliminarCurso: vi.fn(),
  crearTema: vi.fn(),
  actualizarTema: vi.fn(),
  eliminarTema: vi.fn(),
}))

// jsdom no implementa matchMedia (la pagina lo usa para llevar el panel a la vista en pantallas angostas).
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('AdminCursosPage', () => {
  it('muestra el icono del curso y permite cambiarlo desde la lista de iconos disponibles', async () => {
    mocks.listar.mockResolvedValue([FISICA])
    mocks.actualizar.mockResolvedValue({ ...FISICA, icono: 'calculate' })
    renderConQuery(<AdminCursosPage />)

    fireEvent.click(await screen.findByRole('button', { name: /Fisica/ }))
    const iconos = screen.getByRole('group', { name: 'Icono' })
    expect(within(iconos).getByRole('button', { name: 'Icono science' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(within(iconos).getByRole('button', { name: 'Icono calculate' }))
    expect(within(iconos).getByRole('button', { name: 'Icono calculate' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(mocks.actualizar).toHaveBeenCalledWith('c-fis', { nombre: 'Fisica', categoria: 'CIENCIAS', icono: 'calculate' }))
  })

  it('un curso nuevo parte con el icono generico', async () => {
    mocks.listar.mockResolvedValue([])
    mocks.crear.mockResolvedValue({ ...FISICA, id: 'c-nuevo', nombre: 'Logica', categoria: 'COMUN', icono: 'auto_stories' })
    renderConQuery(<AdminCursosPage />)

    fireEvent.click(await screen.findByRole('button', { name: /Nuevo curso/ }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del curso' }), { target: { value: 'Logica' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear curso' }))

    await waitFor(() => expect(mocks.crear).toHaveBeenCalledWith({ nombre: 'Logica', categoria: 'COMUN', icono: 'auto_stories' }))
  })
})
