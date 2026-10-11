import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { reenviarVerificacion, register } from '../../api/authApi'
import AuthShell from './AuthShell'
import { card, input, inputIcon, label, primaryBtn } from './authStyles'

function calcularFortaleza(valor: string): 0 | 1 | 2 | 3 {
  if (!valor) return 0
  let puntos = 0
  if (valor.length >= 8) puntos++
  if (/[A-Z]/.test(valor) && /[0-9]/.test(valor)) puntos++
  if (/[^A-Za-z0-9]/.test(valor) || valor.length >= 12) puntos++
  return puntos as 0 | 1 | 2 | 3
}

const FORTALEZA_INFO: Record<0 | 1 | 2 | 3, { texto: string; color: string; segmentos: number }> = {
  0: { texto: 'Esperando caracteres', color: 'bg-slate-200', segmentos: 0 },
  1: { texto: 'Debil', color: 'bg-rose-500', segmentos: 1 },
  2: { texto: 'Media', color: 'bg-accent-500', segmentos: 2 },
  3: { texto: 'Segura', color: 'bg-emerald-600', segmentos: 3 },
}

export default function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registrado, setRegistrado] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  const fortaleza = useMemo(() => calcularFortaleza(password), [password])
  const info = FORTALEZA_INFO[fortaleza]

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

  async function handleReenviar() {
    setReenviando(true)
    try {
      await reenviarVerificacion(email)
    } finally {
      setReenviando(false)
      setReenviado(true)
      setTimeout(() => setReenviado(false), 5000)
    }
  }

  if (registrado) {
    return (
      <AuthShell>
        <div className={`${card} flex flex-col items-center text-center`}>
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-md">
              <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
            </div>
            <span className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
              <span className="material-symbols-outlined text-[16px] font-bold">check</span>
            </span>
          </div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-[13px] font-semibold text-emerald-700">
            <span className="material-symbols-outlined text-[14px]">done_all</span>
            Registro casi completo
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Revisa tu correo</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-700">
            Te enviamos un enlace para verificar tu cuenta a{' '}
            <span className="font-semibold text-slate-900 underline decoration-primary-600 decoration-2 underline-offset-2">
              {email}
            </span>{' '}
            antes de poder iniciar sesion. Revisa tu bandeja de entrada o spam.
          </p>

          <div className="mt-5 flex w-full flex-col gap-2.5 rounded-xl bg-primary-50/60 p-4 text-left">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">
                1
              </span>
              <p className="text-[13px] text-slate-900">
                Abre el mensaje de <strong>SimulaEdu</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">
                2
              </span>
              <p className="text-[13px] text-slate-900">
                Haz clic en <strong>Verificar mi correo</strong> para activar tu acceso.
              </p>
            </div>
          </div>

          <Link to="/login" className={`mt-5 ${primaryBtn}`}>
            <span>Ir a iniciar sesion</span>
            <span className="material-symbols-outlined text-[18px]">login</span>
          </Link>

          <div className="mt-4 flex flex-col items-center gap-1.5">
            {reenviado ? (
              <span className="text-[13px] font-semibold text-emerald-700">Nuevo enlace enviado correctamente.</span>
            ) : (
              <button
                type="button"
                onClick={handleReenviar}
                disabled={reenviando}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-primary-600 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                {reenviando ? 'Enviando...' : 'No recibiste nada? Reenviar enlace'}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[13px] text-slate-500">
          <span className="material-symbols-outlined text-[16px]">security</span>
          Tus datos estan protegidos bajo la Ley de Proteccion de Datos Personales N&deg; 29733 (Peru).
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className={card}>
        <div className="flex flex-col items-center text-center">
          <img src="/logo_simulaedu.png" alt="SimulaEdu" className="mb-3 h-8 w-auto object-contain" />
          <h1 className="font-display text-xl font-semibold tracking-tight text-slate-900">Crea tu cuenta gratis</h1>
          <p className="mt-1 max-w-xs text-[13px] text-slate-700">Empieza a practicar con simulacros y ranking nacional</p>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5 text-left">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className={label}>
              Nombre completo
            </label>
            <div className="relative flex items-center">
              <span className={inputIcon}>person</span>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej: Camila Quispe"
                required
                className={input}
              />
            </div>
          </div>

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
                placeholder="ej: camila@colegio.edu.pe"
                required
                className={input}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={label}>
              Contrasena
            </label>
            <div className="relative flex items-center">
              <span className={inputIcon}>lock</span>
              <input
                id="password"
                type={mostrarPassword ? 'text' : 'password'}
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crea una clave segura"
                required
                className={`${input} pr-11`}
              />
              <button
                type="button"
                aria-label="Mostrar u ocultar contrasena"
                onClick={() => setMostrarPassword((v) => !v)}
                className="absolute right-3 rounded-md p-1 text-slate-400 transition hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {mostrarPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-full w-1/3 rounded-full transition-colors duration-300 ${i < info.segmentos ? info.color : 'bg-slate-200'}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] text-slate-400">Fortaleza:</span>
                <span className="text-[11px] font-semibold text-slate-700">{info.texto}</span>
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 pt-1 select-none">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 accent-primary-600"
            />
            <span className="text-[13px] leading-snug text-slate-700">
              Acepto los <span className="font-semibold text-primary-600">Terminos y condiciones</span> y el{' '}
              <span className="font-semibold text-primary-600">Aviso de privacidad</span> de SimulaEdu.
            </span>
          </label>

          <button type="submit" disabled={enviando} className={`mt-1 ${primaryBtn}`}>
            {enviando ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : (
              <>
                <span>Crear cuenta</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-700">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-primary-600 hover:underline">
            Inicia sesion
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
