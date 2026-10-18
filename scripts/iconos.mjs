// Actualiza en index.html la lista de iconos de Material Symbols que descarga la app.
//
// Google Fonts permite pedir solo algunos iconos (`icon_names`): en vez de la fuente completa
// (~1 MB, todos los iconos) se baja una de pocos KB. Este script busca en src/ los nombres
// de icono que se usan y reescribe ese parametro.
//
// Uso: npm run iconos   (correrlo al usar un icono nuevo; src/iconos.test.ts avisa si se olvida)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const LISTA_OFICIAL =
  'https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints'

const oficiales = new Set(
  (await (await fetch(LISTA_OFICIAL)).text())
    .split('\n')
    .map((linea) => linea.split(' ')[0])
    .filter(Boolean),
)

// Cualquier texto entre comillas o dentro de una etiqueta que sea un icono oficial cuenta.
const usados = new Set()
const recorrer = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name)
    if (e.isDirectory()) recorrer(ruta)
    else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) {
      for (const [, nombre] of readFileSync(ruta, 'utf8').matchAll(/['"`>]\s*([a-z][a-z0-9_]*)\s*['"`<]/g)) {
        if (oficiales.has(nombre)) usados.add(nombre)
      }
    }
  }
}
recorrer(join(RAIZ, 'src'))

const lista = [...usados].sort() // Google exige orden alfabetico
const indexHtml = join(RAIZ, 'index.html')
const html = readFileSync(indexHtml, 'utf8')
const nuevo = html.replace(/icon_names=[a-z0-9_,]*/, `icon_names=${lista.join(',')}`)
if (nuevo === html && !html.includes(`icon_names=${lista.join(',')}`)) {
  throw new Error('No se encontro el parametro icon_names en index.html')
}
writeFileSync(indexHtml, nuevo)
console.log(`${lista.length} iconos en index.html`)
