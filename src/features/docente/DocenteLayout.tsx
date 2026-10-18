import PanelLayout, { type SeccionNav } from '../panel/PanelLayout'

/** Menu del panel docente (/docente/*); el shell (sidebar + topbar) es PanelLayout. */
const SECCIONES: SeccionNav[] = [
  {
    titulo: 'Docencia',
    items: [
      { to: '/docente/grupos', icono: 'groups', label: 'Mis grupos' },
      { to: '/docente/revisiones', icono: 'rate_review', label: 'Revisiones' },
    ],
  },
  {
    titulo: 'Contenido',
    items: [
      { to: '/docente/preguntas', icono: 'quiz', label: 'Banco de preguntas' },
      { to: '/docente/examenes', icono: 'assignment', label: 'Mis exámenes' },
    ],
  },
  {
    titulo: 'Cuenta',
    items: [{ to: '/docente/notificaciones', icono: 'notifications', label: 'Notificaciones', conNoLeidas: true }],
  },
]

export default function DocenteLayout() {
  return <PanelLayout etiqueta="Docente" rolTexto="Docente" secciones={SECCIONES} rutaNotificaciones="/docente/notificaciones" />
}
