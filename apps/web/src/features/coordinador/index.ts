/** API publica de la feature coordinador. */
export { default as CoordinadorLayout } from './components/CoordinadorLayout'

// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarCoordinadorPage = () => import('./pages/CoordinadorPage')
