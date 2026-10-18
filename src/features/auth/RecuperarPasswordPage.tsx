import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { recuperarPassword } from '../../api/authApi'
import AuthShell from './AuthShell'
import { card, input, inputIcon, label, primaryBtn, secondaryBtn } from './authStyles'
import { Icon } from '../../components/ui'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)
    try {
      await recuperarPassword(email)
    } finally {
      // Mismo mensaje exista o no el correo (no revela existencia).
      setEnviado(true)
      setEnviando(false)
    }
  }

  return (
    <AuthShell>
      <div className={card}>
        <div className="flex flex-col items-center text-center">
          <img src="/logo_simulaedu.png" alt="SimulaEdu" className="mb-4 h-9 w-auto object-contain" />
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-0.5 text-[13px] font-semibold text-primary-600">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            Seguridad de cuenta
          </div>
        </div>

        {!enviado ? (
          <>
            <div className="mb-5 text-center">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Recupera tu contrasena</h1>
              <p className="mt-1 text-sm text-slate-700">Ingresa tu correo registrado para recibir un enlace de restablecimiento.</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={label}>
                  Correo electronico
                </label>
                <div className="relative flex items-center">
                  <span className={inputIcon}>alternate_email</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="postulante@ejemplo.com"
                    required
                    className={input}
                  />
                </div>
                <p className="text-[13px] text-slate-500">Usa el correo con el que rindes tus simulacros.</p>
              </div>
              <button type="submit" disabled={enviando} className={primaryBtn}>
                {enviando ? (
                  <Icon name="progress_activity" size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>Enviar enlace</span>
                    <Icon name="send" size={18} />
                  </>
                )}
              </button>
            </form>
            <div className="mt-5 flex justify-center">
              <Link to="/login" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-primary-600">
                <Icon name="arrow_back" size={18} />
                Volver a iniciar sesion
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 shadow-sm">
              <Icon name="mark_email_read" size={28} />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Revisa tu bandeja de entrada</h2>
            <div className="mt-4 rounded-lg bg-primary-50/50 p-4 text-left">
              <p className="text-sm leading-relaxed text-slate-700">
                Si el correo <span className="font-semibold text-slate-900">{email}</span> existe en nuestra plataforma, te
                hemos enviado un enlace para restablecer tu contrasena. Revisa tambien tu carpeta de correo no deseado o spam.
              </p>
            </div>
            <div className="mt-5 flex w-full flex-col gap-2.5">
              <Link to="/login" className={secondaryBtn}>
                <Icon name="login" size={18} />
                Volver a iniciar sesion
              </Link>
              <button
                type="button"
                onClick={() => {
                  setEnviado(false)
                  setEmail('')
                }}
                className="flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900"
              >
                <Icon name="restart_alt" size={16} />
                Intentar con otro correo
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-[13px] text-slate-500">
          <Icon name="verified_user" size={16} />
          <span>Protegido por protocolos de seguridad de SimulaEdu</span>
        </div>
      </div>
    </AuthShell>
  )
}
