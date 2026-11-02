/** API publica de la feature docente. */
export { default as DocenteLayout } from './components/DocenteLayout'

// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarExamenEstadisticasPage = () => import('./pages/ExamenEstadisticasPage')
export const cargarGrupoDetallePage = () => import('./pages/GrupoDetallePage')
export const cargarGrupoEstadisticasPage = () => import('./pages/GrupoEstadisticasPage')
export const cargarGruposPage = () => import('./pages/GruposPage')
export const cargarRevisionesPage = () => import('./pages/RevisionesPage')
