import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { login } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import './auth.css'

const MENSAJES_POR_CODIGO: Record<string, string> = {
  CREDENCIALES_INVALIDAS: 'Correo o contrasena incorrectos.',
  EMAIL_NO_VERIFICADO:
    'Debes verificar tu correo antes de iniciar sesion. Este flujo todavia no esta disponible.',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const respuesta = await login({ email, password })
      setSesion(respuesta.accessToken, respuesta.usuario)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(MENSAJES_POR_CODIGO[err.code] ?? err.message)
      } else {
        setError('No se pudo iniciar sesion. Intenta nuevamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Iniciar sesion</h1>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="auth-submit" type="submit" disabled={enviando}>
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div className="auth-footer">
          No tienes cuenta? <Link to="/registro">Registrate</Link>
        </div>
      </div>
    </div>
  )
}
