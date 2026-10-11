import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RutaProtegida() {
  const { estaAutenticado, cargandoSesion } = useAuth()

  // Recuperando la sesion con la cookie (recarga de pagina): aun no se sabe si hay usuario.
  if (cargandoSesion) return null

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
