import { resolve } from 'node:path'
import { ESLint } from 'eslint'
import { describe, expect, it, vi } from 'vitest'

/**
 * Comprueba que la regla de límites (eslint/limites.mjs) está viva: bloquea lo prohibido y deja pasar lo permitido.
 * Si el plugin dejara de resolver los imports, `pnpm lint` seguiría en verde sin vigilar nada; esta prueba lo avisa.
 */

// La primera revisión carga la configuración de ESLint y el plugin.
vi.setConfig({ testTimeout: 60_000 })

const REPO_ROOT = resolve(__dirname, '../../../..')
const eslint = new ESLint({ cwd: REPO_ROOT })

/** Reglas de límites que fallan al revisar `code` como si estuviera en `file` (ruta dentro de src/). */
async function reglasQueFallan(file: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: resolve(REPO_ROOT, 'apps/web/src', file) })
  return [
    ...new Set(
      result!.messages
        .filter((m) => m.severity === 2)
        .map((m) => m.ruleId)
        .filter((id): id is string => Boolean(id?.startsWith('boundaries/'))),
    ),
  ].sort()
}

const BLOQUEADO = ['boundaries/dependencies']

describe('límites entre capas y features de la app web', () => {
  describe('lo prohibido', () => {
    it('una feature importando otra por una ruta interna', async () => {
      expect(await reglasQueFallan('features/admin/x.ts', "import P from '../panel/components/PanelLayout'; export { P }")).toEqual(BLOQUEADO)
    })

    it('un import() dinámico y un export … from por una ruta interna', async () => {
      // Ruta armada aparte: así la prueba de arquitectura no toma este código de ejemplo como un import real.
      const pagina = '../features/admin/' + 'pages/AdminDashboardPage'
      expect(await reglasQueFallan('app/x.ts', `export const m = () => import('${pagina}')`)).toEqual(BLOQUEADO)
      expect(await reglasQueFallan('app/y.ts', `export { default } from '${pagina}'`)).toEqual(BLOQUEADO)
    })

    it('una feature que depende de otra que no le corresponde', async () => {
      expect(await reglasQueFallan('features/ranking/x.ts', "import { PanelLayout } from '../panel'; export { PanelLayout }")).toEqual(BLOQUEADO)
    })

    it('perfil no puede depender de panel: solo al revés', async () => {
      expect(await reglasQueFallan('features/perfil/x.ts', "import { PanelLayout } from '../panel'; export { PanelLayout }")).toEqual(BLOQUEADO)
    })

    it('una feature importando de app/', async () => {
      expect(await reglasQueFallan('features/admin/x.ts', "import { router } from '../../app/router'; export { router }")).toEqual(BLOQUEADO)
    })

    it('shared/ importando de una feature o de app/', async () => {
      expect(await reglasQueFallan('shared/lib/x.ts', "import { PanelLayout } from '../../features/panel'; export { PanelLayout }")).toEqual(BLOQUEADO)
      expect(await reglasQueFallan('shared/lib/y.ts', "import { router } from '../../app/router'; export { router }")).toEqual(BLOQUEADO)
    })

    it('una capa de shared/ importando de una capa superior', async () => {
      expect(await reglasQueFallan('shared/lib/x.ts', "import { useAuth } from '../hooks/useAuth'; export { useAuth }")).toEqual(BLOQUEADO)
      expect(await reglasQueFallan('shared/api/x.ts', "import { Button } from '../components/ui'; export { Button }")).toEqual(BLOQUEADO)
    })
  })

  describe('lo permitido', () => {
    it('las dependencias de la matriz, por su index', async () => {
      expect(await reglasQueFallan('features/admin/x.ts', "import { PanelLayout } from '../panel'; export { PanelLayout }")).toEqual([])
      expect(await reglasQueFallan('features/panel/x.ts', "import { ConfiguracionModal } from '../perfil'; export { ConfiguracionModal }")).toEqual([])
    })

    it('una feature usa sus propios archivos y shared/ sin pasar por el index', async () => {
      expect(
        await reglasQueFallan('features/admin/x.ts', "import A from './components/AdminLayout'; import { cn } from '../../shared/components/ui/cn'; export { A, cn }"),
      ).toEqual([])
    })

    it('app/ importa de las features por su index y de shared/', async () => {
      expect(
        await reglasQueFallan('app/x.ts', "import { AdminLayout } from '../features/admin'; import { useAuth } from '../shared/hooks/useAuth'; export { AdminLayout, useAuth }"),
      ).toEqual([])
    })

    it('las capas de shared/ en su orden, y paquetes externos', async () => {
      expect(
        await reglasQueFallan('shared/hooks/x.ts', "import { create } from 'zustand'; import { obtenerClaves } from '../api/claves'; import { formatear } from '../lib/formato'; export { create, obtenerClaves, formatear }"),
      ).toEqual([])
    })
  })
})
