import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { ICONO_CURSO_POR_DEFECTO, ICONOS_CURSO, iconoDeCurso } from './iconosCurso'

describe('iconos de curso', () => {
  it('todos los iconos ofrecidos al admin se descargan en index.html (si no: npm run iconos)', () => {
    const descargados = new Set((indexHtml.match(/icon_names=([a-z0-9_,]+)/)?.[1] ?? '').split(','))
    expect(ICONOS_CURSO.filter((icono) => !descargados.has(icono))).toEqual([])
  })

  it('usa el icono del curso si esta disponible', () => {
    expect(iconoDeCurso('calculate')).toBe('calculate')
  })

  it('cae al generico si falta o no se descarga', () => {
    expect(iconoDeCurso(undefined)).toBe(ICONO_CURSO_POR_DEFECTO)
    expect(iconoDeCurso('')).toBe(ICONO_CURSO_POR_DEFECTO)
    expect(iconoDeCurso('icono_que_no_existe')).toBe(ICONO_CURSO_POR_DEFECTO)
  })
})
