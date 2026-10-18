import { cleanup, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from './api/authApi'
import { useContextoLayout } from './routes/contextoLayout'
import { useAuthStore } from './stores/authStore'
import App from './App'
import { renderConQuery } from './test/conQuery'

vi.mock('./api/notificacionesApi', () => ({ contarNoLeidas: () => Promise.resolve(4) }))
vi.mock('./features/landing/LandingPage', () => ({ default: () => <p>landing</p> }))
vi.mock('./features/perfil/ConfiguracionModal', () => ({ default: () => null }))

function usuario(rol: string): Usuario {
  return { id: 'u-1', nombre: 'Ana', email: 'ana@example.com', rol, emailVerificado: true }
}

/** Pagina hija de prueba: muestra lo que recibe del layout por contexto. */
function PaginaHija({ nombre }: { nombre: string }) {
  const contexto = useContextoLayout()
  return (
    <p>
      {nombre} · avisos: {contexto?.noLeidas}
    </p>
  )
}

function renderEn(ruta: string) {
  return renderConQuery(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<PaginaHija nombre="inicio del alumno" />} />
          <Route path="ranking" element={<PaginaHija nombre="ranking" />} />
        </Route>
        <Route path="/login" element={<p>login</p>} />
        <Route path="/admin/dashboard" element={<p>panel admin</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  useAuthStore.setState({ accessToken: null, usuario: null })
})

describe('App', () => {
  it('sin sesion muestra el landing en "/"', async () => {
    renderEn('/')
    expect(await screen.findByText('landing')).toBeInTheDocument()
  })

  it('sin sesion manda al login desde una pagina del alumno', () => {
    renderEn('/ranking')
    expect(screen.getByText('login')).toBeInTheDocument()
  })

  it('un admin en "/" va a su panel', () => {
    useAuthStore.setState({ accessToken: 'token', usuario: usuario('ADMIN') })
    renderEn('/')
    expect(screen.getByText('panel admin')).toBeInTheDocument()
  })

  it('el alumno ve la pagina dentro del layout, con el encabezado y el contador de avisos', async () => {
    useAuthStore.setState({ accessToken: 'token', usuario: usuario('ESTUDIANTE') })
    renderEn('/ranking')

    expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeInTheDocument()
    expect(await screen.findByText('ranking · avisos: 4')).toBeInTheDocument()
  })
})
