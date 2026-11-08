import { describe, expect, it } from 'vitest'
import { formatearFecha, formatearPuntaje, nombreArchivoReporte } from './formato'

describe('formato del panel coordinador', () => {
  it('nombra el reporte con la sección sin tildes ni símbolos, la fecha y la extensión del formato', () => {
    const hoy = new Date(2026, 10, 8)
    expect(nombreArchivoReporte('5.° A', 'PDF', hoy)).toBe('reporte-5-a-2026-11-08.pdf')
    expect(nombreArchivoReporte('Colegio Demo', 'EXCEL', hoy)).toBe('reporte-colegio-demo-2026-11-08.xlsx')
  })

  it('sin actividad muestra "Nunca" y sin puntaje un guion', () => {
    expect(formatearFecha(null)).toBe('Nunca')
    expect(formatearPuntaje(null)).toBe('—')
  })
})
