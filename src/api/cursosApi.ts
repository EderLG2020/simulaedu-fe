import { apiFetch } from './client'
import { cachedFetch } from '../lib/requestCache'

export interface TemaResumen {
  id: string
  nombre: string
}

export interface CursoConTemas {
  id: string
  nombre: string
  categoria: 'COMUN' | 'LETRAS' | 'CIENCIAS' | 'IDIOMAS' | 'TECNOLOGIA'
  temas: TemaResumen[]
}

/** Catalogo de cursos/temas - cambia poco, se cachea igual que universidades. */
export function listarCursos(): Promise<CursoConTemas[]> {
  return cachedFetch('cursos', () => apiFetch<CursoConTemas[]>('/cursos'))
}
