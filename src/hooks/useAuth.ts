import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const usuario = useAuthStore((state) => state.usuario)
  const setSesion = useAuthStore((state) => state.setSesion)
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion)

  return {
    accessToken,
    usuario,
    estaAutenticado: accessToken !== null,
    setSesion,
    cerrarSesion,
  }
}
