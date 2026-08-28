import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
])
