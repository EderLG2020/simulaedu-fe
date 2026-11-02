import { QueryClient } from '@tanstack/react-query'

/**
 * Cliente unico de TanStack Query: cache de las lecturas al backend, reintentos e invalidacion.
 * - staleTime 30 s: al volver a una pantalla se muestra lo que ya se tenia y se refresca en
 *   segundo plano solo si paso ese tiempo. Los catalogos que casi no cambian (universidades,
 *   cursos) usan uno mayor en su propia consulta (ver ESTABLE).
 * - Un reintento solo si la falla es de red: un error de la API (422 de plan, 404...) es una
 *   respuesta definitiva y reintentarlo solo demora el mensaje.
 * - Sin refetch al volver a la pestana: los datos de esta app no cambian tan seguido.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: (intentos, err) => !esErrorDeApi(err) && intentos < 1, refetchOnWindowFocus: false },
  },
})

/**
 * ApiError trae el `code` del backend. Se reconoce por esa forma y no con instanceof: importar
 * api/client desde aqui cerraria un ciclo (client -> sesion -> queryClient -> client).
 */
function esErrorDeApi(err: unknown): boolean {
  return err instanceof Error && typeof (err as { code?: unknown }).code === 'string'
}

/** staleTime de los catalogos que casi no cambian durante una sesion. */
export const ESTABLE = 5 * 60_000
