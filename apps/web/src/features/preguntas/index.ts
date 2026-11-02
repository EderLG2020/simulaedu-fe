/** API publica de la feature preguntas. */
// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarBancoPreguntasPage = () => import('./pages/BancoPreguntasPage')
