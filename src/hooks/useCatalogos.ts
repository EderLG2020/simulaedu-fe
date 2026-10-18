import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { listarUsuarios } from '../api/adminUsuariosApi'
import { claves } from '../api/claves'
import { listarCursos } from '../api/cursosApi'
import { listarUniversidades } from '../api/universidadesApi'
import { obtenerPerfil } from '../api/usuariosApi'
import { ESTABLE } from '../lib/queryClient'
import { useAuth } from './useAuth'

/** Catalogo de programas (universidades, idiomas, tecnologia). Se comparte entre pantallas. */
export function useUniversidades() {
  return useQuery({ queryKey: claves.universidades, queryFn: listarUniversidades, staleTime: ESTABLE })
}

/** Catalogo de cursos con sus temas (filtros y selectores). Se comparte entre pantallas. */
export function useCursos() {
  return useQuery({ queryKey: claves.cursos, queryFn: listarCursos, staleTime: ESTABLE })
}

/** Docentes (hasta 100) para filtrar por autor en moderacion y banco de preguntas. Solo admin. */
export function useDocentes(habilitado = true) {
  return useQuery({
    queryKey: claves.usuarios({ rol: 'DOCENTE', pagina: 1, limite: 100 }),
    queryFn: () => listarUsuarios({ rol: 'DOCENTE', page: 1, limit: 100 }).then((r) => r.data),
    enabled: habilitado,
    staleTime: ESTABLE,
  })
}

/**
 * Refresca el usuario de la sesion con GET /usuarios/me al entrar a la pantalla: el del login
 * puede venir sin los datos de su plan (planLimitaUniversidades, planIncluyeProgramas).
 */
export function usePerfilActualizado() {
  const { actualizarUsuario } = useAuth()
  const { data } = useQuery({ queryKey: claves.perfil, queryFn: obtenerPerfil, staleTime: 0 })
  useEffect(() => {
    if (data) actualizarUsuario(data)
  }, [data, actualizarUsuario])
}
