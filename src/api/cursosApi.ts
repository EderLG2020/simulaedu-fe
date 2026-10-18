import { apiFetch } from './client'

export interface TemaResumen {
  id: string
  nombre: string
}

export interface CursoConTemas {
  id: string
  nombre: string
  categoria: 'COMUN' | 'LETRAS' | 'CIENCIAS' | 'IDIOMAS' | 'TECNOLOGIA'
  /** Nombre de icono de Material Symbols; mostrarlo con iconoDeCurso() (lib/iconosCurso). */
  icono: string
  temas: TemaResumen[]
}

/** Catalogo de cursos/temas: las pantallas lo cachean con claves.cursos (staleTime ESTABLE). */
export function listarCursos(): Promise<CursoConTemas[]> {
  return apiFetch<CursoConTemas[]>('/cursos')
}
