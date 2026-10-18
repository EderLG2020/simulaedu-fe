import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, mensajeDeError } from '../../api/client'
import { loginConGoogle } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import AuthShell from './AuthShell'
import { card, primaryBtn } from './authStyles'
import { consumirEstadoGoogle, obtenerRedirectUri } from './googleAuth'
import { Icon } from '../../components/ui'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const { setSesion } = useAuth()
  const [searchParams] = useSearchParams()

  // El code/state de Google son de un solo uso. Como consulta con clave fija se procesan una sola
  // vez aunque StrictMode monte la pagina dos veces en desarrollo (el segundo montaje reutiliza
  // la misma promesa en vez de volver a consumir el state, que fallaria la validacion).
  const login = useQuery({
    queryKey: ['google-callback', searchParams.toString()],
    queryFn: async () => {
      if (searchParams.get('error')) throw new ApiError('GOOGLE_CANCELADO', 'Cancelaste el inicio de sesion con Google.')
      const code = searchParams.get('code')
      const stateValido = consumirEstadoGoogle(searchParams.get('state'))
      if (!code || !stateValido) {
        throw new ApiError('GOOGLE_STATE_INVALIDO', 'No se pudo validar la solicitud de Google. Intenta nuevamente.')
      }
      return loginConGoogle(code, obtenerRedirectUri())
    },
    retry: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!login.data) return
    setSesion(login.data.accessToken, login.data.usuario)
    navigate('/')
  }, [login.data, setSesion, navigate])

  const error = login.isError ? mensajeDeError(login.error, 'No se pudo iniciar sesion con Google.') : null

  return (
    <AuthShell>
      <div className={`${card} flex flex-col items-center text-center`}>
        {error ? (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <Icon name="error" size={32} className="text-rose-600" />
            </div>
            <h1 className="font-display text-lg font-semibold text-slate-900">No se pudo iniciar sesion</h1>
            <p className="mt-2 text-sm text-slate-700">{error}</p>
            <Link to="/login" className={`mt-5 ${primaryBtn}`}>
              Volver a iniciar sesion
            </Link>
          </>
        ) : (
          <>
            <Icon name="progress_activity" size={40} className="mb-4 animate-spin text-primary-600" />
            <p className="text-sm text-slate-700">Conectando con Google...</p>
          </>
        )}
      </div>
    </AuthShell>
  )
}
