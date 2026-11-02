import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative, resolve, sep } from 'node:path';
// Desde su módulo: el index de archunit registra matchers de Vitest al importarse y exige `globals: true`.
import { extractGraph } from 'archunit/dist/src/common/extraction';

/** Código de `src/` de una app: rutas relativas a la app (`src/...`), en formato posix. */
export interface Project {
  files: Map<string, string>;
  edges: Edge[];
}

interface Edge {
  source: string;
  target: string;
}

const SUFFIXES = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];

// ArchUnitTS no registra `export … from` ni `import()`: se añaden leyendo el código.
const REEXPORTS = /export\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s*from\s*['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORTS = /(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)/g;

/** Archivo de `files` al que apunta un especificador relativo escrito en `from`, o null si no es de src/. */
export function resolveSpecifier(files: ReadonlyMap<string, string>, from: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = posix.normalize(posix.join(posix.dirname(from), specifier.split('?')[0]!));
  const suffix = SUFFIXES.find((s) => files.has(base + s));
  return suffix === undefined ? null : base + suffix;
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesIn(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts') ? [path] : [];
  });
}

const toPosix = (path: string) => path.split(sep).join('/');

/** Lee `src/` de la app y su grafo de dependencias. `tsconfig` es el que incluye `src/` (no el de referencias). */
export async function loadProject(appDir: string, tsconfig = 'tsconfig.app.json'): Promise<Project> {
  const files = new Map(
    filesIn(join(appDir, 'src')).map((path) => [toPosix(relative(appDir, path)), readFileSync(path, 'utf8')] as const),
  );

  const keys = new Set<string>();
  const edges: Edge[] = [];
  const addEdge = (source: string, target: string) => {
    const key = `${source}\n${target}`;
    if (source === target || keys.has(key) || !files.has(source) || !files.has(target)) return;
    keys.add(key);
    edges.push({ source, target });
  };

  // ArchUnitTS da las rutas relativas al directorio de trabajo.
  const fromApp = (path: string) => toPosix(relative(appDir, resolve(process.cwd(), path)));
  for (const edge of await extractGraph(join(appDir, tsconfig))) {
    if (!edge.external) addEdge(fromApp(edge.source), fromApp(edge.target));
  }

  for (const [path, content] of files) {
    for (const pattern of [REEXPORTS, DYNAMIC_IMPORTS]) {
      for (const [, specifier] of content.matchAll(pattern)) {
        const target = resolveSpecifier(files, path, specifier!);
        if (target) addEdge(path, target);
      }
    }
  }

  return { files, edges };
}
