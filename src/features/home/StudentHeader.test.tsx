import { cleanup, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../api/authApi'
import { useAuthStore } from '../../stores/authStore'
import StudentHeader from './StudentHeader'
import { renderConQuery } from '../../test/conQuery'

vi.mock('../perfil/ConfiguracionModal', () => ({ default: () => null }))

const usuario: Usuario = { id: 'est-1', nombre: 'Ana', email: 'ana@example.com', rol: 'ESTUDIANTE', emailVerificado: true }

function renderEn(ruta: string, noLeidas = 0) {
  return renderConQuery(
    <MemoryRouter initialEntries={[ruta]}>
      <StudentHeader noLeidas={noLeidas} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: 'token', usuario })
})

afterEach(() => {
  cleanup()
})

describe('StudentHeader', () => {
  it('muestra las secciones del alumno y marca la actual', () => {
    renderEn('/examenes')

    const nav = screen.getByRole('navigation', { name: 'Secciones' })
    expect(within(nav).getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: 'Exámenes' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Historial' })).not.toHaveAttribute('aria-current')
  })

  it('el detalle de un programa cuenta como Exámenes y el resumen de un simulacro como Historial', () => {
    renderEn('/examenes/u-ing-a2')
    expect(within(screen.getByRole('navigation', { name: 'Secciones' })).getByRole('link', { name: 'Exámenes' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    cleanup()

    renderEn('/simulacros/s-1/resumen')
    expect(within(screen.getByRole('navigation', { name: 'Secciones' })).getByRole('link', { name: 'Historial' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('en la barra inferior de celular incluye Avisos con el contador de no leidas', () => {
    renderEn('/', 3)

    const movil = screen.getByRole('navigation', { name: 'Secciones (movil)' })
    expect(within(movil).getAllByRole('link')).toHaveLength(5)
    expect(within(movil).getByRole('link', { name: /Avisos/ })).toHaveTextContent('3')
    expect(within(movil).getByRole('link', { name: /Inicio/ })).toHaveAttribute('aria-current', 'page')
  })

  it('reserva espacio para la barra inferior mientras esta montado', () => {
    const { unmount } = renderEn('/')
    expect(document.body).toHaveClass('con-nav-alumno')
    unmount()
    expect(document.body).not.toHaveClass('con-nav-alumno')
  })
})
