import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { loginConGoogle } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import AuthShell from './AuthShell'
import { card, primaryBtn } from './authStyles'
import { consumirEstadoGoogle, obtenerRedirectUri } from './googleAuth'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const { setSesion } = useAuth()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const yaProcesado = useRef(false)

  useEffect(() => {
    // El code/state de Google son de un solo uso - sin este guard, el doble
    // efecto de StrictMode en desarrollo consume el state en el primer
    // llamado y hace fallar la validacion en el segundo, mostrando un error
    // que desaparece apenas el primer llamado (el real) resuelve y navega.
    if (yaProcesado.current) return
    yaProcesado.current = true

    if (searchParams.get('error')) {
      setError('Cancelaste el inicio de sesion con Google.')
      return
    }

    const code = searchParams.get('code')
    const stateValido = consumirEstadoGoogle(searchParams.get('state'))

    if (!code || !stateValido) {
      setError('No se pudo validar la solicitud de Google. Intenta nuevamente.')
      return
    }

    loginConGoogle(code, obtenerRedirectUri())
      .then((respuesta) => {
        setSesion(respuesta.accessToken, respuesta.usuario)
        navigate('/')
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesion con Google.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthShell>
      <div className={`${card} flex flex-col items-center text-center`}>
        {error ? (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <span className="material-symbols-outlined text-[32px] text-rose-600">error</span>
            </div>
            <h1 className="font-display text-lg font-semibold text-slate-900">No se pudo iniciar sesion</h1>
            <p className="mt-2 text-sm text-slate-700">{error}</p>
            <Link to="/login" className={`mt-5 ${primaryBtn}`}>
              Volver a iniciar sesion
            </Link>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined mb-4 animate-spin text-[40px] text-primary-600">progress_activity</span>
            <p className="text-sm text-slate-700">Conectando con Google...</p>
          </>
        )}
      </div>
    </AuthShell>
  )
}
