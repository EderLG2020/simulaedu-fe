/** API publica de la feature examenes. */
// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarAsignaturasExamenesPage = () => import('./pages/AsignaturasExamenesPage')
export const cargarEditorExamenPage = () => import('./pages/EditorExamenPage')
export const cargarEligeUniversidadPage = () => import('./pages/EligeUniversidadPage')
export const cargarGestionExamenesPage = () => import('./pages/GestionExamenesPage')
