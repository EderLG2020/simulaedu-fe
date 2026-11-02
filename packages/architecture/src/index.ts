import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matrices from './matrices.json';
import { loadProject } from './project';
import { evaluate, type Matrix } from './rules';

export type App = keyof typeof matrices;

export const matrixOf = (app: App): Matrix => matrices[app];

/** Violaciones que ya existían cuando entró la regla: deuda que solo puede bajar. */
const BASELINE = 'src/app/architecture.baseline.txt';

const HEADER = `# Violaciones de arquitectura que ya existían. La prueba falla si aparece una nueva o si una de estas se corrige
# y sigue aquí. Para regenerar el archivo tras corregir: UPDATE_BASELINE=1 pnpm test src/app/architecture.test.ts
`;

function readBaseline(path: string): string[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

/** Compara las violaciones actuales de la app con las conocidas. */
export async function checkArchitecture({ app, appDir }: { app: App; appDir: string }) {
  const current = evaluate(await loadProject(appDir), matrixOf(app));
  const baselinePath = join(appDir, BASELINE);

  if (process.env.UPDATE_BASELINE === '1') {
    writeFileSync(baselinePath, HEADER + current.map((v) => `${v}\n`).join(''));
  }

  const known = new Set(readBaseline(baselinePath));
  return {
    added: current.filter((v) => !known.has(v)),
    fixed: [...known].filter((v) => !current.includes(v)),
  };
}
