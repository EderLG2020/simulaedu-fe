import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import BannerConexion from './components/BannerConexion'
import './index.css'
import { iniciarApp } from './lib/sesion'
import { router } from './router.tsx'

// Recupera la sesion (si la habia) con la cookie de refresh antes de que las rutas decidan.
iniciarApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BannerConexion />
    <RouterProvider router={router} />
  </StrictMode>,
)
