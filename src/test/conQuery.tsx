import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

/** Cliente nuevo por test (sin cache compartido entre tests) y sin reintentos (un error falla al toque). */
export function clienteDePrueba(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

/** render() de Testing Library con un QueryClientProvider alrededor: para pantallas que usan useQuery. */
export function renderConQuery(ui: ReactElement, opciones?: RenderOptions) {
  const cliente = clienteDePrueba()
  function Envoltorio({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  }
  return render(ui, { wrapper: Envoltorio, ...opciones })
}
