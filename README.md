# SimulaEdu — Frontend

SPA de SimulaEdu (React 19 + Vite + TypeScript, Tailwind CSS 4, Zustand, React Router 7).
La documentación del proyecto (arquitectura, API, variables de entorno) vive en el repo del
backend: `simulaedu-be/docs/`.

## Levantar en local

Requiere el backend corriendo en http://localhost:8085 (ver `simulaedu-be/README.md`: la BD
y Adminer van en Docker, el backend corre en la PC).

```bash
npm install
npm run dev
```

App en http://localhost:5177 (puerto fijo en `vite.config.ts`; el backend solo acepta ese
origen vía `CORS_ALLOWED_ORIGINS`).

Variables (`.env`, copiar de `.env.example`):

| Variable | Ejemplo local |
|---|---|
| `VITE_API_URL` | `http://localhost:8085/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth de Google (login social) |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Typecheck + build de producción en `dist/` |
| `npm test` | Tests (Vitest + Testing Library) |
| `npm run lint` | ESLint |

## Datos del backend

- **Lecturas con TanStack Query** (`useQuery`), no con `useEffect` + `.then()`: la cache,
  los reintentos, el "cargando" y la cancelacion vienen resueltos. Cliente unico en
  `src/lib/queryClient.ts` (staleTime 30 s, reintenta solo fallas de red).
- **Claves** en `src/api/claves.ts`: la pantalla que lee y la operacion que invalida usan la
  misma. Invalidar un prefijo (ej. `claves.examenes.todos`) invalida todo lo que cuelga de el.
- **Catalogos compartidos** como hooks en `src/hooks/useCatalogos.ts` (`useUniversidades`,
  `useCursos`, `useDocentes`, `usePerfilActualizado`); el contador de avisos en `useNoLeidas`.
- **Despues de una escritura**: o la pantalla hace `refetch()`/`invalidateQueries`, o la
  funcion de `api/` invalida lo que cambia para todas las pantallas (ej. `finalizarSimulacro`
  invalida historial y avisos). Al cerrar sesion se vacia toda la cache.
- **Mensajes de error**: `mensajeDeError(err, 'No se pudo X')` de `api/client.ts`.
- **Listas que se filtran en el navegador**: `todasLasPaginas(path)` trae todas las paginas
  (el backend limita a 100 por pagina).
- **Tests de pantallas**: `renderConQuery` de `src/test/conQuery.tsx` (provider con un cliente
  nuevo por test y sin reintentos).

## Convenciones de UI

- **Rutas:** todas en `src/router.tsx`, cada pantalla cargada con `lazy` (code-splitting).
  `RutaProtegida` exige sesión y `RutaPorRol` exige rol.
- **Transiciones entre páginas:** se usa la View Transitions API del navegador, activada una
  sola vez en `src/router.tsx` (envuelve `router.navigate`, así aplica a todo `<Link>`,
  `navigate()` y `<Navigate>` sin tocar cada uno). Las animaciones están en `src/index.css`
  (`::view-transition-*`): la página saliente se desvanece y la entrante aparece con un fundido.
  Para desactivarla en una navegación puntual: `viewTransition: false`.
  - Las barras fijas llevan una clase `vt-*` (`vt-encabezado`, `vt-panel-sidebar`,
    `vt-panel-topbar`) para que no se deslicen con el contenido. Cada nombre debe aparecer **una
    sola vez** por página: si dos elementos visibles comparten nombre, el navegador cancela la
    transición.
  - Respeta `prefers-reduced-motion` (sin animación). En navegadores sin soporte se navega
    igual, sin animar.
- **Entradas dentro de la página** (clases CSS en `src/index.css`, sin JS):
  - `entrada-escalonada`: cada hijo directo entra subiendo, uno tras otro (50 ms entre cada uno).
    Va en el `<main>` de las páginas del alumno, de `AuthShell` y en las grillas de exámenes.
    Una página nueva del alumno solo necesita poner esta clase en su `<main>`.
  - `entrada-escalonada-anidada`: lo mismo un nivel más adentro. Va en el `<main>` de
    `PanelLayout`, así todas las páginas de admin, docente y coordinador lo heredan sin tocarlas.
  - `animar-menu` (menús desplegables), `animar-fondo` + `animar-dialogo` (modales; `Modal` ya
    las trae).
  - Los botones de `components/ui` se hunden levemente al presionarlos (`active:scale`).
  - Con `prefers-reduced-motion: reduce` no hay desplazamientos: solo fundidos cortos.
- **Animaciones propias de la landing** (reveal al hacer scroll, contadores, acordeón): con
  Motion (`motion/react`). Ver `src/features/landing/`.
