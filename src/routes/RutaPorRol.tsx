import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RutaPorRol({ roles }: { roles: string[] }) {
  const { usuario, cargandoSesion } = useAuth()

  if (cargandoSesion) return null

  if (!usuario || !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
