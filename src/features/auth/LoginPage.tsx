import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { login, reenviarVerificacion } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import AuthShell from './AuthShell'
import { blockedBtn, card, errorBanner, input, inputIcon, label, primaryBtn } from './authStyles'
import { redirigirAGoogle } from './googleAuth'
import { Icon } from '../../components/ui'

const MENSAJES_POR_CODIGO: Record<string, string> = {
  CREDENCIALES_INVALIDAS: 'Correo o contrasena incorrectos.',
  EMAIL_NO_VERIFICADO: 'Debes verificar tu correo antes de iniciar sesion. Revisa tu bandeja de entrada.',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codigoError, setCodigoError] = useState<string | null>(null)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setCodigoError(null)
    setReenviado(false)
    setEnviando(true)
    try {
      const respuesta = await login({ email, password })
      setSesion(respuesta.accessToken, respuesta.usuario)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(MENSAJES_POR_CODIGO[err.code] ?? err.message)
        setCodigoError(err.code)
      } else {
        setError('No se pudo iniciar sesion. Intenta nuevamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  async function handleReenviarVerificacion() {
    setReenviando(true)
    try {
      await reenviarVerificacion(email)
    } finally {
      setReenviando(false)
      setReenviado(true)
    }
  }

  return (
    <AuthShell>
      <div className={card}>
        <div className="flex flex-col items-center text-center">
          <img src="/logo_simulaedu.png" alt="SimulaEdu" className="mb-4 h-10 w-auto object-contain" />
          {/* Titulo solo para lectores de pantalla: la pagina no muestra encabezado visible. */}
          <h1 className="sr-only">Iniciar sesión</h1>
          <p className="text-sm text-slate-700">Ingresa tus credenciales para continuar tu preparacion</p>
        </div>

        {error && codigoError !== 'EMAIL_NO_VERIFICADO' && (
          <div className={`mt-4 ${errorBanner}`}>
            <Icon name="error" size={20} className="mt-0.5 text-rose-600" />
            <p className="text-sm font-semibold text-rose-700">{error}</p>
          </div>
        )}

        {codigoError === 'EMAIL_NO_VERIFICADO' && (
          <div className="mt-4 flex flex-col gap-2.5 rounded-xl bg-accent-50 p-3.5">
            <div className="flex items-start gap-2.5">
              <Icon name="mark_email_unread" size={20} className="mt-0.5 text-accent-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-accent-900">Tu correo no ha sido verificado aun</p>
                <p className="mt-0.5 text-[13px] text-accent-800">Te enviamos un enlace de activacion a tu bandeja de entrada.</p>
              </div>
            </div>
            {reenviado ? (
              <p className="text-[13px] font-semibold text-emerald-700">Enlace reenviado. Revisa tu bandeja o spam.</p>
            ) : (
              <button
                type="button"
                onClick={handleReenviarVerificacion}
                disabled={reenviando}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-accent-500 shadow-sm transition hover:bg-accent-100 disabled:opacity-60"
              >
                <Icon name="send" size={16} />
                {reenviando ? 'Enviando...' : 'Reenviar correo de verificacion'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={label}>
              Correo electronico
            </label>
            <div className="relative flex items-center">
              <span className={inputIcon}>mail</span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="estudiante@gmail.com"
                required
                className={input}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className={label}>
                Contrasena
              </label>
              <Link to="/recuperar-password" className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                Olvidaste tu contrasena?
              </Link>
            </div>
            <div className="relative flex items-center">
              <span className={inputIcon}>lock</span>
              <input
                id="password"
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className={`${input} pr-11`}
              />
              <button
                type="button"
                aria-label="Mostrar u ocultar contrasena"
                onClick={() => setMostrarPassword((v) => !v)}
                className="absolute right-3 rounded-md p-1 text-slate-400 transition hover:text-slate-900"
              >
                <Icon name={mostrarPassword ? 'visibility_off' : 'visibility'} size={20} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={enviando} className={`mt-1 ${primaryBtn}`}>
            {enviando ? (
              <Icon name="progress_activity" size={20} className="animate-spin" />
            ) : (
              <>
                <span>Iniciar sesion</span>
                <Icon name="arrow_forward" size={20} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="h-px w-full bg-slate-200" />
          <span className="absolute bg-white px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            O continua con
          </span>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={redirigirAGoogle}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4" />
              <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853" />
              <path d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.41l4.04-3.15z" fill="#FBBC05" />
              <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.59l4.04 3.15c.95-2.84 3.6-4.99 6.72-4.99z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <div className="group relative">
            <button type="button" disabled className={blockedBtn}>
              <Icon name="domain" size={16} />
              Cuenta colegio
            </button>
            <span className="pointer-events-none absolute -top-2 -right-2 rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">
              Proximamente
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-slate-700">
          No tienes cuenta?{' '}
          <Link to="/registro" className="font-bold text-primary-600 hover:underline">
            Registrate gratis
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
