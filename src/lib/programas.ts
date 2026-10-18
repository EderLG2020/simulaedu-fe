import type { TipoPrograma } from '../api/universidadesApi'

/**
 * Como se presenta cada tipo de programa (V20). "Universidad" en la API = programa: admision
 * universitaria, o idiomas / tecnologia (estos dos solo en planes de pago).
 */
export const TIPOS_PROGRAMA: Record<TipoPrograma, { etiqueta: string; descripcion: string; icono: string; fondo: string }> = {
  ADMISION: { etiqueta: 'Admisión', descripcion: 'Simulacros de admisión universitaria', icono: 'account_balance', fondo: 'bg-primary-50 text-primary-600' },
  IDIOMAS: { etiqueta: 'Idiomas', descripcion: 'Niveles de inglés y otros idiomas', icono: 'language', fondo: 'bg-rose-50 text-rose-600' },
  TECNOLOGIA: { etiqueta: 'Tecnología', descripcion: 'Bases de datos, programación y más', icono: 'code', fondo: 'bg-emerald-50 text-emerald-600' },
}

export const ORDEN_TIPOS_PROGRAMA: TipoPrograma[] = ['ADMISION', 'IDIOMAS', 'TECNOLOGIA']

/** Idiomas y tecnologia requieren un plan con programas extra; admision esta en todos. */
export function requierePlanDePago(tipo: TipoPrograma): boolean {
  return tipo !== 'ADMISION'
}
