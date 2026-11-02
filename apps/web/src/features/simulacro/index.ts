/** API publica de la feature simulacro. */
// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarHistorialSimulacroPage = () => import('./pages/HistorialSimulacroPage')
export const cargarResumenSimulacroPage = () => import('./pages/ResumenSimulacroPage')
export const cargarSimulacroPage = () => import('./pages/SimulacroPage')
