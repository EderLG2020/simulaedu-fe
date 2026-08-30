import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import CoordinadorPage from './features/coordinador/CoordinadorPage'
import GrupoDetallePage from './features/docente/GrupoDetallePage'
import GruposPage from './features/docente/GruposPage'
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
        ],
      },
    ],
  },
])
