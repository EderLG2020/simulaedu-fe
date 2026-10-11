import { describe, expect, it } from 'vitest'
import { formatearDuracionLarga, formatearPuntos, formatearTiempo, tieneRespuesta } from './formatoSimulacro'

describe('formatearTiempo', () => {
  it('usa mm:ss por debajo de una hora', () => {
    expect(formatearTiempo(3590)).toBe('59:50')
    expect(formatearTiempo(5)).toBe('00:05')
  })

  it('usa h:mm:ss desde una hora', () => {
    expect(formatearTiempo(3600)).toBe('1:00:00')
    expect(formatearTiempo(9918)).toBe('2:45:18')
  })
})

describe('formatearDuracionLarga', () => {
  it('muestra minutos y segundos', () => {
    expect(formatearDuracionLarga(2892)).toBe('48m 12s')
    expect(formatearDuracionLarga(40)).toBe('40s')
  })

  it('muestra horas cuando corresponde', () => {
    expect(formatearDuracionLarga(3725)).toBe('1h 02m')
  })
})

describe('formatearPuntos', () => {
  it('omite decimales en enteros y usa 2 en fracciones', () => {
    expect(formatearPuntos(72)).toBe('72')
    expect(formatearPuntos(71.875)).toBe('71.88')
  })
})

describe('tieneRespuesta', () => {
  it('considera en blanco un objeto vacio, valores nulos o listas vacias', () => {
    expect(tieneRespuesta({})).toBe(false)
    expect(tieneRespuesta({ valor: null })).toBe(false)
    expect(tieneRespuesta({ alternativaIds: [] })).toBe(false)
  })

  it('detecta una respuesta dada', () => {
    expect(tieneRespuesta({ alternativaId: 'a' })).toBe(true)
    expect(tieneRespuesta({ valor: 0 })).toBe(true)
  })
})
