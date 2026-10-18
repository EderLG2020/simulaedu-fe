import PanelLayout, { type SeccionNav } from '../panel/PanelLayout'

/** Menu del panel admin (/admin/*); el shell (sidebar + topbar) es PanelLayout. */
const SECCIONES: SeccionNav[] = [
  {
    titulo: 'Gestión Principal',
    items: [
      { to: '/admin/dashboard', icono: 'dashboard', label: 'Dashboard' },
      { to: '/admin/usuarios', icono: 'group', label: 'Usuarios' },
      { to: '/admin/universidades', icono: 'account_balance', label: 'Programas' },
      { to: '/admin/cursos', icono: 'menu_book', label: 'Cursos y temas' },
      { to: '/admin/preguntas', icono: 'quiz', label: 'Banco de preguntas' },
      { to: '/admin/examenes', icono: 'assignment', label: 'Exámenes' },
      { to: '/admin/moderacion-preguntas', icono: 'verified_user', label: 'Moderación' },
      { to: '/admin/planes', icono: 'sell', label: 'Planes' },
      { to: '/admin/instituciones', icono: 'corporate_fare', label: 'Instituciones' },
      { to: '/admin/landing', icono: 'language', label: 'Contenido Landing', inerte: true },
      { to: '/admin/reportes', icono: 'bar_chart', label: 'Reportes globales' },
      { to: '/admin/notificaciones', icono: 'notifications', label: 'Notificaciones', conNoLeidas: true },
    ],
  },
]

export default function AdminLayout() {
  return (
    <PanelLayout
      etiqueta="Admin"
      rolTexto="Administrador"
      secciones={SECCIONES}
      rutaNotificaciones="/admin/notificaciones"
      busqueda="Buscar estudiantes, preguntas o métricas..."
    />
  )
}
