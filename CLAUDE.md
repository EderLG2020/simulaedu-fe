# simulaedu-fe

Monorepo pnpm + Turborepo:

| Workspace | Qué es | Tests |
|---|---|---|
| `apps/web` (`@simulaedu/web`) | App web de SimulaEdu: alumno, docente, coordinador, admin y landing (React 19 + Vite) | Vitest |
| `packages/architecture` (`@simulaedu/architecture`) | Reglas de arquitectura (ArchUnitTS), matriz de features y script de knip | Vitest |

## Cómo leer este archivo

- **Vigente:** se cumple hoy y lo hace cumplir el lint o un test. Romperlo hace fallar el build.
- **Objetivo:** estructura a la que va la app. Las listas de violaciones conocidas de límites (ArchUnitTS y ESLint) están en cero y la de knip tiene solo un alias intencional, así que hoy la app cumple las reglas de este archivo. Si alguna vez hiciera falta congelar deuda, las listas solo pueden bajar y el lint y las pruebas fallan con cualquier violación nueva.

## Comandos

Todo desde la raíz del repo.

```bash
pnpm install
pnpm dev             # app web en http://localhost:5177
pnpm lint            # 0 errores; incluye los límites entre capas y features
pnpm typecheck
pnpm test            # incluye las pruebas de arquitectura
pnpm knip            # código, exports y dependencias sin uso
pnpm build
```

Para un solo workspace: `pnpm --filter @simulaedu/web <script>`. Si `lint`, `typecheck`, `test`, `knip` y `build` terminan sin errores, el CI debería pasar.

## Estructura de la app (`apps/web/src`)

```
app/        composición: main, App, router, rutas protegidas, estilos globales
shared/     código sin dominio, en capas: lib → stores → api → hooks → components (+ test, assets)
features/*  un contexto por carpeta, con su index.ts como única entrada
```

Dentro de una feature (vigente: lo exige la prueba de arquitectura):

```
features/<x>/
  index.ts      única entrada; lo único que va en la raíz
  pages/        pantallas de una ruta: *Page.tsx (y solo eso)
  components/   componentes de la feature (se puede anidar: components/secciones/)
  hooks/        hooks de la feature: use*.ts(x)
  api/          clientes HTTP de la feature: *Api.ts
  lib/          lógica pura, estilos, formularios, datos y tipos de la feature
```

Las pruebas van junto a su archivo (`pages/XPage.test.tsx`).

## Reglas de límites (vigentes)

1. **`shared/` no importa de `features/` ni de `app/`.** Vale también para sus tests.
2. **Capas de `shared/`:** cada carpeta solo importa de sí misma y de las de su fila:

   | Capa | Puede importar de |
   |---|---|
   | `lib` | — (utilidades puras, sin red ni estado) |
   | `stores` | lib |
   | `api` | lib, stores |
   | `hooks` | lib, stores, api |
   | `components` | lib, stores, hooks |
   | `test` | lib, stores, api, hooks, components |
   | `assets` | — |

3. **Una feature no importa de `app/`.**
4. **A una feature solo se entra por su `index.ts`**, desde otra feature o desde `app/`. Nunca por una ruta interna (`../panel/PanelLayout`). Dentro de la propia feature se importa por ruta directa. Cuentan también `import type`, `import()` y `export … from`.
5. **Las páginas que `app/` carga con `lazy` se exponen como funciones cargadoras** en el `index.ts` (`export const cargarLoginPage = () => import('./LoginPage')`), con el `import()` dentro de la feature. Exportar la página de forma estática la metería en el bundle inicial.
6. **Dependencias permitidas entre features:** solo las de la matriz (abajo). Cualquier otra, incluida la inversa de una permitida, es una decisión de arquitectura: se añade en `matrices.json`, no se esquiva ni se silencia con un comentario de lint.
7. **Sin ciclos entre features.** Un ciclo se corta moviendo lo compartido a `shared/` o invirtiendo la dependencia con props o un contexto que provee `app/`.
8. **Composición entre features por props, slots o un contexto de `app/`**, no importando la feature que rellena el hueco.
9. **`index.ts` exporta solo lo que usa otra feature o `app/`.** No se exporta «por si acaso»: knip lo marca.
10. **Datos `mock*`/`demo*` no se usan en producción.**

## Reglas de convención por archivo (vigentes)

Las hace cumplir la prueba de arquitectura (ArchUnitTS); el prefijo es el que aparece en el mensaje de error.

| Regla | Qué exige |
|---|---|
| `estructura-de-feature` | En la raíz de `features/<x>/` solo hay `index.ts`; el resto va en `pages/`, `components/`, `hooks/`, `api/` o `lib/` |
| `nombre-de-pagina` | Todo `*Page.tsx` de una feature está en `pages/`, y en `pages/` solo hay `*Page.tsx` (y sus tests) |
| `nombre-de-hook` | Los archivos de `hooks/` (de una feature o de `shared/`) se llaman `use*` |
| `cliente-api-fuera-de-api` | Los `*Api.ts` viven en `shared/api/` o en `features/<x>/api/` |
| `fetch-fuera-de-api` | Solo `shared/api/` y `features/<x>/api/` llaman a `fetch`, `apiFetch`, `apiFetchPagina`, `apiFetchArchivo`, `todasLasPaginas` o `fetchMonitoreado`. Un hook o una página piden los datos a su cliente de API |

## Matriz de dependencias entre features

Fuente única: `packages/architecture/src/matrices.json`. La leen el lint y la prueba de arquitectura. Si cambia, se cambia esta tabla en el mismo commit.

| Feature | Puede depender de |
|---|---|
| `admin`, `coordinador`, `docente` | `panel` (shell de los paneles internos) |
| `home`, `panel` | `perfil` (modal de configuración de la cuenta) |
| `auth`, `examenes`, `landing`, `notificaciones`, `perfil`, `preguntas`, `ranking`, `simulacro` | ninguna |

Todas pueden usar `shared/`. Una feature nueva se declara en `matrices.json` **en el mismo cambio** que la crea, junto con su `index.ts`; si no, la prueba de arquitectura falla con `feature-sin-declarar`.

## Qué va en `shared/` (objetivo)

- Lo que no tiene dueño de dominio y lo usan **dos o más** features o `app/`. Un módulo usado por una sola feature vive en esa feature: la prueba de arquitectura lo marca como `shared-con-un-solo-dueno`.
- Un componente de `shared/` no lee stores de una feature: recibe los datos por props.
- Antes de crear algo genérico, busca si ya existe en `shared/`.

## Verificación de arquitectura

Tres chequeos, todos en CI. Los tres comparan con la deuda que ya existía y fallan en las dos direcciones: si aparece una violación nueva y si una conocida se corrige pero sigue en la lista.

| Chequeo | Herramienta | Lista de deuda |
|---|---|---|
| Lint de límites (`pnpm lint`, también en el editor) | eslint-plugin-boundaries, regla en `eslint/limites.mjs` | `apps/web/eslint-suppressions.json` |
| Pruebas de arquitectura (`pnpm test`), incluidas las convenciones por archivo | ArchUnitTS, `@simulaedu/architecture`; prueba en `apps/web/src/app/architecture.test.ts` | `apps/web/src/app/architecture.baseline.txt` |
| Código muerto (`pnpm knip`) | knip, `knip.jsonc` | `knip.baseline.txt` |

- `apps/web/src/app/featureBoundaries.test.ts` demuestra que la regla de ESLint bloquea lo prohibido. Si se toca `eslint/limites.mjs`, debe seguir en verde: sin ella una configuración rota deja el lint «verde» pero inerte.
- Las reglas de ArchUnitTS tienen sus pruebas en `packages/architecture/src/rules.test.ts`; una regla nueva entra con un caso que la rompa.
- `turbo.json` declara `eslint.config.mjs`, `eslint/**` y `packages/architecture/src/**` como `globalDependencies` para que la caché no oculte un cambio de reglas.

### Qué hacer cuando falla un chequeo

**1. «violaciones nuevas» / `added` / error de lint:** tu cambio rompe una regla. Se corrige el código. **No** se actualiza la lista para que pase.

**2. «corregidas» / `fixed` / «suppressions left that do not occur anymore»:** arreglaste deuda; hay que sacarla de la lista con el comando de la tabla y subir el archivo en el mismo commit:

| Chequeo | Desde | Comando |
|---|---|---|
| Pruebas de arquitectura | `apps/web` | `UPDATE_BASELINE=1 pnpm test src/app/architecture.test.ts` |
| knip | la raíz | `UPDATE_BASELINE=1 pnpm knip` |
| Lint de límites | `apps/web` | `pnpm exec eslint . --prune-suppressions` |

Después comprueba que en las listas **solo se borraron líneas**:

```bash
git diff -- '*baseline.txt' apps/web/eslint-suppressions.json
```

En revisión: una lista con líneas **añadidas** es deuda nueva escondida y se rechaza.

## Mover, renombrar y borrar

- Mover archivos con `git mv`, para conservar el historial.
- Tras mover, corregir los `vi.mock` con ruta relativa: una ruta que ya no resuelve no falla, el mock deja de aplicarse en silencio.
- Una prueba mockea otra feature por su `index.ts`, no por una ruta interna.
- Si algo no tiene consumidor, se borra (knip lo marca).

## Pruebas

- Una prueba nueva debe haber fallado alguna vez: rompe a propósito lo que protege, comprueba que falla y restáuralo.
- Las pruebas que necesitan Node (leer el repo, ESLint) se añaden a `apps/web/tsconfig.node-tests.json` y se excluyen de `tsconfig.app.json`, que solo tiene los tipos del navegador.
- Tests de pantallas con `renderConQuery` de `shared/test/conQuery.tsx`.

## Antes de dar algo por terminado

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm knip && pnpm build
```

Un cambio de arquitectura (feature nueva, dependencia nueva entre features, mover archivos entre capas) se menciona en la descripción del PR.

## Referencia

Convenciones de datos y de UI en `README.md`. Diagnóstico y fases de la refactorización en `docs/architecture/`. Documentación general del proyecto en `simulaedu-be/docs/`.
