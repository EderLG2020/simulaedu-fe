import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { mensajeDeError } from '../../api/client'
import { reenviarVerificacion, verificarEmail } from '../../api/authApi'
import AuthShell from './AuthShell'
import { card, input, inputIcon, label, primaryBtn } from './authStyles'
import { Icon } from '../../components/ui'

type Estado = 'verificando' | 'ok' | 'error'

export default function VerificarEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [email, setEmail] = useState('')
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  // El token es de un solo uso: como consulta con clave fija se envia una sola vez, aunque
  // StrictMode monte la pagina dos veces en desarrollo, y no se repite al volver a renderizar.
  const verificacion = useQuery({
    queryKey: ['verificar-email', token],
    queryFn: () => verificarEmail(token!),
    enabled: token !== null,
    retry: false,
    staleTime: Infinity,
  })
  const estado: Estado = !token || verificacion.isError ? 'error' : verificacion.isSuccess ? 'ok' : 'verificando'
  const mensajeError = !token
    ? 'El enlace no incluye un token de verificacion.'
    : verificacion.isError
      ? mensajeDeError(verificacion.error, 'No se pudo verificar tu correo.')
      : null

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
              <Icon name="progress_activity" size={56} className="animate-spin text-primary-600" />
              <Icon name="shield" size={24} className="absolute text-primary-600" />
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
                <Icon name="check_circle" size={40} className="text-emerald-600" />
              </div>
            </div>
            <h1 className="font-display text-xl font-semibold text-slate-900">Tu correo quedo verificado!</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Tu cuenta ya esta lista y activada para rendir simulacros y medir tu ranking.
            </p>
            <Link to="/login" className={`mt-6 ${primaryBtn}`}>
              <span>Ir a iniciar sesion</span>
              <Icon name="arrow_forward" size={20} />
            </Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
              <Icon name="history_toggle_off" size={36} className="text-rose-600" />
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
                    <Icon name="progress_activity" size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Icon name="send" size={18} />
                      <span>Reenviar enlace de verificacion</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <Link to="/login" className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-primary-600">
              <Icon name="arrow_back" size={16} />
              Volver a iniciar sesion
            </Link>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[13px] text-slate-500">
        <span className="flex items-center gap-1">
          <Icon name="lock" size={14} />
          Conexion segura
        </span>
        <span>&#8226;</span>
        <span>Soporte: soporte@simulaedu.pe</span>
      </div>
    </AuthShell>
  )
}
