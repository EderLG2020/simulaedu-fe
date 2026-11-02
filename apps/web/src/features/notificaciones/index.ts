/** API publica de la feature notificaciones. */
// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarNotificacionesPage = () => import('./pages/NotificacionesPage')
