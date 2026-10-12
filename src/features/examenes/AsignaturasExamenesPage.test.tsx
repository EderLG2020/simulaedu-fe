import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../api/authApi'
import { ApiError } from '../../api/client'
import type { ExamenResumen } from '../../api/examenesApi'
import { useAuthStore } from '../../stores/authStore'
import AsignaturasExamenesPage from './AsignaturasExamenesPage'

const UNMSM = { id: 'u-unmsm', nombre: 'Universidad Nacional Mayor de San Marcos', siglas: 'UNMSM', tipo: 'ADMISION' as const }
const UNI = { id: 'u-uni', nombre: 'Universidad Nacional de Ingenieria', siglas: 'UNI', tipo: 'ADMISION' as const }
const INGLES = { id: 'u-ing', nombre: 'Ingles', siglas: 'ING', tipo: 'IDIOMAS' as const }

function examen(parcial: Partial<ExamenResumen>): ExamenResumen {
  return {
    id: 'ex-1',
    universidadId: UNI.id,
    universidadNombre: UNI.nombre,
    autorId: null,
    nombre: 'Simulacro General UNI 2026',
    duracionSeg: 3600,
    permitePausa: false,
    puntajeTotal: 100,
    tipoSeleccion: 'FIJA',
    reglasCalificacion: {},
    navegacion: 'LIBRE',
    estado: 'PUBLICADO',
    preguntas: [],
    areas: [{ id: 'a-1', cursoId: 'c-mat', cursoNombre: 'Matematica', temaId: null, cantidadPreguntas: 2, dificultadObjetivo: 'MIXTA', puntajeAsignado: 100 }],
    disponible: true,
    tipo: 'SIMULACRO_COMPLETO',
    descripcion: null,
    temasCubiertos: [{ cursoId: 'c-mat', cursoNombre: 'Matematica', temaId: null, temaNombre: null }],
    cantidadPreguntas: 2,
    ...parcial,
  }
}

function tema(cursoId: string, cursoNombre: string, temaNombre: string) {
  return { cursoId, cursoNombre, temaId: `t-${temaNombre}`, temaNombre }
}

function practica(id: string, temaNombre: string, cursoId = 'c-mat', cursoNombre = 'Matematica'): ExamenResumen {
  return examen({
    id,
    nombre: `Práctica: ${temaNombre}`,
    tipo: 'PRACTICA_TEMA',
    descripcion: `Practica ${temaNombre}.`,
    temasCubiertos: [tema(cursoId, cursoNombre, temaNombre)],
    cantidadPreguntas: 8,
    duracionSeg: 900,
  })
}

const mocks = vi.hoisted(() => ({
  perfil: vi.fn(),
  examenes: vi.fn(),
  iniciar: vi.fn(),
}))

vi.mock('../../api/universidadesApi', () => ({ listarUniversidades: () => Promise.resolve([UNMSM, UNI, INGLES]) }))
vi.mock('../../api/examenesApi', () => ({ listarExamenesPorUniversidad: () => mocks.examenes() }))
vi.mock('../../api/simulacrosApi', () => ({ iniciarSimulacro: (...args: unknown[]) => mocks.iniciar(...args) }))
vi.mock('../../api/usuariosApi', () => ({
  obtenerPerfil: () => mocks.perfil(),
  seleccionarUniversidadObjetivo: vi.fn(),
}))
vi.mock('../home/StudentHeader', () => ({ default: () => null }))
vi.mock('../landing/Reveal', () => ({ default: ({ children, className }: { children: ReactNode; className?: string }) => <div className={className}>{children}</div> }))

const usuarioBase: Usuario = { id: 'est-1', nombre: 'Ana', email: 'ana@example.com', rol: 'ESTUDIANTE', emailVerificado: true }

function renderPagina(universidadId = UNI.id) {
  return render(
    <MemoryRouter initialEntries={[`/examenes/${universidadId}`]}>
      <Routes>
        <Route path="/examenes/:universidadId" element={<AsignaturasExamenesPage />} />
        <Route path="/simulacros/:id" element={<p>pantalla del simulacro</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: 'token', usuario: usuarioBase })
  mocks.examenes.mockResolvedValue([examen({})])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AsignaturasExamenesPage', () => {
  it('bloquea los examenes de otra universidad cuando el plan Free ya tiene otra meta, y ofrece cambiarla', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNMSM.id, planLimitaUniversidades: true })
    renderPagina()

    expect(await screen.findByText(/Tu plan Free solo te permite practicar con UNMSM/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Usar UNI como mi meta/ })).toBeInTheDocument()
    const boton = await screen.findByRole('button', { name: /Bloqueado por tu plan/ })
    expect(boton).toBeDisabled()
    fireEvent.click(boton)
    expect(mocks.iniciar).not.toHaveBeenCalled()
  })

  it('no bloquea si el plan no limita universidades', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNMSM.id, planLimitaUniversidades: false })
    renderPagina()

    expect(await screen.findByRole('button', { name: /Iniciar prueba/ })).toBeEnabled()
    expect(screen.queryByText(/Tu plan Free solo te permite/)).not.toBeInTheDocument()
  })

  it('muestra la penalizacion por error solo si las reglas del examen la activan', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    mocks.examenes.mockResolvedValue([examen({ reglasCalificacion: { penaliza_incorrecta: true, fraccion_penalizacion: 0.25 } })])
    renderPagina()

    expect(await screen.findByText('Resta 1/4 de la pregunta')).toBeInTheDocument()
  })

  it('no muestra penalizacion si el examen no la tiene', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    renderPagina()

    expect(await screen.findByRole('button', { name: /Iniciar prueba/ })).toBeInTheDocument()
    expect(screen.queryByText(/Penalizacion por error/)).not.toBeInTheDocument()
  })

  it('un programa de idiomas queda bloqueado si el plan no lo incluye, sin ofrecerlo como meta', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNMSM.id, planLimitaUniversidades: true, planIncluyeProgramas: false })
    renderPagina(INGLES.id)

    expect(await screen.findByRole('button', { name: /Incluido en Premium/ })).toBeDisabled()
    expect(screen.getByText(/incluidos en el plan Premium/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /como mi meta/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Tu plan Free solo te permite/)).not.toBeInTheDocument()
  })

  it('un plan con programas extra puede rendir idiomas aunque tenga otra universidad meta', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNMSM.id, planLimitaUniversidades: true, planIncluyeProgramas: true })
    renderPagina(INGLES.id)

    expect(await screen.findByRole('button', { name: /Iniciar prueba/ })).toBeEnabled()
  })

  it('desactiva un examen sin preguntas disponibles', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    mocks.examenes.mockResolvedValue([examen({ disponible: false })])
    renderPagina()

    expect(await screen.findByText('Sin preguntas disponibles aún')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /No disponible/ })).toBeDisabled()
  })

  it('separa los simulacros completos (primero) de las practicas por tema', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    mocks.examenes.mockResolvedValue([practica('p-1', 'Algebra'), examen({ descripcion: 'Todo el temario de admision.' }), practica('p-2', 'Geometria')])
    renderPagina()

    const simulacros = await screen.findByRole('region', { name: 'Simulacros completos' })
    const practicas = screen.getByRole('region', { name: 'Prácticas por tema' })
    expect(within(simulacros).getByRole('article', { name: 'Simulacro General UNI 2026' })).toHaveTextContent('Todo el temario de admision.')
    expect(within(practicas).getAllByRole('article').map((a) => a.getAttribute('aria-label'))).toEqual(['Práctica: Algebra', 'Práctica: Geometria'])
    // Los simulacros van antes que las practicas.
    expect(simulacros.compareDocumentPosition(practicas) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('1 simulacro · 2 prácticas')).toBeInTheDocument()
  })

  it('cada examen muestra su cantidad de preguntas, duracion y temas', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    mocks.examenes.mockResolvedValue([practica('p-1', 'Algebra')])
    renderPagina()

    const tarjeta = await screen.findByRole('article', { name: 'Práctica: Algebra' })
    expect(tarjeta).toHaveTextContent('8 preguntas')
    expect(tarjeta).toHaveTextContent('15 min')
    expect(within(tarjeta).getByText('Algebra')).toBeInTheDocument()
  })

  it('oculta la seccion que no tiene examenes', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    mocks.examenes.mockResolvedValue([practica('p-1', 'Algebra')])
    renderPagina()

    expect(await screen.findByRole('region', { name: 'Prácticas por tema' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Simulacros completos' })).not.toBeInTheDocument()
    expect(screen.getByText('1 práctica')).toBeInTheDocument()
  })

  it('muestra los primeros temas y resume el resto como +N temas', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    const temas = ['Aritmetica', 'Algebra', 'Geometria', 'Trigonometria', 'Sucesiones', 'Edades'].map((t) => tema('c-mat', 'Matematica', t))
    mocks.examenes.mockResolvedValue([examen({ temasCubiertos: temas })])
    renderPagina()

    const tarjeta = await screen.findByRole('article', { name: 'Simulacro General UNI 2026' })
    expect(within(tarjeta).getByText('Trigonometria')).toBeInTheDocument()
    expect(within(tarjeta).queryByText('Sucesiones')).not.toBeInTheDocument()
    expect(within(tarjeta).getByText('+2 temas')).toBeInTheDocument()
  })

  it('con practicas de varios cursos ofrece filtrarlas por curso', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    mocks.examenes.mockResolvedValue([practica('p-1', 'Algebra'), practica('p-2', 'Sucesiones', 'c-rm', 'Razonamiento Matematico')])
    renderPagina()

    const filtros = await screen.findByRole('navigation', { name: 'Filtrar prácticas por curso' })
    fireEvent.click(within(filtros).getByRole('button', { name: /Razonamiento Matematico/ }))

    const practicas = screen.getByRole('region', { name: 'Prácticas por tema' })
    expect(within(practicas).getAllByRole('article').map((a) => a.getAttribute('aria-label'))).toEqual(['Práctica: Sucesiones'])

    fireEvent.click(within(filtros).getByRole('button', { name: /Todos/ }))
    expect(within(practicas).getAllByRole('article')).toHaveLength(2)
  })

  it('con practicas de un solo curso no muestra filtros', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    mocks.examenes.mockResolvedValue([practica('p-1', 'Algebra'), practica('p-2', 'Geometria')])
    renderPagina()

    expect(await screen.findByRole('region', { name: 'Prácticas por tema' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Filtrar prácticas por curso' })).not.toBeInTheDocument()
  })

  it('muestra el error de inicio dentro de la tarjeta del examen', async () => {
    mocks.perfil.mockResolvedValue({ ...usuarioBase, universidadObjetivoId: UNI.id, planLimitaUniversidades: true })
    mocks.iniciar.mockRejectedValue(new ApiError('REGLA_DE_NEGOCIO_INVALIDA', 'Alcanzaste el limite de simulacros este mes.'))
    renderPagina()

    fireEvent.click(await screen.findByRole('button', { name: /Iniciar prueba/ }))

    const tarjeta = screen.getByRole('article', { name: 'Simulacro General UNI 2026' })
    expect(await within(tarjeta).findByText('Alcanzaste el limite de simulacros este mes.')).toBeInTheDocument()
  })
})
