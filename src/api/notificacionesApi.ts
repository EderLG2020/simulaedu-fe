import { apiFetch, apiFetchPagina, type ApiPageEnvelope } from './client'

export interface Notificacion {
  id: string
  tipo: string
  mensaje: string
  leida: boolean
  creadoEn: string | null
}

export function listarNotificaciones(page: number, limit: number): Promise<ApiPageEnvelope<Notificacion>> {
  return apiFetchPagina<Notificacion>(`/notificaciones?page=${page}&limit=${limit}`)
}

export function contarNoLeidas(): Promise<number> {
  return apiFetch<{ noLeidas: number }>('/notificaciones/no-leidas/contador').then((r) => r.noLeidas)
}

export function marcarLeida(id: string): Promise<Notificacion> {
  return apiFetch<Notificacion>(`/notificaciones/${id}/leer`, { method: 'PATCH' })
}
