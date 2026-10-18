import { apiFetch } from './client'
import { queryClient } from '../lib/queryClient'
import { claves } from './claves'
import type { CursoConTemas } from './cursosApi'

export type CategoriaCurso = CursoConTemas['categoria']

export interface TemaAdmin {
  id: string
  nombre: string
  /** Preguntas del banco en este tema: si es > 0 el backend no deja eliminarlo. */
  cantidadPreguntas: number
}

export interface CursoAdmin {
  id: string
  nombre: string
  categoria: CategoriaCurso
  icono: string
  temas: TemaAdmin[]
}

export interface CursoAdminRequest {
  nombre: string
  categoria: CategoriaCurso
  /** Opcional: al crear, sin icono usa el generico; al editar, conserva el actual. */
  icono?: string
}

/** Cada cambio descarta el catalogo cacheado por listarCursos (selectores de banco de preguntas y examenes). */
async function mutar<T>(peticion: Promise<T>): Promise<T> {
  const resultado = await peticion
  void queryClient.invalidateQueries({ queryKey: claves.cursos })
  return resultado
}

export function listarCursosAdmin(): Promise<CursoAdmin[]> {
  return apiFetch<CursoAdmin[]>('/admin/cursos')
}

export function crearCurso(request: CursoAdminRequest): Promise<CursoAdmin> {
  return mutar(apiFetch<CursoAdmin>('/admin/cursos', { method: 'POST', body: JSON.stringify(request) }))
}

export function actualizarCurso(id: string, request: CursoAdminRequest): Promise<CursoAdmin> {
  return mutar(apiFetch<CursoAdmin>(`/admin/cursos/${id}`, { method: 'PUT', body: JSON.stringify(request) }))
}

export function eliminarCurso(id: string): Promise<void> {
  return mutar(apiFetch<void>(`/admin/cursos/${id}`, { method: 'DELETE' }))
}

export function crearTema(cursoId: string, nombre: string): Promise<TemaAdmin> {
  return mutar(apiFetch<TemaAdmin>(`/admin/cursos/${cursoId}/temas`, { method: 'POST', body: JSON.stringify({ nombre }) }))
}

export function actualizarTema(id: string, nombre: string): Promise<TemaAdmin> {
  return mutar(apiFetch<TemaAdmin>(`/admin/temas/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }))
}

export function eliminarTema(id: string): Promise<void> {
  return mutar(apiFetch<void>(`/admin/temas/${id}`, { method: 'DELETE' }))
}
