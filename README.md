# SimulaEdu — Frontend

Monorepo **pnpm + Turborepo** del frontend de SimulaEdu. La app web (`apps/web`) es una SPA con React 19 +
Vite + TypeScript, Tailwind CSS 4, Zustand y React Router 7. Las reglas de arquitectura y de trabajo están
en [CLAUDE.md](CLAUDE.md).

| Workspace | Qué es |
|---|---|
| `apps/web` (`@simulaedu/web`) | App web: alumnos, docentes, coordinadores, administradores y landing |
| `packages/architecture` (`@simulaedu/architecture`) | Reglas de arquitectura (ArchUnitTS), matriz de features y script de knip |

La documentación del proyecto (arquitectura, API, variables de entorno) vive en el repo del
backend: `simulaedu-be/docs/`.

## Levantar en local

Requiere el backend corriendo en http://localhost:8085 (ver `simulaedu-be/README.md`: la BD
y Adminer van en Docker, el backend corre en la PC).

```bash
pnpm install
pnpm dev
```

Requiere Node 22 y pnpm 11 (`corepack enable` instala la versión de `packageManager`).

App en http://localhost:5177 (puerto fijo en `apps/web/vite.config.ts`; el backend solo acepta ese
origen vía `CORS_ALLOWED_ORIGINS`).

Variables (`apps/web/.env`, copiar de `apps/web/.env.example`):

| Variable | Ejemplo local |
|---|---|
| `VITE_API_URL` | `http://localhost:8085/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth de Google (login social) |
| `VITE_SITE_URL` | Dominio público para canonical, Open Graph, `robots.txt` y `sitemap.xml` (`https://simulaedu.pe` en prod; sin ella se usa `http://localhost:5177`) |

## SEO

- `apps/web/vite/seo.ts` (plugin de Vite) genera `robots.txt` y `sitemap.xml` en `pnpm build` (en `pnpm dev` los sirve
  en `/robots.txt` y `/sitemap.xml`) y reemplaza `__SITE_URL__` en `index.html`. El robots bloquea las rutas con sesión y
  declara también el `/sitemap.xml` del backend, que lista las páginas de la landing publicadas desde el panel.
- `index.html` trae las metaetiquetas base (título, description, canonical, Open Graph, Twitter Card) y el JSON-LD
  del sitio: las redes sociales no ejecutan JS.
- Cada página pública fija las suyas con `useSeo` (`shared/hooks/useSeo.ts`); las de un solo uso (verificar correo,
  restablecer contraseña...) llevan `noindex: true`. Una página pública nueva usa `useSeo` y, si debe indexarse, se
  agrega a `PAGINAS_PUBLICAS` en `vite/seo.ts`; una ruta privada nueva va en `RUTAS_PRIVADAS`.
- Detalle y pendientes en `simulaedu-be/docs/02-arquitectura.md` sección 9.5.

## Scripts

Desde la raíz del repo:

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Typecheck + build de producción en `apps/web/dist/` |
| `pnpm test` | Tests (Vitest + Testing Library), incluidas las pruebas de arquitectura |
| `pnpm lint` | ESLint, incluidos los límites entre capas y features |
| `pnpm typecheck` | TypeScript |
| `pnpm knip` | Código, exports y dependencias sin uso |
| `pnpm --filter @simulaedu/web iconos` | Regenera la lista de iconos de `index.html` |

## Arquitectura

`apps/web/src` se divide en `app/` (composición: router, rutas protegidas, `App`), `shared/` (código sin dominio, en
capas `lib` → `stores` → `api` → `hooks` → `components`) y `features/*` (una carpeta por contexto, con su
`index.ts` como única entrada). Las reglas completas, la matriz de features y qué hacer cuando falla un chequeo están
en [CLAUDE.md](CLAUDE.md). Las hacen cumplir:

- **eslint-plugin-boundaries** (`eslint/limites.mjs`), en `pnpm lint` y en el editor.
- **ArchUnitTS** (`@simulaedu/architecture`), en `pnpm test` (`apps/web/src/app/architecture.test.ts`).
- **knip**, en `pnpm knip`.

Diagnóstico y fases de la refactorización: [docs/architecture/](docs/architecture/README.md).

## Datos del backend

Rutas relativas a `apps/web/src/`.


- **Lecturas con TanStack Query** (`useQuery`), no con `useEffect` + `.then()`: la cache,
  los reintentos, el "cargando" y la cancelacion vienen resueltos. Cliente unico en
  `shared/lib/queryClient.ts` (staleTime 30 s, reintenta solo fallas de red).
- **Claves** en `shared/api/claves.ts`: la pantalla que lee y la operacion que invalida usan la
  misma. Invalidar un prefijo (ej. `claves.examenes.todos`) invalida todo lo que cuelga de el.
- **Catalogos compartidos** como hooks en `shared/hooks/useCatalogos.ts` (`useUniversidades`,
  `useCursos`, `useDocentes`, `usePerfilActualizado`); el contador de avisos en `useNoLeidas`.
- **Despues de una escritura**: o la pantalla hace `refetch()`/`invalidateQueries`, o la
  funcion de `shared/api/` invalida lo que cambia para todas las pantallas (ej. `finalizarSimulacro`
  invalida historial y avisos). Al cerrar sesion se vacia toda la cache.
- **Mensajes de error**: `mensajeDeError(err, 'No se pudo X')` de `shared/api/client.ts`.
- **Listas que se filtran en el navegador**: `todasLasPaginas(path)` trae todas las paginas
  (el backend limita a 100 por pagina).
- **Tests de pantallas**: `renderConQuery` de `shared/test/conQuery.tsx` (provider con un cliente
  nuevo por test y sin reintentos).

## Convenciones de UI

- **Rutas:** todas en `app/router.tsx`, cada pantalla cargada con `lazy` (code-splitting).
  `RutaProtegida` exige sesión y `RutaPorRol` exige rol. Cada feature expone sus páginas en su `index.ts` como
  funciones cargadoras (`cargarLoginPage = () => import('./LoginPage')`), así `app/` no entra por rutas internas y
  se conserva el code-splitting.
- **Transiciones entre páginas:** se usa la View Transitions API del navegador, activada una
  sola vez en `app/router.tsx` (envuelve `router.navigate`, así aplica a todo `<Link>`,
  `navigate()` y `<Navigate>` sin tocar cada uno). Las animaciones están en `app/index.css`
  (`::view-transition-*`): la página saliente se desvanece y la entrante aparece con un fundido.
  Para desactivarla en una navegación puntual: `viewTransition: false`.
  - Las barras fijas llevan una clase `vt-*` (`vt-encabezado`, `vt-panel-sidebar`,
    `vt-panel-topbar`) para que no se deslicen con el contenido. Cada nombre debe aparecer **una
    sola vez** por página: si dos elementos visibles comparten nombre, el navegador cancela la
    transición.
  - Respeta `prefers-reduced-motion` (sin animación). En navegadores sin soporte se navega
    igual, sin animar.
- **Entradas dentro de la página** (clases CSS en `app/index.css`, sin JS):
  - `entrada-escalonada`: cada hijo directo entra subiendo, uno tras otro (50 ms entre cada uno).
    Va en el `<main>` de las páginas del alumno, de `AuthShell` y en las grillas de exámenes.
    Una página nueva del alumno solo necesita poner esta clase en su `<main>`.
  - `entrada-escalonada-anidada`: lo mismo un nivel más adentro. Va en el `<main>` de
    `PanelLayout`, así todas las páginas de admin, docente y coordinador lo heredan sin tocarlas.
  - `animar-menu` (menús desplegables), `animar-fondo` + `animar-dialogo` (modales; `Modal` ya
    las trae).
  - Los botones de `shared/components/ui` se hunden levemente al presionarlos (`active:scale`).
  - Con `prefers-reduced-motion: reduce` no hay desplazamientos: solo fundidos cortos.
- **Animaciones propias de la landing** (reveal al hacer scroll, contadores, acordeón): con
  Motion (`motion/react`). Ver `features/landing/`.
