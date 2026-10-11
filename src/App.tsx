import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

const LandingPage = lazy(() => import('./features/landing/LandingPage'))
const EstudianteHomePage = lazy(() => import('./features/home/EstudianteHomePage'))

/** Inicio segun el rol: landing (sin sesion), home del estudiante, o el panel de cada rol. */
const PANEL_POR_ROL: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  DOCENTE: '/docente/grupos',
  COORDINADOR: '/coordinador',
}

function App() {
  const { usuario, estaAutenticado, cargandoSesion } = useAuth()

  // Recuperando la sesion al recargar: evita mostrar el landing un instante a un usuario logueado.
  if (cargandoSesion) return null

  if (!estaAutenticado || !usuario) {
    return (
      <Suspense fallback={null}>
        <LandingPage />
      </Suspense>
    )
  }

  const panel = PANEL_POR_ROL[usuario.rol]
  if (panel) return <Navigate to={panel} replace />

  return (
    <Suspense fallback={null}>
      <EstudianteHomePage />
    </Suspense>
  )
}

export default App
