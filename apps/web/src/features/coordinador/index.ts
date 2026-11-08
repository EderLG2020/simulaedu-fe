/** API publica de la feature coordinador. */
export { default as CoordinadorLayout } from './components/CoordinadorLayout'

// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarCoordinadorResumenPage = () => import('./pages/CoordinadorResumenPage')
export const cargarCoordinadorAlumnosPage = () => import('./pages/CoordinadorAlumnosPage')
export const cargarCoordinadorAlumnoDetallePage = () => import('./pages/CoordinadorAlumnoDetallePage')
export const cargarCoordinadorSeccionesPage = () => import('./pages/CoordinadorSeccionesPage')
export const cargarCoordinadorSeccionDetallePage = () => import('./pages/CoordinadorSeccionDetallePage')
export const cargarCoordinadorDocentesPage = () => import('./pages/CoordinadorDocentesPage')
export const cargarCoordinadorRankingPage = () => import('./pages/CoordinadorRankingPage')
export const cargarCoordinadorReportesPage = () => import('./pages/CoordinadorReportesPage')
