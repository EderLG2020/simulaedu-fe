import type { ExamenResumen } from '../../api/examenesApi'

/** Etiqueta de cada tipo de examen en las tarjetas del alumno y en el panel del docente. */
export const ETIQUETA_TIPO = {
  SIMULACRO_COMPLETO: { texto: 'Simulacro completo', icono: 'assignment', clase: 'bg-primary-50 text-primary-600' },
  PRACTICA_TEMA: { texto: 'Práctica', icono: 'edit_note', clase: 'bg-accent-50 text-accent-700' },
} as const

/** "1 simulacro · 6 prácticas", omitiendo el tipo que no tenga examenes. */
export function resumenPorTipo(examenes: Pick<ExamenResumen, 'tipo'>[]): string {
  const simulacros = examenes.filter((e) => e.tipo === 'SIMULACRO_COMPLETO').length
  const practicas = examenes.filter((e) => e.tipo === 'PRACTICA_TEMA').length
  return [
    simulacros > 0 && `${simulacros} ${simulacros === 1 ? 'simulacro' : 'simulacros'}`,
    practicas > 0 && `${practicas} ${practicas === 1 ? 'práctica' : 'prácticas'}`,
  ]
    .filter(Boolean)
    .join(' · ')
}
