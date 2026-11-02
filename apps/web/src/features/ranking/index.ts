/** API publica de la feature ranking. */
// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarRankingPage = () => import('./pages/RankingPage')
