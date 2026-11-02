import { describe, expect, it } from 'vitest';
import type { Project } from './project';
import { evaluate, type Matrix } from './rules';

const MATRIX: Matrix = {
  sharedFeatures: ['sesion'],
  features: { sesion: [], catalogo: [], ofertas: ['catalogo'], pedidos: ['ofertas'] },
  sharedLayers: { lib: [], api: ['lib'], components: ['lib'] },
};

/** Proyecto con estos archivos (contenido opcional) y estas dependencias `[source, target]`. */
function project(edges: [string, string][], contents: Record<string, string> = {}): Project {
  const files = new Map<string, string>();
  for (const [source, target] of edges) {
    files.set(source, contents[source] ?? '');
    files.set(target, contents[target] ?? '');
  }
  for (const [path, content] of Object.entries(contents)) files.set(path, content);
  return { files, edges: edges.map(([source, target]) => ({ source, target })) };
}

/** Reglas que se prueban aparte: los ejemplos de arriba usan archivos sueltos en la raíz de las features. */
const APARTE = [
  'shared-con-un-solo-dueno',
  'feature-declarada-sin-codigo',
  'estructura-de-feature',
  'nombre-de-pagina',
  'nombre-de-hook',
  'cliente-api-fuera-de-api',
  'fetch-fuera-de-api',
];

/** Violaciones, sin las reglas que se prueban aparte. */
const violations = (edges: [string, string][], contents?: Record<string, string>) =>
  evaluate(project(edges, contents), MATRIX).filter((v) => !APARTE.some((regla) => v.startsWith(regla)));

/** Violaciones de una sola regla para un proyecto con estos archivos y su contenido. */
const deLaRegla = (regla: string, contents: Record<string, string>) =>
  evaluate(project([], contents), MATRIX).filter((v) => v.startsWith(regla));

describe('reglas de arquitectura', () => {
  describe('límites entre capas', () => {
    it('shared/ no importa de features ni de app/', () => {
      expect(violations([['src/shared/lib/x.ts', 'src/features/catalogo/index.ts']])).toEqual([
        'shared-importa-de-feature: shared/lib/x.ts → features/catalogo/index.ts',
      ]);
      expect(violations([['src/shared/lib/x.ts', 'src/app/router.tsx']])).toEqual([
        'shared-importa-de-app: shared/lib/x.ts → app/router.tsx',
      ]);
    });

    it('una feature no importa de app/', () => {
      expect(violations([['src/features/catalogo/x.ts', 'src/app/routes/R.tsx']])).toEqual([
        'feature-importa-de-app: features/catalogo/x.ts → app/routes/R.tsx',
      ]);
    });

    it('a una feature solo se entra por su index.ts', () => {
      expect(violations([['src/app/router.tsx', 'src/features/catalogo/Productos.tsx']])).toEqual([
        'ruta-interna-de-feature: app/router.tsx → features/catalogo/Productos.tsx',
      ]);
      expect(violations([['src/app/router.tsx', 'src/features/catalogo/index.ts']])).toEqual([]);
    });

    it('dentro de la propia feature se importa por ruta directa', () => {
      expect(violations([['src/features/catalogo/P.tsx', 'src/features/catalogo/store.ts']])).toEqual([]);
    });

    it('un archivo fuera de app/, shared/ y features/ es una violación', () => {
      expect(violations([['src/suelto.ts', 'src/shared/lib/x.ts']])).toEqual(['fuera-de-capas: suelto.ts']);
    });
  });

  describe('capas de shared/', () => {
    it('permite las de la matriz y la propia carpeta', () => {
      expect(violations([
        ['src/shared/api/a.ts', 'src/shared/lib/x.ts'],
        ['src/shared/api/a.ts', 'src/shared/api/b.ts'],
      ])).toEqual([]);
    });

    it('bloquea la inversa de una permitida', () => {
      expect(violations([['src/shared/lib/x.ts', 'src/shared/api/a.ts']])).toEqual([
        'capa-de-shared (lib → api): shared/lib/x.ts → shared/api/a.ts',
      ]);
    });

    it('una carpeta de shared/ sin declarar no puede importar de otra', () => {
      expect(violations([['src/shared/nueva/x.ts', 'src/shared/lib/a.ts']])).toEqual([
        'capa-de-shared-sin-declarar (nueva): shared/nueva/x.ts → shared/lib/a.ts',
      ]);
    });
  });

  describe('matriz de features', () => {
    it('permite las dependencias de la matriz y las compartidas', () => {
      expect(violations([
        ['src/features/ofertas/x.ts', 'src/features/catalogo/index.ts'],
        ['src/features/pedidos/x.ts', 'src/features/sesion/index.ts'],
      ])).toEqual([]);
    });

    it('bloquea las que no están, incluida la inversa de una permitida', () => {
      expect(violations([['src/features/catalogo/x.ts', 'src/features/ofertas/index.ts']])).toEqual([
        'fuera-de-matriz (catalogo → ofertas): features/catalogo/x.ts → features/ofertas/index.ts',
      ]);
    });

    it('una feature que no está en la matriz se reporta', () => {
      expect(violations([['src/features/nueva/x.ts', 'src/shared/lib/a.ts']])).toEqual(['feature-sin-declarar: nueva']);
    });

    it('una feature declarada sin código se reporta', () => {
      expect(evaluate(project([]), MATRIX)).toContain('feature-declarada-sin-codigo: pedidos');
    });
  });

  it('detecta ciclos entre features en código de producción', () => {
    const m: Matrix = { ...MATRIX, features: { ...MATRIX.features, catalogo: ['ofertas'] } };
    expect(evaluate(project([
      ['src/features/catalogo/x.ts', 'src/features/ofertas/index.ts'],
      ['src/features/ofertas/y.ts', 'src/features/catalogo/index.ts'],
    ]), m)).toContain('ciclo-entre-features: catalogo ↔ ofertas');
  });

  it('detecta mocks en producción, pero no en pruebas', () => {
    expect(violations([['src/features/catalogo/x.ts', 'src/features/catalogo/mockProductos.ts']])).toEqual([
      'mock-en-produccion: features/catalogo/x.ts → features/catalogo/mockProductos.ts',
    ]);
    expect(violations([['src/features/catalogo/x.test.ts', 'src/features/catalogo/mockProductos.ts']])).toEqual([]);
  });

  it('un módulo de shared/ con un solo dueño pertenece a ese dueño', () => {
    expect(evaluate(project([['src/features/catalogo/x.ts', 'src/shared/lib/a.ts']]), MATRIX)).toContain(
      'shared-con-un-solo-dueno [catalogo]: shared/lib/a.ts',
    );
    expect(evaluate(project([
      ['src/features/catalogo/x.ts', 'src/shared/lib/a.ts'],
      ['src/app/router.tsx', 'src/shared/lib/a.ts'],
    ]), MATRIX).filter((v) => v.includes('shared/lib/a.ts'))).toEqual([]);
  });

  it('un archivo de una feature que solo reexporta shared/', () => {
    expect(violations(
      [['src/features/catalogo/fecha.ts', 'src/shared/lib/fecha.ts']],
      { 'src/features/catalogo/fecha.ts': "export { formatear } from '../../shared/lib/fecha';" },
    )).toEqual(['reexporte-de-shared: features/catalogo/fecha.ts']);
  });

  it('una prueba que mockea una ruta interna de otra feature', () => {
    expect(violations([], {
      'src/app/App.test.tsx': "vi.mock('../features/catalogo/Productos', () => ({}))",
      'src/features/catalogo/Productos.tsx': '',
    })).toEqual(['mock-de-ruta-interna: app/App.test.tsx → features/catalogo/Productos.tsx']);
  });

  describe('convenciones por archivo', () => {
    it('en la raíz de una feature solo va index.ts; el resto en sus subcarpetas', () => {
      expect(deLaRegla('estructura-de-feature', {
        'src/features/catalogo/index.ts': '',
        'src/features/catalogo/pages/ProductosPage.tsx': '',
        'src/features/catalogo/components/secciones/Hero.tsx': '',
        'src/features/catalogo/lib/formato.ts': '',
      })).toEqual([]);
      expect(deLaRegla('estructura-de-feature', {
        'src/features/catalogo/suelto.ts': '',
        'src/features/catalogo/utils/x.ts': '',
      })).toEqual(['estructura-de-feature: features/catalogo/suelto.ts', 'estructura-de-feature: features/catalogo/utils/x.ts']);
    });

    it('las páginas se llaman *Page.tsx y viven en pages/', () => {
      expect(deLaRegla('nombre-de-pagina', {
        'src/features/catalogo/pages/ProductosPage.tsx': '',
        'src/features/catalogo/pages/ProductosPage.test.tsx': '',
      })).toEqual([]);
      expect(deLaRegla('nombre-de-pagina', {
        'src/features/catalogo/pages/Tabla.tsx': '',
        'src/features/catalogo/components/OtraPage.tsx': '',
      })).toEqual(['nombre-de-pagina: features/catalogo/components/OtraPage.tsx', 'nombre-de-pagina: features/catalogo/pages/Tabla.tsx']);
    });

    it('los archivos de hooks/ empiezan por use', () => {
      expect(deLaRegla('nombre-de-hook', {
        'src/features/catalogo/hooks/useProductos.ts': '',
        'src/shared/hooks/useAuth.test.ts': '',
      })).toEqual([]);
      expect(deLaRegla('nombre-de-hook', {
        'src/features/catalogo/hooks/productos.ts': '',
        'src/shared/hooks/contexto.ts': '',
      })).toEqual(['nombre-de-hook: features/catalogo/hooks/productos.ts', 'nombre-de-hook: shared/hooks/contexto.ts']);
    });

    it('los clientes *Api.ts viven en shared/api/ o features/<x>/api/', () => {
      expect(deLaRegla('cliente-api-fuera-de-api', {
        'src/shared/api/authApi.ts': '',
        'src/features/catalogo/api/productosApi.ts': '',
      })).toEqual([]);
      expect(deLaRegla('cliente-api-fuera-de-api', {
        'src/features/catalogo/lib/productosApi.ts': '',
        'src/shared/lib/otroApi.ts': '',
      })).toEqual(['cliente-api-fuera-de-api: features/catalogo/lib/productosApi.ts', 'cliente-api-fuera-de-api: shared/lib/otroApi.ts']);
    });

    it('solo los clientes de API hacen peticiones de red', () => {
      expect(deLaRegla('fetch-fuera-de-api', {
        'src/shared/api/client.ts': 'await fetch(url)',
        'src/features/catalogo/api/productosApi.ts': "apiFetch<Producto[]>('/productos')",
        'src/features/catalogo/pages/P.test.tsx': 'await fetch(url)',
        'src/features/catalogo/lib/x.ts': '// antes se usaba fetch(url)\nconst prefetch = (a: number) => a\nprefetch(1)',
      })).toEqual([]);
      expect(deLaRegla('fetch-fuera-de-api', {
        'src/shared/stores/conexion.ts': 'const r = await fetch(url)',
        'src/features/catalogo/hooks/useProductos.ts': "apiFetch<Producto[]>('/productos')",
      })).toEqual(['fetch-fuera-de-api: features/catalogo/hooks/useProductos.ts', 'fetch-fuera-de-api: shared/stores/conexion.ts']);
    });
  });
});
