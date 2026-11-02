import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import BannerConexion from './BannerConexion'
import './index.css'
import { queryClient } from '../shared/lib/queryClient'
import { iniciarApp } from '../shared/api/sesion'
import { router } from './router.tsx'

// Recupera la sesion (si la habia) con la cookie de refresh antes de que las rutas decidan.
iniciarApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BannerConexion />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
