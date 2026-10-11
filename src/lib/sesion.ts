import type { LoginResponse, Usuario } from '../api/authApi'
import { API_BASE_URL } from '../api/config'
import { fetchMonitoreado } from '../stores/conexionStore'
import { MARCA_SESION, useAuthStore } from '../stores/authStore'

/**
 * Gestion de la sesion en el navegador.
 *
 * - El access token vive solo en memoria (store de Zustand). El refresh token esta en una
 *   cookie httpOnly que pone el backend: JavaScript no puede leerla.
 * - Se renueva un minuto antes de vencer, o cuando una llamada devuelve 401.
 * - Solo un 401/403 de /auth/refresh cierra la sesion. Sin red, red lenta o un error del
 *   servidor (5xx) la conservan y se reintenta: el usuario no pierde la sesion por eso.
 * - Varias pestanas, una sola renovacion:
 *   - una pestana nueva primero pide el token a las demas (BroadcastChannel);
 *   - un Web Lock hace que solo una pestana renueve a la vez (dos renovaciones con la misma
 *     cookie se verian como reutilizacion y el backend cerraria la sesion);
 *   - si otra pestana acaba de renovar, se espera su token en vez de pedir otro.
 */

const LOCK_RENOVACION = 'simulaedu-renovar-sesion'
/** Momento (ms) de la ultima renovacion exitosa en cualquier pestana. No es un dato sensible. */
const RENOVADO_EN = 'simulaedu-renovado-en'
const MARGEN_RENOVACION_MS = 60_000
const REINTENTO_MS = 15_000
const ESPERA_OTRA_PESTANA_MS = 1_500
const ESPERA_RESPUESTA_PESTANAS_MS = 400

/** Header que el backend exige en /auth/refresh y /auth/logout (proteccion CSRF). */
export const HEADER_ANTI_CSRF = { 'X-Requested-With': 'fetch' }

type Mensaje =
  | { tipo: 'sesion'; accessToken: string; usuario: Usuario }
  | { tipo: 'logout' }
  | { tipo: 'solicitar' }

/** Error de red o del servidor al renovar: la sesion NO se cierra, solo no se pudo renovar ahora. */
export class RenovacionPendienteError extends Error {}

const canal: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('simulaedu-auth') : null

canal?.addEventListener('message', (evento: MessageEvent<Mensaje>) => {
  const mensaje = evento.data
  if (mensaje.tipo === 'sesion') aplicarSesion(mensaje.accessToken, mensaje.usuario, false)
  else if (mensaje.tipo === 'logout') limpiarSesion(false)
  else compartirSesionVigente()
})

let temporizador: ReturnType<typeof setTimeout> | null = null
let renovacionEnCurso: Promise<string | null> | null = null

function programar(espera: number) {
  if (temporizador) clearTimeout(temporizador)
  temporizador = setTimeout(() => {
    renovarSesion().catch(() => programar(REINTENTO_MS))
  }, espera)
}

function programarRenovacion(expiraEn: number | null) {
  if (expiraEn === null) return
  programar(Math.max(expiraEn - Date.now() - MARGEN_RENOVACION_MS, 5_000))
}

function aplicarSesion(accessToken: string, usuario: Usuario, difundir: boolean) {
  useAuthStore.getState().setSesion(accessToken, usuario)
  localStorage.setItem(MARCA_SESION, '1')
  programarRenovacion(useAuthStore.getState().expiraEn)
  if (difundir) canal?.postMessage({ tipo: 'sesion', accessToken, usuario } satisfies Mensaje)
}

function limpiarSesion(difundir: boolean) {
  if (temporizador) clearTimeout(temporizador)
  temporizador = null
  useAuthStore.getState().cerrarSesion()
  localStorage.removeItem(MARCA_SESION)
  if (difundir) canal?.postMessage({ tipo: 'logout' } satisfies Mensaje)
}

/** Otra pestana pidio la sesion: si tenemos un token vigente se lo pasamos (asi no va al backend). */
function compartirSesionVigente() {
  const { accessToken, usuario } = useAuthStore.getState()
  if (accessToken && usuario && !tokenPorVencer()) {
    canal?.postMessage({ tipo: 'sesion', accessToken, usuario } satisfies Mensaje)
  }
}

/** Espera hasta `ms` a que el token cambie respecto de `anterior` (llega por BroadcastChannel). */
function esperarTokenNuevo(anterior: string | null, ms: number): Promise<string | null> {
  return new Promise((resolve) => {
    const listo = (token: string | null) => {
      clearTimeout(limite)
      desuscribir()
      resolve(token)
    }
    const desuscribir = useAuthStore.subscribe((s) => {
      if (s.accessToken && s.accessToken !== anterior) listo(s.accessToken)
    })
    const limite = setTimeout(() => listo(null), ms)
  })
}

/** True si el token vence en menos del margen de renovacion. */
export function tokenPorVencer(): boolean {
  const { accessToken, expiraEn } = useAuthStore.getState()
  return accessToken !== null && expiraEn !== null && expiraEn - Date.now() < MARGEN_RENOVACION_MS
}

/**
 * Pide un access token nuevo con la cookie de refresh. Devuelve el token, o null si el
 * backend rechazo la sesion (en ese caso la cierra en todas las pestanas). Sin red o con
 * error del servidor lanza RenovacionPendienteError y la sesion se conserva. Llamadas
 * simultaneas en la misma pestana comparten una sola peticion.
 */
export function renovarSesion(): Promise<string | null> {
  if (renovacionEnCurso) return renovacionEnCurso
  const tokenAlPedir = useAuthStore.getState().accessToken

  const ejecutar = async (): Promise<string | null> => {
    // Mientras esperabamos el lock, otra pestana pudo renovar y mandarnos el token nuevo.
    const vigente = () => {
      const { accessToken } = useAuthStore.getState()
      return accessToken && accessToken !== tokenAlPedir && !tokenPorVencer() ? accessToken : null
    }
    if (vigente()) return vigente()
    // Otra pestana renovo hace instantes pero su mensaje aun no llega: lo esperamos.
    const renovadoEn = Number(localStorage.getItem(RENOVADO_EN) ?? 0)
    if (Date.now() - renovadoEn < 10_000) {
      const recibido = await esperarTokenNuevo(tokenAlPedir, ESPERA_OTRA_PESTANA_MS)
      if (recibido) return recibido
    }

    let respuesta: Response
    try {
      respuesta = await fetchMonitoreado(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: HEADER_ANTI_CSRF,
      })
    } catch {
      throw new RenovacionPendienteError('Sin conexion para renovar la sesion.')
    }
    if (respuesta.status === 401 || respuesta.status === 403) {
      limpiarSesion(true)
      return null
    }
    if (!respuesta.ok) throw new RenovacionPendienteError(`El servidor respondio ${respuesta.status} al renovar la sesion.`)

    const { data } = (await respuesta.json()) as { data: LoginResponse }
    localStorage.setItem(RENOVADO_EN, String(Date.now()))
    aplicarSesion(data.accessToken, data.usuario, true)
    return data.accessToken
  }

  const conLock = typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request(LOCK_RENOVACION, ejecutar)
    : ejecutar()
  renovacionEnCurso = conLock.finally(() => {
    renovacionEnCurso = null
  })
  return renovacionEnCurso
}

/** Despues de login/registro con Google: guarda la sesion y avisa a las otras pestanas. */
export function iniciarSesion(accessToken: string, usuario: Usuario) {
  aplicarSesion(accessToken, usuario, true)
}

/** Cierra la sesion en el backend (revoca el refresh token) y en todas las pestanas. */
export async function cerrarSesion(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include', headers: HEADER_ANTI_CSRF })
  } catch {
    // Sin red igual se limpia localmente; la cookie vencera sola.
  }
  limpiarSesion(true)
}

/** Cierra la sesion solo en el navegador (ej. el backend ya la rechazo). */
export function terminarSesionLocal() {
  limpiarSesion(true)
}

/** Recupera la sesion: primero se la pide a otra pestana abierta y, si ninguna responde, al backend. */
async function recuperarSesion() {
  if (useAuthStore.getState().accessToken) return
  canal?.postMessage({ tipo: 'solicitar' } satisfies Mensaje)
  if (canal && (await esperarTokenNuevo(null, ESPERA_RESPUESTA_PESTANAS_MS))) return
  try {
    await renovarSesion()
  } catch {
    // Sin red o servidor caido: se queda en "iniciando" y se reintenta al volver la conexion.
    programar(REINTENTO_MS)
  }
}

/**
 * Al cargar la app: si hubo sesion antes, la recupera (el access token no sobrevive a una
 * recarga porque solo vive en memoria). Al volver la conexion, reintenta lo pendiente.
 */
export function iniciarApp() {
  localStorage.removeItem('simulaedu-auth') // formato anterior: token persistido en localStorage
  window.addEventListener('online', () => {
    if (localStorage.getItem(MARCA_SESION) !== '1') return
    if (!useAuthStore.getState().accessToken) void recuperarSesion()
    else if (tokenPorVencer()) renovarSesion().catch(() => programar(REINTENTO_MS))
  })
  if (useAuthStore.getState().estado === 'iniciando') void recuperarSesion()
}
