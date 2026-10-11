import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { restablecerPassword } from '../../api/authApi'
import AuthShell from './AuthShell'
import { card, input, inputIcon, label, primaryBtn, secondaryBtn } from './authStyles'

type Estado = 'formulario' | 'exito' | 'expirado'

export default function RestablecerPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [estado, setEstado] = useState<Estado>('formulario')

  const cumpleLongitud = nuevaPassword.length >= 8
  const cumpleCaracter = useMemo(() => /[\d!@#$%^&*(),.?":{}|<>]/.test(nuevaPassword), [nuevaPassword])
  const puedeEnviar = cumpleLongitud && cumpleCaracter && !!token

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) {
      setEstado('expirado')
      return
    }
    setEnviando(true)
    try {
      await restablecerPassword(token, nuevaPassword)
      setEstado('exito')
    } catch {
      // El backend usa un unico TokenInvalidoException para expirado/usado/invalido (no distingue, por seguridad).
      setEstado('expirado')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthShell>
      <div className={card}>
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-600 via-violet-500 to-accent-500" />

        {estado === 'formulario' && (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 rounded-lg bg-primary-50 p-2">
                <img src="/logo_simulaedu.png" alt="SimulaEdu" className="h-9 w-auto object-contain" />
              </div>
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary-600 uppercase">
                <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                Seguridad
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Elige tu nueva contrasena</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                Ingresa tu nueva clave de acceso para tu cuenta de <span className="font-semibold text-slate-900">SimulaEdu</span>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="nuevaPassword" className={label}>
                    Nueva contrasena
                  </label>
                  <span className={`text-[13px] font-semibold ${puedeEnviar ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {puedeEnviar ? 'Contrasena lista' : 'Min. 8 caracteres'}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className={inputIcon}>key</span>
                  <input
                    id="nuevaPassword"
                    type={mostrarPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Escribe tu nueva contrasena"
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

                <div className="mt-1 flex flex-col gap-1.5 rounded-lg bg-primary-50/50 p-3">
                  <span className="text-[13px] font-medium text-slate-700">Requisitos minimos:</span>
                  <div className={`flex items-center gap-2 transition-colors ${cumpleLongitud ? 'text-emerald-700' : 'text-slate-700'}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {cumpleLongitud ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-[13px]">Al menos 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${cumpleCaracter ? 'text-emerald-700' : 'text-slate-700'}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {cumpleCaracter ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-[13px]">Al menos un numero o simbolo (!@#$%^&amp;*)</span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={!puedeEnviar || enviando} className={primaryBtn}>
                {enviando ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <>
                    <span>Guardar nueva contrasena</span>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-[13px] text-slate-500">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Conexion segura</span>
            </div>
          </>
        )}

        {estado === 'expirado' && (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
              <span className="material-symbols-outlined text-[32px] text-accent-500">link_off</span>
            </div>
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-rose-700 uppercase">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              Enlace no valido
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Enlace expirado o no valido</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-700">
              Este enlace ya no es valido o ya fue utilizado. Por seguridad, los enlaces de restablecimiento caducan tras{' '}
              <span className="font-semibold text-slate-900">30 minutos</span>. Solicita uno nuevo para continuar.
            </p>
            <div className="mt-5 flex w-full flex-col gap-2.5">
              <Link to="/recuperar-password" className={primaryBtn}>
                <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                Solicitar nuevo enlace
              </Link>
              <Link to="/login" className={secondaryBtn}>
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Volver a iniciar sesion
              </Link>
            </div>
          </div>
        )}

        {estado === 'exito' && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <span className="material-symbols-outlined text-[36px]">task_alt</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-slate-900">Contrasena actualizada!</h3>
            <p className="mt-1 text-sm text-slate-700">
              Tu nueva clave quedo registrada correctamente. Ya puedes ingresar y rendir tus simulacros.
            </p>
            <Link to="/login" className={`mt-5 ${primaryBtn}`}>
              <span>Ir a iniciar sesion</span>
              <span className="material-symbols-outlined text-[18px]">login</span>
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  )
}
