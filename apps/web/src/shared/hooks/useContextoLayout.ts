import { useOutletContext } from 'react-router-dom'

/**
 * Lo que AlumnoLayout y PanelLayout comparten con sus paginas via <Outlet context>: el contador
 * de notificaciones no leidas que muestra el encabezado/sidebar.
 */
export interface ContextoLayout {
  noLeidas: number
  /** Vuelve a pedir el contador (ej. tras marcar una notificacion como leida). */
  refrescarNoLeidas: () => void
}

/** undefined si la pagina se renderiza fuera de un layout (ej. en un test). */
export function useContextoLayout(): ContextoLayout | undefined {
  return useOutletContext<ContextoLayout | undefined>()
}
