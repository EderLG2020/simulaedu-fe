import { lazy, Suspense } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import AlumnoLayout from './features/home/AlumnoLayout'
import { useAuth } from './hooks/useAuth'

const LandingPage = lazy(() => import('./features/landing/LandingPage'))

/** Inicio de cada rol con panel propio. */
const PANEL_POR_ROL: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  DOCENTE: '/docente/grupos',
  COORDINADOR: '/coordinador',
}

/**
 * Raiz de la app y de las paginas del alumno (rutas hijas de "/", ver router.tsx):
 * - Sin sesion: el landing en "/", y login para cualquier otra pagina.
 * - Admin/docente/coordinador en "/": a su panel.
 * - Si no: AlumnoLayout con la pagina pedida (en "/", el inicio del alumno).
 */
function App() {
  const { usuario, estaAutenticado, cargandoSesion } = useAuth()
  const { pathname } = useLocation()

  // Recuperando la sesion al recargar: evita mostrar el landing un instante a un usuario logueado.
  if (cargandoSesion) return null

  if (!estaAutenticado || !usuario) {
    if (pathname !== '/') return <Navigate to="/login" replace />
    return (
      <Suspense fallback={null}>
        <LandingPage />
      </Suspense>
    )
  }

  const panel = PANEL_POR_ROL[usuario.rol]
  if (panel && pathname === '/') return <Navigate to={panel} replace />

  return <AlumnoLayout />
}

export default App
