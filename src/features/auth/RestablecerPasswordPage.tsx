import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { restablecerPassword } from '../../api/authApi'
import AuthShell from './AuthShell'
import { card, input, inputIcon, label, primaryBtn, secondaryBtn } from './authStyles'
import { Icon } from '../../components/ui'

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
                <Icon name="lock_reset" size={14} />
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
                    <Icon name={mostrarPassword ? 'visibility_off' : 'visibility'} size={20} />
                  </button>
                </div>

                <div className="mt-1 flex flex-col gap-1.5 rounded-lg bg-primary-50/50 p-3">
                  <span className="text-[13px] font-medium text-slate-700">Requisitos minimos:</span>
                  <div className={`flex items-center gap-2 transition-colors ${cumpleLongitud ? 'text-emerald-700' : 'text-slate-700'}`}>
                    <Icon name={cumpleLongitud ? 'check_circle' : 'radio_button_unchecked'} size={16} />
                    <span className="text-[13px]">Al menos 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${cumpleCaracter ? 'text-emerald-700' : 'text-slate-700'}`}>
                    <Icon name={cumpleCaracter ? 'check_circle' : 'radio_button_unchecked'} size={16} />
                    <span className="text-[13px]">Al menos un numero o simbolo (!@#$%^&amp;*)</span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={!puedeEnviar || enviando} className={primaryBtn}>
                {enviando ? (
                  <Icon name="progress_activity" size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>Guardar nueva contrasena</span>
                    <Icon name="check_circle" size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-[13px] text-slate-500">
              <Icon name="verified_user" size={16} />
              <span>Conexion segura</span>
            </div>
          </>
        )}

        {estado === 'expirado' && (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
              <Icon name="link_off" size={32} className="text-accent-500" />
            </div>
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-rose-700 uppercase">
              <Icon name="warning" size={14} />
              Enlace no valido
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Enlace expirado o no valido</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-700">
              Este enlace ya no es valido o ya fue utilizado. Por seguridad, los enlaces de restablecimiento caducan tras{' '}
              <span className="font-semibold text-slate-900">30 minutos</span>. Solicita uno nuevo para continuar.
            </p>
            <div className="mt-5 flex w-full flex-col gap-2.5">
              <Link to="/recuperar-password" className={primaryBtn}>
                <Icon name="forward_to_inbox" size={18} />
                Solicitar nuevo enlace
              </Link>
              <Link to="/login" className={secondaryBtn}>
                <Icon name="arrow_back" size={16} />
                Volver a iniciar sesion
              </Link>
            </div>
          </div>
        )}

        {estado === 'exito' && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <Icon name="task_alt" size={36} />
            </div>
            <h3 className="font-display text-xl font-semibold text-slate-900">Contrasena actualizada!</h3>
            <p className="mt-1 text-sm text-slate-700">
              Tu nueva clave quedo registrada correctamente. Ya puedes ingresar y rendir tus simulacros.
            </p>
            <Link to="/login" className={`mt-5 ${primaryBtn}`}>
              <span>Ir a iniciar sesion</span>
              <Icon name="login" size={18} />
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  )
}
