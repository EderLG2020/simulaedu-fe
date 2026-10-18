import type { AlternativaRequest, Dificultad, GuionAudio, Pregunta, PreguntaRequest, TipoPregunta } from '../../api/preguntasApi'

/** Modelo del formulario de pregunta y su conversion desde la pregunta guardada y hacia el request del backend. */

export interface AlternativaForm {
  textoHtml: string
  imagenUrl: string | null
  esCorrecta: boolean
}

export interface ParForm {
  izquierda: number
  derecha: number
}

export interface FormularioPregunta {
  temaId: string
  tipoPregunta: TipoPregunta
  dificultad: Dificultad
  enunciadoHtml: string
  tiempoSugeridoSeg: string
  universidadesObjetivoIds: string[]
  alternativas: AlternativaForm[]
  columnaIzquierda: string[]
  columnaDerecha: string[]
  paresCorrectos: ParForm[]
  limiteCaracteres: string
  rubricaEvaluacion: string
  formatoRespuesta: string
  valorCorrecto: string
  /** Listening: guion del dialogo cuyo audio se inserto en el enunciado (null si no hay). */
  guionAudio: GuionAudio | null
}

export const FORMULARIO_VACIO: FormularioPregunta = {
  temaId: '',
  tipoPregunta: 'OPCION_UNICA',
  dificultad: 'MEDIA',
  enunciadoHtml: '',
  tiempoSugeridoSeg: '',
  universidadesObjetivoIds: [],
  alternativas: [
    { textoHtml: '', imagenUrl: null, esCorrecta: true },
    { textoHtml: '', imagenUrl: null, esCorrecta: false },
  ],
  columnaIzquierda: ['', ''],
  columnaDerecha: ['', ''],
  paresCorrectos: [{ izquierda: 0, derecha: 0 }],
  limiteCaracteres: '800',
  rubricaEvaluacion: '',
  formatoRespuesta: 'entero',
  valorCorrecto: '',
  guionAudio: null,
}

export function preguntaAFormulario(pregunta: Pregunta): FormularioPregunta {
  const meta = pregunta.metadataTipo
  return {
    temaId: pregunta.temaId,
    tipoPregunta: pregunta.tipoPregunta,
    dificultad: pregunta.dificultad,
    enunciadoHtml: pregunta.enunciadoHtml,
    tiempoSugeridoSeg: pregunta.tiempoSugeridoSeg === null ? '' : String(pregunta.tiempoSugeridoSeg),
    universidadesObjetivoIds: pregunta.universidadesObjetivoIds,
    alternativas:
      pregunta.alternativas.length > 0
        ? pregunta.alternativas
            .slice()
            .sort((a, b) => a.orden - b.orden)
            .map((a) => ({ textoHtml: a.textoHtml, imagenUrl: a.imagenUrl, esCorrecta: a.esCorrecta }))
        : FORMULARIO_VACIO.alternativas,
    columnaIzquierda: (meta.columnaIzquierda as string[] | undefined) ?? FORMULARIO_VACIO.columnaIzquierda,
    columnaDerecha: (meta.columnaDerecha as string[] | undefined) ?? FORMULARIO_VACIO.columnaDerecha,
    paresCorrectos: (meta.paresCorrectos as ParForm[] | undefined) ?? FORMULARIO_VACIO.paresCorrectos,
    limiteCaracteres: meta.limiteCaracteres !== undefined ? String(meta.limiteCaracteres) : FORMULARIO_VACIO.limiteCaracteres,
    rubricaEvaluacion: (meta.rubricaEvaluacion as string | undefined) ?? '',
    formatoRespuesta: (meta.formatoRespuesta as string | undefined) ?? 'entero',
    valorCorrecto: meta.valorCorrecto !== undefined ? String(meta.valorCorrecto) : '',
    guionAudio: pregunta.guionAudio ?? null,
  }
}

export function formularioARequest(formulario: FormularioPregunta): PreguntaRequest {
  const base: PreguntaRequest = {
    temaId: formulario.temaId,
    tipoPregunta: formulario.tipoPregunta,
    dificultad: formulario.dificultad,
    enunciadoHtml: formulario.enunciadoHtml,
    tiempoSugeridoSeg: formulario.tiempoSugeridoSeg.trim() === '' ? null : Number(formulario.tiempoSugeridoSeg),
    universidadesObjetivoIds: formulario.universidadesObjetivoIds,
    guionAudio: guionVigente(formulario),
  }

  if (formulario.tipoPregunta === 'OPCION_UNICA' || formulario.tipoPregunta === 'OPCION_MULTIPLE') {
    const alternativas: AlternativaRequest[] = formulario.alternativas.map((a, i) => ({
      textoHtml: a.textoHtml,
      imagenUrl: a.imagenUrl,
      esCorrecta: a.esCorrecta,
      orden: i + 1,
    }))
    return { ...base, alternativas }
  }

  if (formulario.tipoPregunta === 'EMPAREJAMIENTO') {
    return {
      ...base,
      metadataTipo: {
        columnaIzquierda: formulario.columnaIzquierda,
        columnaDerecha: formulario.columnaDerecha,
        paresCorrectos: formulario.paresCorrectos,
      },
    }
  }

  if (formulario.tipoPregunta === 'DESARROLLO') {
    return {
      ...base,
      metadataTipo: {
        limiteCaracteres: Number(formulario.limiteCaracteres || 0),
        rubricaEvaluacion: formulario.rubricaEvaluacion,
      },
    }
  }

  // NUMERICA
  return {
    ...base,
    metadataTipo: {
      formatoRespuesta: formulario.formatoRespuesta,
      valorCorrecto: Number(formulario.valorCorrecto || 0),
    },
  }
}

/** El guion solo se guarda si su audio sigue en el enunciado (el docente pudo borrar el reproductor a mano). */
function guionVigente(formulario: FormularioPregunta): GuionAudio | null {
  const url = formulario.guionAudio?.audioUrl
  return url && formulario.enunciadoHtml.includes(url) ? formulario.guionAudio : null
}

const reproductor = (url: string) => `<p><audio controls preload="none" src="${url}"></audio></p>`

/**
 * Listening: pone el audio del dialogo en el enunciado. Si ya habia un dialogo generado
 * ([urlAnterior]), reemplaza ese reproductor en vez de agregar otro.
 */
export function insertarAudioDialogo(enunciado: string, urlAnterior: string | null | undefined, urlNueva: string): string {
  if (urlAnterior && enunciado.includes(urlAnterior)) return enunciado.split(urlAnterior).join(urlNueva)
  return enunciado.trim() === '' ? reproductor(urlNueva) : `${enunciado}
${reproductor(urlNueva)}`
}

export function envolverSeleccion(valor: string, inicio: number, fin: number, tagAbre: string, tagCierra: string): { texto: string; cursor: number } {
  const seleccion = valor.slice(inicio, fin) || 'texto'
  const nuevo = valor.slice(0, inicio) + tagAbre + seleccion + tagCierra + valor.slice(fin)
  return { texto: nuevo, cursor: inicio + tagAbre.length + seleccion.length + tagCierra.length }
}

/** Escapa `&`, `<` y `>` para que el codigo de un `<pre><code>` se muestre literal en vez de interpretarse como HTML. */
export function escaparCodigo(codigo: string): string {
  return codigo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
