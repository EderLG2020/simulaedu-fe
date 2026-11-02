import { ApiError, apiFetch } from './client'
import type { Usuario } from './authApi'

export function seleccionarUniversidadObjetivo(universidadId: string): Promise<Usuario> {
  return apiFetch<Usuario>('/usuarios/me/universidad-objetivo', {
    method: 'PUT',
    body: JSON.stringify({ universidadId }),
  })
}

/** Perfil fresco (incluye si el plan limita universidades) - el usuario persistido en el store puede venir de un login viejo. */
export function obtenerPerfil(): Promise<Usuario> {
  return apiFetch<Usuario>('/usuarios/me')
}

/** Modal de configuracion > Perfil. `fotoUrl` null quita la foto. */
export function actualizarPerfil(datos: { nombre: string; fotoUrl: string | null }): Promise<Usuario> {
  return apiFetch<Usuario>('/usuarios/me', { method: 'PUT', body: JSON.stringify(datos) })
}

/** Modal de configuracion > Seguridad. Responde 422 si la actual no es correcta. */
export function cambiarPassword(passwordActual: string, passwordNueva: string): Promise<void> {
  return apiFetch<void>('/usuarios/me/password', { method: 'PUT', body: JSON.stringify({ passwordActual, passwordNueva }) })
}

interface FirmaSubida {
  urlSubida: string
  apiKey: string
  timestamp: number
  carpeta: string
  firma: string
}

/**
 * Sube la foto de perfil directo a Cloudinary con una firma del backend y devuelve la URL.
 * No la guarda en el perfil: eso lo hace actualizarPerfil cuando el usuario confirma.
 */
export async function subirFotoPerfil(archivo: File): Promise<string> {
  const firma = await apiFetch<FirmaSubida>('/usuarios/me/foto/firma', {
    method: 'POST',
    body: JSON.stringify({ tipoContenido: archivo.type }),
  })
  const formData = new FormData()
  formData.append('file', archivo)
  formData.append('api_key', firma.apiKey)
  formData.append('timestamp', String(firma.timestamp))
  formData.append('folder', firma.carpeta)
  formData.append('signature', firma.firma)

  const respuesta = await fetch(firma.urlSubida, { method: 'POST', body: formData })
  if (!respuesta.ok) throw new ApiError('SUBIDA_FALLIDA', 'No se pudo subir la foto.')
  return ((await respuesta.json()) as { secure_url: string }).secure_url
}
