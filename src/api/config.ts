/** URL base de la API (sin barra final). Separada de client.ts para que lib/sesion.ts la use sin import circular. */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8085/api/v1'
