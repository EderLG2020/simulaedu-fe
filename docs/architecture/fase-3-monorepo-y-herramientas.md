# Fase 3 — Monorepo y herramientas de arquitectura (frontend)

Lleva el frontend a la misma forma que `valora-fe`: un monorepo **pnpm + Turborepo**, con la app dividida en
`app/`, `shared/` y `features/*`, y las reglas impuestas por herramientas en vez de un test propio. No cambia
ninguna pantalla, texto, ruta ni llamada al backend: cambian ubicaciones de archivos, imports y tooling.

Verificado: `pnpm lint`, `pnpm typecheck`, `pnpm test` (147 pruebas de la app y 17 de las reglas), `pnpm knip` y
`pnpm build` en verde. Cada chequeo se rompió a propósito para comprobar que falla: una feature `ranking` que importa
`../panel` y `../admin/AdminLayout` hace fallar el lint y la prueba de arquitectura, y quitar una violación de la
lista (corregir `shared/lib/programas.ts`) hace fallar la prueba y las supresiones de ESLint.

## 1. Monorepo

| Antes | Después |
|---|---|
| Un solo paquete npm (`package.json`, `package-lock.json`) | Raíz pnpm (`pnpm-workspace.yaml`, `pnpm-lock.yaml`) con `turbo` para `build`, `lint`, `typecheck` y `test` |
| `index.html`, `public/`, `src/`, `scripts/`, configs de Vite/Vitest/TS en la raíz | `apps/web/` (`@simulaedu/web`) |
| `eslint.config.js` de la app | `eslint.config.mjs` en la raíz + `eslint/limites.mjs` |
| — | `packages/architecture` (`@simulaedu/architecture`): reglas de ArchUnitTS, `matrices.json` y el script de knip |
| — | `knip.jsonc` y `knip.baseline.txt` |

El lockfile se generó con `pnpm import` desde el `package-lock.json` anterior: las versiones de la app no cambian
(React 19.2.8, Vite 8.2.2, Vitest 4.1.11, TypeScript 6.0.3…). El CI usa `pnpm install --frozen-lockfile`.

## 2. Capas dentro de `apps/web/src`

| Antes (`src/…`) | Después (`apps/web/src/…`) |
|---|---|
| `main.tsx`, `App.tsx`, `App.test.tsx`, `router.tsx`, `index.css`, `iconos.test.ts` | `app/` |
| `routes/` | `app/routes/` |
| `lib/`, `stores/`, `api/`, `hooks/`, `components/`, `test/`, `assets/` | `shared/<mismo nombre>/` |
| `setupTests.ts` | `apps/web/vitest.setup.ts` |
| `arquitectura.test.ts`, `arquitectura-baseline.txt` | Reemplazados por `app/architecture.test.ts`, `app/architecture.baseline.txt` y `app/featureBoundaries.test.ts` |

Los archivos se movieron con `git mv` y los imports relativos se reescribieron con un script, incluidos los
`vi.mock`.

### Entrada a las features por su `index.ts`

`app/router.tsx` y `app/App.tsx` importaban 37 páginas y 4 layouts por ruta interna. Ahora cada feature los expone en
su `index.ts`. Los layouts se exportan directamente; las páginas, como funciones cargadoras para conservar el
code-splitting:

```ts
// features/auth/index.ts (las páginas viven en pages/ desde las reglas de convención)
export const cargarLoginPage = () => import('./pages/LoginPage')

// app/router.tsx
{ path: '/login', lazy: pagina(cargarLoginPage) }
```

Features con `index.ts` nuevo: `admin`, `auth`, `coordinador`, `docente`, `examenes`, `home`, `landing`,
`notificaciones`, `preguntas`, `ranking`, `simulacro`.

## 3. Herramientas

| Herramienta | Qué hace cumplir | Deuda congelada |
|---|---|---|
| **eslint-plugin-boundaries** 7 (`boundaries/dependencies`) | `app/` → todo; `shared/<capa>` → solo sus capas permitidas; feature → `shared/` y las features de su fila, solo por `index.ts`; también `export … from`, `import()` y `require()` | `apps/web/eslint-suppressions.json`: 3 |
| **ArchUnitTS** (`@simulaedu/architecture`) | Lo mismo sobre todo el grafo, más ciclos entre features, `mock*`/`demo*` en producción, módulos de `shared/` con un solo dueño, archivos de una feature que solo reexportan `shared/` y pruebas que mockean rutas internas de otra feature | `architecture.baseline.txt`: 20 |
| **knip** | Archivos, exports, tipos y dependencias sin uso | `knip.baseline.txt`: 31 |

`featureBoundaries.test.ts` comprueba con la API de ESLint que la regla bloquea lo prohibido y deja pasar lo
permitido: si el plugin dejara de resolver los imports, el lint seguiría en verde sin vigilar nada.

Las dos pruebas que corren en Node (leen el repo y usan ESLint) tienen su propio `tsconfig.node-tests.json`. El
`tsconfig.app.json` solo tiene los tipos del navegador.

## 4. Deuda saldada

| Lista | Al entrar las herramientas | Ahora |
|---|---:|---:|
| `apps/web/src/app/architecture.baseline.txt` (ArchUnitTS) | 20 | 0 |
| `apps/web/eslint-suppressions.json` (ESLint) | 3 | 0 |
| `knip.baseline.txt` | 31 | 1 |

| Deuda | Cómo se resolvió |
|---|---|
| Capas de `shared/` (3, imports de tipos) | `Usuario` y `TipoPrograma` pasan a `shared/lib/tipos/`; `authApi` y `universidadesApi` los reexportan (F2-05) |
| Mocks de rutas internas (3) | `App.test.tsx` y `StudentHeader.test.tsx` mockean el `index.ts` de `landing` y `perfil` |
| `shared/` con un solo dueño (14) | `git mv` a su dueño: 12 clientes de `shared/api/` a su feature, `BannerConexion` a `app/` e `InfoTooltip` (con su test) a `features/examenes/` (F2-07) |
| knip (30 de 31) | Se quitó `export` a 6 constantes o funciones y 23 tipos que solo se usan en su archivo (`ItemNav` deja de exportarse desde `panel`), se borró `infoBanner` (sin uso), el reexporte sin uso de `ReglasCalificacion` en `examenesApi.ts` y la dependencia `@testing-library/user-event` |

Queda 1 hallazgo de knip a propósito: `subirImagenPregunta` es un alias de `subirArchivoPregunta` que se conserva por
nombre (ver su comentario en `shared/api/preguntasApi.ts`).

Verificado: `pnpm lint`, `pnpm typecheck`, `pnpm test` (147 + 17), `pnpm knip` y `pnpm build` en verde. En el diff de
las tres listas solo se borraron líneas.

## Reglas de convención por archivo

Además de los límites entre capas, `@simulaedu/architecture` comprueba dónde va y cómo se llama cada archivo. Cada
regla tiene en `rules.test.ts` un caso que la cumple y otro que la rompe, y se verificó rompiéndolas en la app.

| Regla | Qué exige |
|---|---|
| `estructura-de-feature` | En la raíz de una feature solo `index.ts`; el resto en `pages/`, `components/`, `hooks/`, `api/` o `lib/` |
| `nombre-de-pagina` | `*Page.tsx` solo en `pages/`, y en `pages/` solo páginas |
| `nombre-de-hook` | Archivos de `hooks/` (features y `shared/`) con nombre `use*` |
| `cliente-api-fuera-de-api` | `*Api.ts` solo en `shared/api/` o `features/<x>/api/` |
| `fetch-fuera-de-api` | Las peticiones de red (`fetch`, `apiFetch`…) solo en esas carpetas de API |

Para cumplirlas se movieron con `git mv` 126 archivos de las features a sus subcarpetas (páginas, componentes,
hooks, clientes de API y `lib/`; `landing/secciones/` pasó a `landing/components/secciones/`), con sus imports,
`vi.mock` e `index.ts` reescritos. Además:

- `shared/hooks/contextoLayout.ts` → `shared/hooks/useContextoLayout.ts`: exporta el hook `useContextoLayout` y su
  tipo, así que es un hook y conserva su capa.
- `fetchMonitoreado` sale de `shared/stores/conexionStore.ts` a `shared/api/fetchMonitoreado.ts`: hace la petición
  y avisa al store (`api` puede importar de `stores`). El store se queda solo con el estado de la conexión.

La lista de deuda sigue vacía: ninguna violación nueva.

