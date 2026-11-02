/** API publica de la feature landing. */
// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarLandingPage = () => import('./pages/LandingPage')
