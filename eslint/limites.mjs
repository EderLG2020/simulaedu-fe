import { fileURLToPath } from 'node:url';
import boundaries from 'eslint-plugin-boundaries';

const RAIZ_DEL_REPO = fileURLToPath(new URL('..', import.meta.url));

/**
 * Límites de arquitectura de una app con la estructura `src/{app,shared/*,features/*}` (eslint-plugin-boundaries).
 *
 * Reglas (todas en error):
 *  - app/ puede importar de todo, pero a una feature solo entra por su `index.ts`.
 *  - shared/<capa> solo importa de sí misma y de las capas de shared/ que le permite `capasDeShared`; nunca de
 *    features/ ni de app/.
 *  - Una feature importa de sí misma (por ruta directa), de shared/ y, solo por su `index.ts`, de las features que le
 *    permiten `features` o `compartidas`.
 *
 * @param {object} opciones
 * @param {string} opciones.app Carpeta de la app desde la raíz del repo, ej. 'apps/web'.
 * @param {Record<string, string[]>} opciones.features Cada feature y las otras features de las que puede depender.
 * @param {Record<string, string[]>} opciones.capasDeShared Cada carpeta de shared/ y las otras de las que puede importar.
 * @param {string[]} [opciones.compartidas] Features que todas las demás pueden consumir.
 */
export function limitesDeFeatures({ app, features, capasDeShared, compartidas = [] }) {
  const feature = (nombre, extra = {}) => ({ element: { type: 'feature', captured: { featureName: nombre }, ...extra } });
  const porSuIndex = { fileInternalPath: 'index.ts' };

  return {
    files: [`${app}/src/**/*.{ts,tsx}`],
    plugins: { boundaries },
    settings: {
      // Los patrones de abajo son relativos a la carpeta de la app, la lancen desde donde la lancen.
      'boundaries/root-path': `${RAIZ_DEL_REPO}${app}`,
      // Sin esto el plugin no encuentra los imports sin extensión (`./hooks/useX`).
      'import/resolver': { node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] } },
      // Por defecto solo mira `import ... from`; también se vigilan `export ... from`, `import()` y `require()`.
      'boundaries/dependency-nodes': ['import', 'export', 'dynamic-import', 'require'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'shared', pattern: 'src/shared/*', capture: ['layerName'] },
        { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // Paquetes externos, css, imágenes e index.html no son capas.
            { allow: { to: { element: { type: null } } } },
            // Dentro del propio elemento, por ruta directa.
            { allow: { dependency: { relationship: { to: 'internal' } } } },
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { type: 'feature', ...porSuIndex } } },
            },
            ...Object.entries(capasDeShared).flatMap(([capa, permitidas]) =>
              permitidas.map((otra) => ({
                from: { element: { type: 'shared', captured: { layerName: capa } } },
                allow: { to: { element: { type: 'shared', captured: { layerName: otra } } } },
              })),
            ),
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            ...Object.entries(features).flatMap(([nombre, dependencias]) =>
              [...compartidas, ...dependencias].map((otra) => ({
                from: feature(nombre),
                allow: { to: feature(otra, porSuIndex) },
              })),
            ),
          ],
        },
      ],
    },
  };
}
