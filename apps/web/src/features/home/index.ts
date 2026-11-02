/** API publica de la feature home. */
export { default as AlumnoLayout } from './components/AlumnoLayout'

// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarEstudianteHomePage = () => import('./pages/EstudianteHomePage')
