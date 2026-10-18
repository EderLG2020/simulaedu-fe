import { useLocation } from 'react-router-dom'

/**
 * La gestion de examenes se monta en /admin/examenes y en /docente/examenes, ambas dentro del
 * PanelLayout de su rol (que ya pone el relleno de la pagina). Devuelve las rutas de cada rol.
 */
export function useGestionExamenes() {
  const { pathname } = useLocation()
  const base = pathname.startsWith('/admin') ? '/admin/examenes' : '/docente/examenes'
  return {
    base,
    rutaEditor: (id: string) => `${base}/${id}`,
    rutaNuevo: `${base}/nuevo`,
    contenedor: 'mx-auto flex max-w-7xl flex-col gap-6',
  }
}
