import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import RutaPorRol from './routes/RutaPorRol'
import RutaProtegida from './routes/RutaProtegida'
import { AdminLayout, cargarAdminCursosPage, cargarAdminDashboardPage, cargarAdminInstitucionesPage, cargarAdminPlanesPage, cargarAdminReportesGlobalesPage, cargarAdminUniversidadesPage, cargarAdminUsuariosPage, cargarModeracionPreguntasPage } from '../features/admin'
import { cargarGoogleCallbackPage, cargarLoginPage, cargarRecuperarPasswordPage, cargarRegisterPage, cargarRestablecerPasswordPage, cargarVerificarEmailPage } from '../features/auth'
import {
  cargarCoordinadorAlumnoDetallePage,
  cargarCoordinadorAlumnosPage,
  cargarCoordinadorDocentesPage,
  cargarCoordinadorRankingPage,
  cargarCoordinadorReportesPage,
  cargarCoordinadorResumenPage,
  cargarCoordinadorSeccionDetallePage,
  cargarCoordinadorSeccionesPage,
  CoordinadorLayout,
} from '../features/coordinador'
import { cargarExamenEstadisticasPage, cargarGrupoDetallePage, cargarGrupoEstadisticasPage, cargarGruposPage, cargarRevisionesPage, DocenteLayout } from '../features/docente'
import { cargarAsignaturasExamenesPage, cargarEditorExamenPage, cargarEligeUniversidadPage, cargarGestionExamenesPage } from '../features/examenes'
import { cargarEstudianteHomePage } from '../features/home'
import { cargarNotificacionesPage } from '../features/notificaciones'
import { cargarBancoPreguntasPage } from '../features/preguntas'
import { cargarRankingPage } from '../features/ranking'
import { cargarHistorialSimulacroPage, cargarResumenSimulacroPage, cargarSimulacroPage } from '../features/simulacro'

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
      { index: true, lazy: pagina(cargarEstudianteHomePage) },
      { path: 'notificaciones', lazy: pagina(cargarNotificacionesPage) },
      { path: 'examenes', lazy: pagina(cargarEligeUniversidadPage) },
      { path: 'examenes/:universidadId', lazy: pagina(cargarAsignaturasExamenesPage) },
      { path: 'simulacros/historial', lazy: pagina(cargarHistorialSimulacroPage) },
      { path: 'simulacros/:id/resumen', lazy: pagina(cargarResumenSimulacroPage) },
      { path: 'ranking', lazy: pagina(cargarRankingPage) },
    ],
  },
  { path: '/login', lazy: pagina(cargarLoginPage) },
  { path: '/registro', lazy: pagina(cargarRegisterPage) },
  { path: '/verificar-email', lazy: pagina(cargarVerificarEmailPage) },
  { path: '/recuperar-password', lazy: pagina(cargarRecuperarPasswordPage) },
  { path: '/restablecer-password', lazy: pagina(cargarRestablecerPasswordPage) },
  { path: '/auth/google/callback', lazy: pagina(cargarGoogleCallbackPage) },
  {
    element: <RutaProtegida />,
    children: [
      // El simulacro en curso va sin AlumnoLayout: pantalla completa, sin navegacion que distraiga.
      { path: '/simulacros/:id', lazy: pagina(cargarSimulacroPage) },
      {
        element: <RutaPorRol roles={['COORDINADOR']} />,
        children: [
          {
            element: <CoordinadorLayout />,
            children: [
              { path: '/coordinador', lazy: pagina(cargarCoordinadorResumenPage) },
              { path: '/coordinador/alumnos', lazy: pagina(cargarCoordinadorAlumnosPage) },
              { path: '/coordinador/alumnos/:id', lazy: pagina(cargarCoordinadorAlumnoDetallePage) },
              { path: '/coordinador/secciones', lazy: pagina(cargarCoordinadorSeccionesPage) },
              { path: '/coordinador/secciones/:id', lazy: pagina(cargarCoordinadorSeccionDetallePage) },
              { path: '/coordinador/docentes', lazy: pagina(cargarCoordinadorDocentesPage) },
              { path: '/coordinador/ranking', lazy: pagina(cargarCoordinadorRankingPage) },
              { path: '/coordinador/reportes', lazy: pagina(cargarCoordinadorReportesPage) },
              { path: '/coordinador/notificaciones', lazy: pagina(cargarNotificacionesPage) },
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
              { path: '/docente/grupos', lazy: pagina(cargarGruposPage) },
              { path: '/docente/grupos/:id', lazy: pagina(cargarGrupoDetallePage) },
              { path: '/docente/grupos/:id/estadisticas', lazy: pagina(cargarGrupoEstadisticasPage) },
              {
                path: '/docente/examenes/:examenId/estadisticas',
                lazy: pagina(cargarExamenEstadisticasPage),
              },
              { path: '/docente/revisiones', lazy: pagina(cargarRevisionesPage) },
              // Mismos componentes que /admin/preguntas y /admin/examenes (RBAC de backend ya es DOCENTE+ADMIN para ambos).
              { path: '/docente/preguntas', lazy: pagina(cargarBancoPreguntasPage) },
              { path: '/docente/examenes', lazy: pagina(cargarGestionExamenesPage) },
              { path: '/docente/examenes/:examenId', lazy: pagina(cargarEditorExamenPage) },
              { path: '/docente/notificaciones', lazy: pagina(cargarNotificacionesPage) },
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
              { path: '/admin/dashboard', lazy: pagina(cargarAdminDashboardPage) },
              { path: '/admin/usuarios', lazy: pagina(cargarAdminUsuariosPage) },
              { path: '/admin/universidades', lazy: pagina(cargarAdminUniversidadesPage) },
              { path: '/admin/cursos', lazy: pagina(cargarAdminCursosPage) },
              { path: '/admin/preguntas', lazy: pagina(cargarBancoPreguntasPage) },
              { path: '/admin/examenes', lazy: pagina(cargarGestionExamenesPage) },
              { path: '/admin/examenes/:examenId', lazy: pagina(cargarEditorExamenPage) },
              {
                path: '/admin/moderacion-preguntas',
                lazy: pagina(cargarModeracionPreguntasPage),
              },
              { path: '/admin/planes', lazy: pagina(cargarAdminPlanesPage) },
              { path: '/admin/instituciones', lazy: pagina(cargarAdminInstitucionesPage) },
              { path: '/admin/reportes', lazy: pagina(cargarAdminReportesGlobalesPage) },
              { path: '/admin/notificaciones', lazy: pagina(cargarNotificacionesPage) },
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
