import { resolve } from 'node:path'
import { checkArchitecture } from '@simulaedu/architecture'
import { describe, expect, it } from 'vitest'

/**
 * Reglas de arquitectura sobre todo el grafo de imports (ArchUnitTS): límites entre capas, capas de shared/, matriz de
 * features, ciclos, mocks y shared/ con un solo dueño. Las violaciones que ya existían están en
 * architecture.baseline.txt y solo pueden bajar.
 */
describe('arquitectura de la app web', () => {
  it('no hay violaciones fuera de la lista de conocidas, y ninguna conocida está ya corregida', async () => {
    const { added, fixed } = await checkArchitecture({ app: 'web', appDir: resolve(__dirname, '../..') })
    expect(added, 'violaciones nuevas: corrige el código').toEqual([])
    expect(fixed, 'corregidas: UPDATE_BASELINE=1 pnpm test src/app/architecture.test.ts').toEqual([])
  }, 120_000)
})
