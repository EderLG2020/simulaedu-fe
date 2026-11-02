// Configuración de ESLint de todo el monorepo (flat config). Cada workspace corre `eslint .` y ESLint encuentra este
// archivo subiendo desde cada archivo revisado.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import { limitesDeFeatures } from './eslint/limites.mjs';
import matrices from './packages/architecture/src/matrices.json' with { type: 'json' };

export default defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  // Límites entre capas y features. La matriz es la misma que usa la prueba de arquitectura de la app.
  limitesDeFeatures({
    app: 'apps/web',
    features: matrices.web.features,
    capasDeShared: matrices.web.sharedLayers,
    compartidas: matrices.web.sharedFeatures,
  }),
]);
