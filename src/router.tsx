import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import AdminLayout from './features/admin/AdminLayout'
import CoordinadorLayout from './features/coordinador/CoordinadorLayout'
import DocenteLayout from './features/docente/DocenteLayout'
import RutaPorRol from './routes/RutaPorRol'
import RutaProtegida from './routes/RutaProtegida'

/**
 * Cada pantalla se carga con `lazy` (code-splitting por ruta) en vez de importarse
 * de forma estatica - asi el bundle inicial no arrastra el codigo de paginas de
 * admin/docente/coordinador que la mayoria de sesiones (estudiantes) nunca visita.
 */
function pagina(cargador: () => Promise<{ default: ComponentType }>) {
  return () => cargador().then((modulo) => ({ Component: modulo.default }))
}

export const router = createBrowserRouter([
  {
    // App decide landing / panel / AlumnoLayout; las paginas del alumno son sus hijas para que
    // el encabezado (y su contador de avisos) persista al navegar entre ellas.
    path: '/',
    element: <App />,
    children: [
      { index: true, lazy: pagina(() => import('./features/home/EstudianteHomePage')) },
      { path: 'notificaciones', lazy: pagina(() => import('./features/notificaciones/NotificacionesPage')) },
      { path: 'examenes', lazy: pagina(() => import('./features/examenes/EligeUniversidadPage')) },
      { path: 'examenes/:universidadId', lazy: pagina(() => import('./features/examenes/AsignaturasExamenesPage')) },
      { path: 'simulacros/historial', lazy: pagina(() => import('./features/simulacro/HistorialSimulacroPage')) },
      { path: 'simulacros/:id/resumen', lazy: pagina(() => import('./features/simulacro/ResumenSimulacroPage')) },
      { path: 'ranking', lazy: pagina(() => import('./features/ranking/RankingPage')) },
    ],
  },
  { path: '/login', lazy: pagina(() => import('./features/auth/LoginPage')) },
  { path: '/registro', lazy: pagina(() => import('./features/auth/RegisterPage')) },
  { path: '/verificar-email', lazy: pagina(() => import('./features/auth/VerificarEmailPage')) },
  { path: '/recuperar-password', lazy: pagina(() => import('./features/auth/RecuperarPasswordPage')) },
  { path: '/restablecer-password', lazy: pagina(() => import('./features/auth/RestablecerPasswordPage')) },
  { path: '/auth/google/callback', lazy: pagina(() => import('./features/auth/GoogleCallbackPage')) },
  {
    element: <RutaProtegida />,
    children: [
      // El simulacro en curso va sin AlumnoLayout: pantalla completa, sin navegacion que distraiga.
      { path: '/simulacros/:id', lazy: pagina(() => import('./features/simulacro/SimulacroPage')) },
      {
        element: <RutaPorRol roles={['COORDINADOR']} />,
        children: [
          {
            element: <CoordinadorLayout />,
            children: [
              { path: '/coordinador', lazy: pagina(() => import('./features/coordinador/CoordinadorPage')) },
              { path: '/coordinador/notificaciones', lazy: pagina(() => import('./features/notificaciones/NotificacionesPage')) },
            ],
          },
        ],
      },
      {
        element: <RutaPorRol roles={['DOCENTE']} />,
        children: [
          {
            element: <DocenteLayout />,
            children: [
              { path: '/docente/grupos', lazy: pagina(() => import('./features/docente/GruposPage')) },
              { path: '/docente/grupos/:id', lazy: pagina(() => import('./features/docente/GrupoDetallePage')) },
              { path: '/docente/grupos/:id/estadisticas', lazy: pagina(() => import('./features/docente/GrupoEstadisticasPage')) },
              {
                path: '/docente/examenes/:examenId/estadisticas',
                lazy: pagina(() => import('./features/docente/ExamenEstadisticasPage')),
              },
              { path: '/docente/revisiones', lazy: pagina(() => import('./features/docente/RevisionesPage')) },
              // Mismos componentes que /admin/preguntas y /admin/examenes (RBAC de backend ya es DOCENTE+ADMIN para ambos).
              { path: '/docente/preguntas', lazy: pagina(() => import('./features/preguntas/BancoPreguntasPage')) },
              { path: '/docente/examenes', lazy: pagina(() => import('./features/examenes/GestionExamenesPage')) },
              { path: '/docente/examenes/:examenId', lazy: pagina(() => import('./features/examenes/EditorExamenPage')) },
              { path: '/docente/notificaciones', lazy: pagina(() => import('./features/notificaciones/NotificacionesPage')) },
            ],
          },
        ],
      },
      {
        element: <RutaPorRol roles={['ADMIN']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin/dashboard', lazy: pagina(() => import('./features/admin/AdminDashboardPage')) },
              { path: '/admin/usuarios', lazy: pagina(() => import('./features/admin/AdminUsuariosPage')) },
              { path: '/admin/universidades', lazy: pagina(() => import('./features/admin/AdminUniversidadesPage')) },
              { path: '/admin/cursos', lazy: pagina(() => import('./features/admin/AdminCursosPage')) },
              { path: '/admin/preguntas', lazy: pagina(() => import('./features/preguntas/BancoPreguntasPage')) },
              { path: '/admin/examenes', lazy: pagina(() => import('./features/examenes/GestionExamenesPage')) },
              { path: '/admin/examenes/:examenId', lazy: pagina(() => import('./features/examenes/EditorExamenPage')) },
              {
                path: '/admin/moderacion-preguntas',
                lazy: pagina(() => import('./features/admin/ModeracionPreguntasPage')),
              },
              { path: '/admin/planes', lazy: pagina(() => import('./features/admin/AdminPlanesPage')) },
              { path: '/admin/instituciones', lazy: pagina(() => import('./features/admin/AdminInstitucionesPage')) },
              { path: '/admin/reportes', lazy: pagina(() => import('./features/admin/AdminReportesGlobalesPage')) },
              { path: '/admin/notificaciones', lazy: pagina(() => import('./features/notificaciones/NotificacionesPage')) },
            ],
          },
        ],
      },
    ],
  },
])

/**
 * Transicion entre paginas en TODA la app: cada <Link>, navigate() y <Navigate> pasa por
 * router.navigate, asi que se activa aqui `viewTransition` (document.startViewTransition) una
 * sola vez en vez de en cada link. Las animaciones estan en index.css (::view-transition-*).
 * Sin soporte del navegador, React Router navega igual sin animar. Ojo: <Link> manda
 * `viewTransition: undefined` explicito, por eso `??` y no un spread con valor por defecto.
 */
const navegarSinTransicion = router.navigate.bind(router) as (
  to: Parameters<typeof router.navigate>[0],
  opts?: Parameters<typeof router.navigate>[1],
) => Promise<void>
router.navigate = ((to: Parameters<typeof router.navigate>[0], opts?: Parameters<typeof router.navigate>[1]) =>
  typeof to === 'number'
    ? navegarSinTransicion(to)
    : navegarSinTransicion(to, { ...opts, viewTransition: opts?.viewTransition ?? true })) as typeof router.navigate
