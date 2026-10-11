const REDIRECT_PATH = '/auth/google/callback'
const ESTADO_KEY = 'google_oauth_state'

export function obtenerRedirectUri(): string {
  return `${window.location.origin}${REDIRECT_PATH}`
}

/** RF-50: arranca el flujo "authorization code" de Google - redirige fuera de la SPA, Google trae de vuelta al usuario a /auth/google/callback con un `code`. */
export function redirigirAGoogle() {
  const state = crypto.randomUUID()
  sessionStorage.setItem(ESTADO_KEY, state)

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
    redirect_uri: obtenerRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/** Compara el `state` recibido en el callback contra el que se guardo antes de redirigir (CSRF basico del flujo OAuth) - se consume una sola vez. */
export function consumirEstadoGoogle(stateRecibido: string | null): boolean {
  const estadoGuardado = sessionStorage.getItem(ESTADO_KEY)
  sessionStorage.removeItem(ESTADO_KEY)
  return !!stateRecibido && stateRecibido === estadoGuardado
}
