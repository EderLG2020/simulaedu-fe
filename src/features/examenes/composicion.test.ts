import { describe, expect, it } from 'vitest'
import { moverElemento, repartirEquitativamente } from './composicion'

describe('repartirEquitativamente', () => {
  it('reparte en partes iguales cuando la division es exacta', () => {
    expect(repartirEquitativamente(100, 4)).toEqual([25, 25, 25, 25])
  })

  it('reparte el sobrante entre los primeros elementos y la suma cuadra', () => {
    const reparto = repartirEquitativamente(100, 3)
    expect(reparto).toEqual([34, 33, 33])
    expect(reparto.reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('devuelve arreglo vacio si no hay elementos', () => {
    expect(repartirEquitativamente(100, 0)).toEqual([])
  })

  it('asigna ceros cuando hay mas elementos que puntos', () => {
    expect(repartirEquitativamente(2, 4)).toEqual([1, 1, 0, 0])
  })
})

describe('moverElemento', () => {
  it('sube un elemento una posicion', () => {
    expect(moverElemento(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b'])
  })

  it('baja un elemento una posicion', () => {
    expect(moverElemento(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
  })

  it('no hace nada si el destino queda fuera de rango', () => {
    const lista = ['a', 'b']
    expect(moverElemento(lista, 0, -1)).toBe(lista)
    expect(moverElemento(lista, 1, 1)).toBe(lista)
  })
})
