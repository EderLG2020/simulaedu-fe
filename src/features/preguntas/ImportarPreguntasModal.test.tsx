import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import ImportarPreguntasModal from './ImportarPreguntasModal'

const mocks = vi.hoisted(() => ({ importar: vi.fn(), plantilla: vi.fn() }))

vi.mock('../../api/preguntasApi', () => ({
  importarPreguntasArchivo: (...args: unknown[]) => mocks.importar(...args),
  descargarPlantillaImportacion: () => mocks.plantilla(),
}))

function archivo(nombre: string, contenido = 'curso,tema') {
  return new File([contenido], nombre)
}

function elegir(file: File) {
  fireEvent.change(screen.getByTestId('input-archivo'), { target: { files: [file] } })
}

describe('ImportarPreguntasModal', () => {
  const onCerrar = vi.fn()
  const onImportado = vi.fn()

  beforeEach(() => {
    mocks.importar.mockReset()
    onCerrar.mockReset()
    onImportado.mockReset()
  })

  afterEach(cleanup)

  it('rechaza archivos que no son .csv ni .zip sin llamar al backend', () => {
    render(<ImportarPreguntasModal onCerrar={onCerrar} onImportado={onImportado} />)

    elegir(archivo('preguntas.xlsx'))

    expect(screen.getByRole('alert').textContent).toContain('.csv o .zip')
    expect((screen.getByRole('button', { name: 'Importar' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('muestra el resumen con los errores por fila y recarga el listado al cerrar', async () => {
    mocks.importar.mockResolvedValue({
      totalFilas: 3,
      creadas: 2,
      preguntaIds: ['p1', 'p2'],
      errores: [{ fila: 4, mensaje: "El tema 'Algebr' no existe en el curso 'Matematica'." }],
    })
    render(<ImportarPreguntasModal onCerrar={onCerrar} onImportado={onImportado} />)

    const csv = archivo('banco.csv')
    elegir(csv)
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }))

    expect((await screen.findByTestId('total-creadas')).textContent).toBe('2')
    expect(mocks.importar).toHaveBeenCalledWith(csv)
    expect(screen.getByText("El tema 'Algebr' no existe en el curso 'Matematica'.")).toBeTruthy()

    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[1])
    expect(onImportado).toHaveBeenCalledOnce()
    expect(onCerrar).toHaveBeenCalledOnce()
  })

  it('muestra el error del backend cuando el archivo completo es invalido', async () => {
    mocks.importar.mockRejectedValue(new ApiError('REGLA_DE_NEGOCIO_INVALIDA', 'El ZIP no contiene ningun archivo .csv.'))
    render(<ImportarPreguntasModal onCerrar={onCerrar} onImportado={onImportado} />)

    elegir(archivo('banco.zip'))
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }))

    expect((await screen.findByRole('alert')).textContent).toContain('El ZIP no contiene ningun archivo .csv.')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onImportado).not.toHaveBeenCalled()
  })
})
