import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { register } from '../../api/authApi'
import './auth.css'

export default function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrado, setRegistrado] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await register({ nombre, email, password })
      setRegistrado(true)
    } catch (err) {
      if (err instanceof ApiError) {
        const detalle = err.details[0]?.message
        setError(detalle ?? err.message)
      } else {
        setError('No se pudo completar el registro. Intenta nuevamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  if (registrado) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Cuenta creada</h1>
          <p className="auth-success">
            Tu cuenta quedo registrada con el plan Free. La verificacion de correo todavia no
            esta disponible, asi que el inicio de sesion seguira bloqueado hasta que se habilite.
          </p>
          <div className="auth-footer">
            <Link to="/login">Ir a iniciar sesion</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Crear cuenta</h1>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="auth-submit" type="submit" disabled={enviando}>
            {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <div className="auth-footer">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </div>
      </div>
    </div>
  )
}
