import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import AdminUsuariosPage from './features/admin/AdminUsuariosPage'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import CoordinadorPage from './features/coordinador/CoordinadorPage'
import ExamenEstadisticasPage from './features/docente/ExamenEstadisticasPage'
import GrupoDetallePage from './features/docente/GrupoDetallePage'
import GrupoEstadisticasPage from './features/docente/GrupoEstadisticasPage'
import GruposPage from './features/docente/GruposPage'
import RevisionesPage from './features/docente/RevisionesPage'
import ExamenesDisponiblesPage from './features/examenes/ExamenesDisponiblesPage'
import ResumenSimulacroPage from './features/simulacro/ResumenSimulacroPage'
import SimulacroPage from './features/simulacro/SimulacroPage'
import RutaPorRol from './routes/RutaPorRol'
import RutaProtegida from './routes/RutaProtegida'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  {
    element: <RutaProtegida />,
    children: [
      { path: '/examenes', element: <ExamenesDisponiblesPage /> },
      { path: '/simulacros/:id', element: <SimulacroPage /> },
      { path: '/simulacros/:id/resumen', element: <ResumenSimulacroPage /> },
      {
        element: <RutaPorRol roles={['COORDINADOR']} />,
        children: [{ path: '/coordinador', element: <CoordinadorPage /> }],
      },
      {
        element: <RutaPorRol roles={['DOCENTE']} />,
        children: [
          { path: '/docente/grupos', element: <GruposPage /> },
          { path: '/docente/grupos/:id', element: <GrupoDetallePage /> },
          { path: '/docente/grupos/:id/estadisticas', element: <GrupoEstadisticasPage /> },
          { path: '/docente/examenes/:examenId/estadisticas', element: <ExamenEstadisticasPage /> },
          { path: '/docente/revisiones', element: <RevisionesPage /> },
        ],
      },
      {
        element: <RutaPorRol roles={['ADMIN']} />,
        children: [{ path: '/admin/usuarios', element: <AdminUsuariosPage /> }],
      },
    ],
  },
])
