import { PanelLayout, type SeccionNav } from '../../panel'

/** Menu del panel coordinador (/coordinador/*); el shell (sidebar + topbar) es PanelLayout. */
const SECCIONES: SeccionNav[] = [
  {
    titulo: 'Institución',
    items: [
      { to: '/coordinador', icono: 'dashboard', label: 'Resumen', exacto: true },
      { to: '/coordinador/alumnos', icono: 'group', label: 'Alumnos' },
      { to: '/coordinador/secciones', icono: 'groups', label: 'Secciones' },
      { to: '/coordinador/docentes', icono: 'school', label: 'Docentes' },
      { to: '/coordinador/ranking', icono: 'leaderboard', label: 'Ranking' },
      { to: '/coordinador/reportes', icono: 'description', label: 'Reportes' },
    ],
  },
  {
    titulo: 'Cuenta',
    items: [{ to: '/coordinador/notificaciones', icono: 'notifications', label: 'Notificaciones', conNoLeidas: true }],
  },
]

export default function CoordinadorLayout() {
  return <PanelLayout etiqueta="Coord." rolTexto="Coordinador" secciones={SECCIONES} rutaNotificaciones="/coordinador/notificaciones" />
}
