import PanelLayout, { type SeccionNav } from '../panel/PanelLayout'

/** Menu del panel coordinador (/coordinador/*); el shell (sidebar + topbar) es PanelLayout. */
const SECCIONES: SeccionNav[] = [
  {
    titulo: 'Institución',
    items: [{ to: '/coordinador', icono: 'badge', label: 'Licencias y alumnos', exacto: true }],
  },
  {
    titulo: 'Cuenta',
    items: [{ to: '/coordinador/notificaciones', icono: 'notifications', label: 'Notificaciones', conNoLeidas: true }],
  },
]

export default function CoordinadorLayout() {
  return <PanelLayout etiqueta="Coord." rolTexto="Coordinador" secciones={SECCIONES} rutaNotificaciones="/coordinador/notificaciones" />
}
