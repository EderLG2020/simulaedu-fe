import { posix } from 'node:path';
import { type Project, resolveSpecifier } from './project';

/** Features de una app, de qué otras features puede depender cada una y el orden de las capas de shared/. */
export interface Matrix {
  /** Features que todas las demás pueden consumir. */
  sharedFeatures: string[];
  features: Record<string, string[]>;
  /** Carpeta de shared/ → otras carpetas de shared/ de las que puede importar (además de sí misma). */
  sharedLayers: Record<string, string[]>;
}

type Layer =
  | { kind: 'app' }
  | { kind: 'shared'; name: string }
  | { kind: 'feature'; name: string }
  | { kind: 'other' };

function layerOf(path: string): Layer {
  if (path.startsWith('src/app/')) return { kind: 'app' };
  const shared = /^src\/shared\/([^/]+)\//.exec(path);
  if (shared) return { kind: 'shared', name: shared[1]! };
  if (path.startsWith('src/shared/')) return { kind: 'shared', name: '' };
  const feature = /^src\/features\/([^/]+)\//.exec(path);
  return feature ? { kind: 'feature', name: feature[1]! } : { kind: 'other' };
}

/** Pruebas y su material de apoyo: no cuentan como código de producción. */
function isTest(path: string): boolean {
  return /\.(test|spec)\.(ts|tsx)$/.test(path) || /\/(__tests__|__mocks__|testing)\//.test(path) || path.startsWith('src/shared/test/');
}

const isIndex = (path: string, feature: string) => /^index\.tsx?$/.test(path.slice(`src/features/${feature}/`.length));
const withoutSrc = (path: string) => path.replace(/^src\//, '');
const ownerOf = (layer: Layer) => (layer.kind === 'feature' ? layer.name : layer.kind === 'app' ? 'app' : null);

/** Límites entre capas, la matriz de features y el orden de las capas de shared/. Aplica también a pruebas. */
function boundaries({ edges }: Project, matrix: Matrix): string[] {
  const violations: string[] = [];
  for (const { source, target } of edges) {
    const from = layerOf(source);
    const to = layerOf(target);
    const arrow = `${withoutSrc(source)} → ${withoutSrc(target)}`;

    if (from.kind === 'other') violations.push(`fuera-de-capas: ${withoutSrc(source)}`);
    if (from.kind === 'shared' && (to.kind === 'feature' || to.kind === 'app')) {
      violations.push(`shared-importa-de-${to.kind}: ${arrow}`);
      continue;
    }
    if (from.kind === 'shared' && to.kind === 'shared' && from.name !== to.name) {
      const allowed = matrix.sharedLayers[from.name];
      if (!allowed) violations.push(`capa-de-shared-sin-declarar (${from.name}): ${arrow}`);
      else if (!allowed.includes(to.name)) violations.push(`capa-de-shared (${from.name} → ${to.name}): ${arrow}`);
      continue;
    }
    if (from.kind === 'feature' && to.kind === 'app') violations.push(`feature-importa-de-app: ${arrow}`);
    if (to.kind !== 'feature' || (from.kind === 'feature' && from.name === to.name)) continue;

    if (!isIndex(target, to.name)) violations.push(`ruta-interna-de-feature: ${arrow}`);
    if (from.kind === 'feature') {
      const allowed = [...matrix.sharedFeatures, ...(matrix.features[from.name] ?? [])];
      if (!allowed.includes(to.name)) violations.push(`fuera-de-matriz (${from.name} → ${to.name}): ${arrow}`);
    }
  }
  return violations;
}

/** Features que existen en el código pero no en la matriz (y al revés). */
function undeclaredFeatures({ files }: Project, matrix: Matrix): string[] {
  const inCode = new Set([...files.keys()].map(layerOf).flatMap((l) => (l.kind === 'feature' ? [l.name] : [])));
  return [
    ...[...inCode].filter((f) => !(f in matrix.features)).map((f) => `feature-sin-declarar: ${f}`),
    ...Object.keys(matrix.features).filter((f) => !inCode.has(f)).map((f) => `feature-declarada-sin-codigo: ${f}`),
  ];
}

/** Ciclos entre features en el código de producción (componentes fuertemente conexos de más de una feature). */
function cycles({ edges }: Project): string[] {
  const neighbors = new Map<string, Set<string>>();
  for (const { source, target } of edges) {
    const from = layerOf(source);
    const to = layerOf(target);
    if (isTest(source) || from.kind !== 'feature' || to.kind !== 'feature' || from.name === to.name) continue;
    if (!neighbors.has(from.name)) neighbors.set(from.name, new Set());
    neighbors.get(from.name)!.add(to.name);
  }

  const reachableFrom = (start: string) => {
    const seen = new Set<string>();
    const pending = [start];
    while (pending.length > 0) {
      for (const next of neighbors.get(pending.pop()!) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          pending.push(next);
        }
      }
    }
    return seen;
  };

  const groups = new Set<string>();
  for (const feature of neighbors.keys()) {
    const reachable = reachableFrom(feature);
    if (!reachable.has(feature)) continue;
    groups.add([...reachable].filter((other) => reachableFrom(other).has(feature)).sort().join(' ↔ '));
  }
  return [...groups].map((group) => `ciclo-entre-features: ${group}`);
}

/** Código de producción que usa archivos `mock*` o `demo*`. */
function mocksInProduction({ edges }: Project): string[] {
  return edges
    .filter(({ source, target }) => !isTest(source) && /^(mock|demo)[A-Z]/.test(posix.basename(target)))
    .map(({ source, target }) => `mock-en-produccion: ${withoutSrc(source)} → ${withoutSrc(target)}`);
}

/**
 * Módulos de shared/ que el código de producción usa desde menos de dos dueños (features o app/).
 * Un módulo con un solo dueño pertenece a ese dueño, no a shared/.
 */
function sharedWithSingleOwner({ files, edges }: Project): string[] {
  const consumers = new Map<string, string[]>();
  for (const { source, target } of edges) {
    if (isTest(source)) continue;
    consumers.set(target, [...(consumers.get(target) ?? []), source]);
  }

  const ownersOf = (module: string, visiting = new Set<string>()): Set<string> => {
    const owners = new Set<string>();
    visiting.add(module);
    for (const consumer of consumers.get(module) ?? []) {
      const layer = layerOf(consumer);
      const owner = ownerOf(layer);
      if (owner) owners.add(owner);
      else if (layer.kind === 'shared' && !visiting.has(consumer)) ownersOf(consumer, visiting).forEach((o) => owners.add(o));
    }
    return owners;
  };

  return [...files.keys()]
    .filter((path) => layerOf(path).kind === 'shared' && !isTest(path))
    .filter((path) => ownersOf(path).size < 2)
    .map((path) => `shared-con-un-solo-dueno [${[...ownersOf(path)].sort().join(', ') || 'ninguno'}]: ${withoutSrc(path)}`);
}

const ONLY_REEXPORTS = /^(\s*export\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s*from\s*['"][^'"]+['"];?)+\s*$/;

/** Archivos de una feature que solo reexportan algo de shared/: el módulo vive en shared/ pero tiene dueño. */
function sharedReexports({ files, edges }: Project): string[] {
  const withoutComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...files]
    .filter(([path]) => layerOf(path).kind === 'feature' && !isTest(path) && !/\/index\.tsx?$/.test(path))
    .filter(([path, code]) => {
      if (!ONLY_REEXPORTS.test(withoutComments(code))) return false;
      return edges.some(({ source, target }) => source === path && layerOf(target).kind === 'shared');
    })
    .map(([path]) => `reexporte-de-shared: ${withoutSrc(path)}`);
}

const MOCKS = /(?:vi|jest)\.(?:mock|doMock)\(\s*['"](\.[^'"]+)['"]/g;

/** Pruebas que mockean una ruta interna de otra feature en vez de su index.ts. */
function internalPathMocks({ files }: Project): string[] {
  const violations = new Set<string>();
  for (const [path, code] of files) {
    if (!isTest(path)) continue;
    const from = layerOf(path);
    for (const [, specifier] of code.matchAll(MOCKS)) {
      const target = resolveSpecifier(files, path, specifier!);
      const to = target ? layerOf(target) : null;
      if (!target || to?.kind !== 'feature' || (from.kind === 'feature' && from.name === to.name)) continue;
      if (!isIndex(target, to.name)) violations.add(`mock-de-ruta-interna: ${withoutSrc(path)} → ${withoutSrc(target)}`);
    }
  }
  return [...violations];
}

/** Subcarpetas permitidas en la raíz de una feature; dentro de ellas se puede anidar. */
const CARPETAS_DE_FEATURE = ['pages', 'components', 'hooks', 'api', 'lib'];

const dentroDeFeature = (path: string) => /^src\/features\/[^/]+\/(.+)$/.exec(path)?.[1] ?? null;
const sinTest = (nombre: string) => nombre.replace(/\.(test|spec)(\.tsx?)$/, '$2');

/** En la raíz de una feature solo va `index.ts`; el resto, en pages/, components/, hooks/, api/ o lib/. */
function estructuraDeFeature({ files }: Project): string[] {
  return [...files.keys()]
    .filter((path) => {
      const resto = dentroDeFeature(path);
      if (resto === null || /^index\.tsx?$/.test(resto)) return false;
      const [carpeta] = resto.split('/');
      return !resto.includes('/') || !CARPETAS_DE_FEATURE.includes(carpeta!);
    })
    .map((path) => `estructura-de-feature: ${withoutSrc(path)}`);
}

/** Las páginas de una feature se llaman `*Page.tsx` y viven en pages/ (y en pages/ solo hay páginas). */
function nombreDePagina({ files }: Project): string[] {
  return [...files.keys()]
    .filter((path) => {
      const resto = dentroDeFeature(path);
      if (resto === null) return false;
      const esPagina = /Page\.tsx$/.test(sinTest(posix.basename(path)));
      return resto.startsWith('pages/') ? !esPagina : esPagina;
    })
    .map((path) => `nombre-de-pagina: ${withoutSrc(path)}`);
}

/** Los archivos de una carpeta hooks/ (de una feature o de shared/) se llaman `use*`. */
function nombreDeHook({ files }: Project): string[] {
  return [...files.keys()]
    .filter((path) => /^src\/(shared|features\/[^/]+)\/hooks\//.test(path))
    .filter((path) => !/^use[A-Z]/.test(sinTest(posix.basename(path))))
    .map((path) => `nombre-de-hook: ${withoutSrc(path)}`);
}

const enCarpetaApi = (path: string) => /^src\/(shared|features\/[^/]+)\/api\//.test(path);

/** Los clientes `*Api.ts` viven en shared/api/ o en features/<x>/api/. */
function clienteApiFueraDeApi({ files }: Project): string[] {
  return [...files.keys()]
    .filter((path) => /Api\.tsx?$/.test(sinTest(posix.basename(path))) && !enCarpetaApi(path))
    .map((path) => `cliente-api-fuera-de-api: ${withoutSrc(path)}`);
}

const LLAMADA_DE_RED = /(?<![\w.])(fetch|apiFetch|apiFetchPagina|apiFetchArchivo|todasLasPaginas|fetchMonitoreado)\s*(<[^>()]*>)?\s*\(/;

/** Solo los clientes de API (shared/api/ y features/<x>/api/) hacen peticiones de red. */
function fetchFueraDeApi({ files }: Project): string[] {
  const sinComentarios = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return [...files]
    .filter(([path]) => path.startsWith('src/') && !isTest(path) && !enCarpetaApi(path))
    .filter(([, code]) => LLAMADA_DE_RED.test(sinComentarios(code)))
    .map(([path]) => `fetch-fuera-de-api: ${withoutSrc(path)}`);
}

/** Todas las violaciones de arquitectura de una app, ordenadas y sin repetir. */
export function evaluate(project: Project, matrix: Matrix): string[] {
  return [
    ...new Set([
      ...boundaries(project, matrix),
      ...undeclaredFeatures(project, matrix),
      ...cycles(project),
      ...mocksInProduction(project),
      ...sharedWithSingleOwner(project),
      ...sharedReexports(project),
      ...internalPathMocks(project),
      ...estructuraDeFeature(project),
      ...nombreDePagina(project),
      ...nombreDeHook(project),
      ...clienteApiFueraDeApi(project),
      ...fetchFueraDeApi(project),
    ]),
  ].sort();
}
