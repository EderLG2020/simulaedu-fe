import { useQuery, useQueryClient } from '@tanstack/react-query'
import { claves } from '../api/claves'
import { contarNoLeidas } from '../api/notificacionesApi'
import type { ContextoLayout } from '../routes/contextoLayout'

/** Contador de notificaciones no leidas de los layouts (alumno y paneles), listo para su contexto. */
export function useNoLeidas(): ContextoLayout {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: claves.noLeidas, queryFn: contarNoLeidas })
  return {
    noLeidas: data ?? 0,
    refrescarNoLeidas: () => void queryClient.invalidateQueries({ queryKey: claves.noLeidas }),
  }
}
