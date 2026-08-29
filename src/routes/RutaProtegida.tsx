import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RutaProtegida() {
  const { estaAutenticado } = useAuth()

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
