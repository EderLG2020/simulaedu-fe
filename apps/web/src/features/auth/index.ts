/** API publica de la feature auth. */
// Paginas que app/ carga con lazy: el import() vive aqui para conservar el code-splitting por ruta.
export const cargarGoogleCallbackPage = () => import('./pages/GoogleCallbackPage')
export const cargarLoginPage = () => import('./pages/LoginPage')
export const cargarRecuperarPasswordPage = () => import('./pages/RecuperarPasswordPage')
export const cargarRegisterPage = () => import('./pages/RegisterPage')
export const cargarRestablecerPasswordPage = () => import('./pages/RestablecerPasswordPage')
export const cargarVerificarEmailPage = () => import('./pages/VerificarEmailPage')
