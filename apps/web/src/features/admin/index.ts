/** API publica de la feature admin. */
export { default as AdminLayout } from './components/AdminLayout'

// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarAdminCursosPage = () => import('./pages/AdminCursosPage')
export const cargarAdminDashboardPage = () => import('./pages/AdminDashboardPage')
export const cargarAdminInstitucionesPage = () => import('./pages/AdminInstitucionesPage')
export const cargarAdminPlanesPage = () => import('./pages/AdminPlanesPage')
export const cargarAdminReportesGlobalesPage = () => import('./pages/AdminReportesGlobalesPage')
export const cargarAdminUniversidadesPage = () => import('./pages/AdminUniversidadesPage')
export const cargarAdminUsuariosPage = () => import('./pages/AdminUsuariosPage')
export const cargarModeracionPreguntasPage = () => import('./pages/ModeracionPreguntasPage')
