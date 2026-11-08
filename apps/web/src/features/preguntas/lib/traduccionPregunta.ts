import type { FormularioPregunta } from './formularioPregunta'

/**
 * Textos de la pregunta que traduce el boton «Traducir», separados en HTML (se conservan las
 * etiquetas) y texto plano. El guion del dialogo de listening no se traduce: su audio ya esta generado.
 */
export interface TextosPregunta {
  html: string[]
  texto: string[]
}

export function textosDePregunta(f: FormularioPregunta): TextosPregunta {
  return {
    html: [f.enunciadoHtml, f.explicacionHtml, ...f.alternativas.map((a) => a.textoHtml)],
    texto: [...f.columnaIzquierda, ...f.columnaDerecha, f.rubricaEvaluacion],
  }
}

/** Pone las traducciones (en el orden de [textosDePregunta]) sobre el formulario. */
export function aplicarTraduccion(f: FormularioPregunta, { html, texto }: TextosPregunta): FormularioPregunta {
  const [enunciadoHtml, explicacionHtml, ...alternativas] = html
  const izquierda = texto.slice(0, f.columnaIzquierda.length)
  const derecha = texto.slice(f.columnaIzquierda.length, f.columnaIzquierda.length + f.columnaDerecha.length)
  return {
    ...f,
    enunciadoHtml,
    explicacionHtml,
    alternativas: f.alternativas.map((a, i) => ({ ...a, textoHtml: alternativas[i] })),
    columnaIzquierda: izquierda,
    columnaDerecha: derecha,
    rubricaEvaluacion: texto[texto.length - 1],
  }
}
