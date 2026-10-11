import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { reenviarVerificacion, verificarEmail } from '../../api/authApi'
import AuthShell from './AuthShell'
import { card, input, inputIcon, label, primaryBtn } from './authStyles'

type Estado = 'verificando' | 'ok' | 'error'

export default function VerificarEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [estado, setEstado] = useState<Estado>('verificando')
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  useEffect(() => {
    if (!token) {
      setEstado('error')
      setMensajeError('El enlace no incluye un token de verificacion.')
      return
    }
    verificarEmail(token)
      .then(() => setEstado('ok'))
      .catch((err) => {
        setEstado('error')
        setMensajeError(err instanceof ApiError ? err.message : 'No se pudo verificar tu correo.')
      })
  }, [token])

  async function handleReenviar(event: FormEvent) {
    event.preventDefault()
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
      <div className={`${card} flex flex-col items-center text-center`}>
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-600 via-violet-500 to-accent-500" />
        <img src="/logo_simulaedu.png" alt="SimulaEdu" className="mb-6 h-10 w-auto object-contain" />

        {estado === 'verificando' && (
          <>
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-[56px] text-primary-600">progress_activity</span>
              <span className="material-symbols-outlined absolute text-[24px] text-primary-600">shield</span>
            </div>
            <h1 className="font-display text-xl font-semibold text-slate-900">Verificando tu correo...</h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-700">
              Validando tu enlace de seguridad en los servidores de SimulaEdu
            </p>
          </>
        )}

        {estado === 'ok' && (
          <>
            <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 shadow-md">
                <span className="material-symbols-outlined text-[40px] text-emerald-600">check_circle</span>
              </div>
            </div>
            <h1 className="font-display text-xl font-semibold text-slate-900">Tu correo quedo verificado!</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Tu cuenta ya esta lista y activada para rendir simulacros y medir tu ranking.
            </p>
            <Link to="/login" className={`mt-6 ${primaryBtn}`}>
              <span>Ir a iniciar sesion</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
              <span className="material-symbols-outlined text-[36px] text-rose-600">history_toggle_off</span>
            </div>
            <h1 className="font-display text-lg font-semibold text-slate-900">Enlace de verificacion expirado o invalido</h1>
            <p className="mt-2 mb-5 text-sm leading-relaxed text-slate-700">{mensajeError}</p>

            {reenviado ? (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                Si el correo existe y no ha sido verificado, se envio un nuevo enlace.
              </p>
            ) : (
              <form onSubmit={handleReenviar} className="flex w-full flex-col gap-3 text-left">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className={label}>
                    Correo electronico registrado
                  </label>
                  <div className="relative flex items-center">
                    <span className={inputIcon}>mail</span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="estudiante@ejemplo.com"
                      required
                      className={input}
                    />
                  </div>
                </div>
                <button type="submit" disabled={reenviando} className={primaryBtn}>
                  {reenviando ? (
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">send</span>
                      <span>Reenviar enlace de verificacion</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <Link to="/login" className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-primary-600">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver a iniciar sesion
            </Link>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[13px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">lock</span>
          Conexion segura
        </span>
        <span>&#8226;</span>
        <span>Soporte: soporte@simulaedu.pe</span>
      </div>
    </AuthShell>
  )
}
