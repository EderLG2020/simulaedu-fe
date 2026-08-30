import { apiFetch } from './client'

export interface Grupo {
  id: string
  nombre: string
  totalAlumnos: number
}

export interface AlumnoDeGrupo {
  alumnoId: string
  nombre: string
  email: string
}

export interface AlumnoBusqueda {
  id: string
  nombre: string
  email: string
}

export interface Asignacion {
  id: string
  grupoId: string
  examenId: string
  examenNombre: string
  fechaInicio: string
  fechaFin: string
}

export function crearGrupo(nombre: string): Promise<Grupo> {
  return apiFetch<Grupo>('/grupos', { method: 'POST', body: JSON.stringify({ nombre }) })
}

export function listarGrupos(): Promise<Grupo[]> {
  return apiFetch<Grupo[]>('/grupos')
}

export function eliminarGrupo(grupoId: string): Promise<void> {
  return apiFetch<void>(`/grupos/${grupoId}`, { method: 'DELETE' })
}

export function listarAlumnosDeGrupo(grupoId: string): Promise<AlumnoDeGrupo[]> {
  return apiFetch<AlumnoDeGrupo[]>(`/grupos/${grupoId}/alumnos`)
}

/** No busca con menos de 2 caracteres - el backend devuelve una lista vacia (no revela el directorio completo). */
export function buscarAlumnosDisponibles(q: string): Promise<AlumnoBusqueda[]> {
  return apiFetch<AlumnoBusqueda[]>(`/grupos/alumnos-disponibles?q=${encodeURIComponent(q)}`)
}

export function agregarAlumno(grupoId: string, alumnoId: string): Promise<void> {
  return apiFetch<void>(`/grupos/${grupoId}/alumnos`, { method: 'POST', body: JSON.stringify({ alumnoId }) })
}

export function quitarAlumno(grupoId: string, alumnoId: string): Promise<void> {
  return apiFetch<void>(`/grupos/${grupoId}/alumnos/${alumnoId}`, { method: 'DELETE' })
}

export function listarAsignaciones(grupoId: string): Promise<Asignacion[]> {
  return apiFetch<Asignacion[]>(`/grupos/${grupoId}/asignaciones`)
}

export function asignarExamen(
  grupoId: string,
  examenId: string,
  fechaInicio: string,
  fechaFin: string,
): Promise<Asignacion> {
  return apiFetch<Asignacion>(`/grupos/${grupoId}/asignaciones`, {
    method: 'POST',
    body: JSON.stringify({ examenId, fechaInicio, fechaFin }),
  })
}

export function eliminarAsignacion(grupoId: string, asignacionId: string): Promise<void> {
  return apiFetch<void>(`/grupos/${grupoId}/asignaciones/${asignacionId}`, { method: 'DELETE' })
}
