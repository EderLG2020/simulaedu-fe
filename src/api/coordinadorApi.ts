import { apiFetch } from './client'

export interface InstitucionCoordinador {
  id: string
  nombre: string
  tipo: 'ACADEMIA' | 'COLEGIO'
  licenciasTotales: number
  licenciasUsadas: number
  licenciasDisponibles: number
}

export interface AlumnoCoordinador {
  id: string
  nombre: string
  email: string
  licenciaAsignada: boolean
}

export function obtenerInstitucion(): Promise<InstitucionCoordinador> {
  return apiFetch<InstitucionCoordinador>('/coordinador/institucion')
}

/** El envelope de paginacion ya trae `data` como arreglo - apiFetch lo devuelve tal cual. */
export function listarAlumnos(): Promise<AlumnoCoordinador[]> {
  return apiFetch<AlumnoCoordinador[]>('/coordinador/alumnos?limit=100')
}

export function asignarLicencia(alumnoId: string): Promise<AlumnoCoordinador> {
  return apiFetch<AlumnoCoordinador>(`/coordinador/alumnos/${alumnoId}/licencia`, { method: 'POST' })
}

export function revocarLicencia(alumnoId: string): Promise<void> {
  return apiFetch<void>(`/coordinador/alumnos/${alumnoId}/licencia`, { method: 'DELETE' })
}
