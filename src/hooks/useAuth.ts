import { cerrarSesion, iniciarSesion } from '../lib/sesion'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const usuario = useAuthStore((state) => state.usuario)
  const estado = useAuthStore((state) => state.estado)
  const actualizarUsuario = useAuthStore((state) => state.actualizarUsuario)

  return {
    accessToken,
    usuario,
    estaAutenticado: accessToken !== null,
    /** True mientras se recupera la sesion al cargar la app: aun no se sabe si hay usuario. */
    cargandoSesion: estado === 'iniciando',
    /** Despues de login: guarda la sesion y la comparte con las otras pestanas. */
    setSesion: iniciarSesion,
    actualizarUsuario,
    /** Cierra la sesion en el backend y en todas las pestanas. */
    cerrarSesion: () => {
      void cerrarSesion()
    },
  }
}
