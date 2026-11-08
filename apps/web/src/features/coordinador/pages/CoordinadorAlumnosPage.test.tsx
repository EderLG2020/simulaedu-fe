import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AlumnoCoordinador, InstitucionCoordinador } from '../api/coordinadorApi'
import { renderConQuery } from '../../../shared/test/conQuery'
import CoordinadorAlumnosPage from './CoordinadorAlumnosPage'

const INSTITUCION: InstitucionCoordinador = {
  id: 'inst-1',
  nombre: 'Colegio Demo',
  tipo: 'COLEGIO',
  licenciasTotales: 10,
  licenciasUsadas: 1,
  licenciasDisponibles: 9,
  codigoInvitacion: 'DEMO2026',
}

function alumno(id: string, nombre: string, extra: Partial<AlumnoCoordinador> = {}): AlumnoCoordinador {
  return {
    id,
    nombre,
    email: `${id}@colegio.pe`,
    licenciaAsignada: false,
    ultimaActividad: null,
    inactivo: true,
    totalSimulacros: 0,
    puntajePromedio: null,
    ...extra,
  }
}

const ALUMNOS = [
  alumno('a1', 'Ana Torres', { licenciaAsignada: true, inactivo: false, ultimaActividad: '2026-11-07T10:00:00Z', totalSimulacros: 3, puntajePromedio: 812.5 }),
  alumno('a2', 'Bruno Díaz'),
  alumno('a3', 'Carla Ruiz'),
]

const mocks = vi.hoisted(() => ({
  lote: vi.fn(),
  quitar: vi.fn(),
  importar: vi.fn(),
}))

vi.mock('../api/coordinadorApi', () => ({
  obtenerInstitucion: () => Promise.resolve(INSTITUCION),
  listarAlumnos: () => Promise.resolve(ALUMNOS),
  asignarLicencia: vi.fn(),
  revocarLicencia: vi.fn(),
  regenerarCodigoInvitacion: vi.fn(),
  asignarLicenciasEnLote: (...args: unknown[]) => mocks.lote(...args),
  quitarAlumnoDeInstitucion: (...args: unknown[]) => mocks.quitar(...args),
  importarAlumnos: (...args: unknown[]) => mocks.importar(...args),
}))

function renderPagina() {
  return renderConQuery(
    <MemoryRouter>
      <CoordinadorAlumnosPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CoordinadorAlumnosPage', () => {
  it('muestra el código de invitación y marca a los alumnos inactivos', async () => {
    renderPagina()

    expect(await screen.findByLabelText('Código de invitación')).toHaveTextContent('DEMO2026')
    const fila = (await screen.findByText('Bruno Díaz')).closest('li')!
    expect(within(fila).getByText('Inactivo')).toBeInTheDocument()
    expect(within(fila).getByText(/Última actividad: Nunca/)).toBeInTheDocument()
  })

  it('asigna licencias en lote a los seleccionados e informa el resultado', async () => {
    mocks.lote.mockResolvedValue({ asignadas: 1, yaTenian: 0, sinLicenciaDisponible: 1 })
    renderPagina()

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Seleccionar a Bruno Díaz' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar a Carla Ruiz' }))
    fireEvent.click(screen.getByRole('button', { name: 'Asignar licencias' }))

    await waitFor(() => expect(mocks.lote).toHaveBeenCalledWith(['a2', 'a3']))
    expect(await screen.findByText(/1 licencia asignada · 1 alumno quedó sin licencia/)).toBeInTheDocument()
  })

  it('quitar a un alumno pide confirmación en un modal antes de llamar a la API', async () => {
    mocks.quitar.mockResolvedValue(undefined)
    renderPagina()

    const fila = (await screen.findByText('Carla Ruiz')).closest('li')!
    fireEvent.click(within(fila).getByRole('button', { name: /Quitar/ }))
    const dialogo = screen.getByRole('dialog', { name: 'Quitar alumno de la institución' })
    expect(mocks.quitar).not.toHaveBeenCalled()

    fireEvent.click(within(dialogo).getByRole('button', { name: 'Quitar alumno' }))
    await waitFor(() => expect(mocks.quitar).toHaveBeenCalledWith('a3'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('importa un CSV pegado y muestra creados, ya registrados y filas inválidas', async () => {
    mocks.importar.mockResolvedValue({
      creados: [{ nombre: 'Diego Paz', email: 'diego@colegio.pe' }],
      yaRegistrados: ['ana@colegio.pe'],
      invalidas: [{ linea: 4, motivo: 'Correo inválido' }],
    })
    renderPagina()

    fireEvent.click(await screen.findByRole('button', { name: 'Importar CSV' }))
    const dialogo = screen.getByRole('dialog', { name: 'Importar alumnos' })
    const csv = 'nombre,email\nDiego Paz,diego@colegio.pe'
    fireEvent.change(within(dialogo).getByLabelText(/Contenido del CSV/), { target: { value: csv } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Importar' }))

    await waitFor(() => expect(mocks.importar).toHaveBeenCalledWith(csv))
    expect(await within(dialogo).findByText(/1 cuenta creada/)).toBeInTheDocument()
    expect(within(dialogo).getByText('ana@colegio.pe')).toBeInTheDocument()
    expect(within(dialogo).getByText('Línea 4: Correo inválido')).toBeInTheDocument()
  })
})
