import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { claves } from '../../api/claves'
import { mensajeDeError } from '../../api/client'
import { obtenerRevision, type PreguntaRevision, type ResultadoPregunta } from '../../api/simulacrosApi'
import { Alert, Icon, SegmentedControl } from '../../components/ui'
import { htmlSeguro, textoPlanoDe } from '../../lib/html'
import { CLASE_HTML_ENRIQUECIDO } from './estilosSimulacro'

type Filtro = 'TODAS' | 'INCORRECTAS' | 'EN_BLANCO' | 'CORRECTAS'

const RESULTADO: Record<ResultadoPregunta, { etiqueta: string; icono: string; clase: string }> = {
  CORRECTA: { etiqueta: 'Correcta', icono: 'check_circle', clase: 'bg-emerald-50 text-emerald-700' },
  INCORRECTA: { etiqueta: 'Incorrecta', icono: 'cancel', clase: 'bg-rose-50 text-rose-700' },
  EN_BLANCO: { etiqueta: 'En blanco', icono: 'help', clase: 'bg-slate-100 text-slate-600' },
  PENDIENTE_REVISION: { etiqueta: 'Por calificar', icono: 'hourglass_top', clase: 'bg-amber-50 text-amber-700' },
}

function cumpleFiltro(pregunta: PreguntaRevision, filtro: Filtro): boolean {
  if (filtro === 'INCORRECTAS') return pregunta.resultado === 'INCORRECTA'
  if (filtro === 'EN_BLANCO') return pregunta.resultado === 'EN_BLANCO'
  if (filtro === 'CORRECTAS') return pregunta.resultado === 'CORRECTA'
  return true
}

/** Linea "Tu respuesta / Respuesta correcta" para numerica y desarrollo. */
function Dato({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono: 'neutro' | 'bien' }) {
  return (
    <p className="text-sm">
      <span className="font-semibold text-slate-700">{etiqueta}: </span>
      <span className={tono === 'bien' ? 'font-semibold text-emerald-700' : 'text-slate-900'}>{valor}</span>
    </p>
  )
}

function RespuestaRevisada({ pregunta }: { pregunta: PreguntaRevision }) {
  const { respuestaDada: dada, metadataTipo: meta } = pregunta

  if (pregunta.tipoPregunta === 'OPCION_UNICA' || pregunta.tipoPregunta === 'OPCION_MULTIPLE') {
    const elegidas = new Set<string>(
      pregunta.tipoPregunta === 'OPCION_UNICA' ? [dada.alternativaId as string].filter(Boolean) : ((dada.alternativaIds as string[] | undefined) ?? []),
    )
    return (
      <ul className="flex flex-col gap-2">
        {pregunta.alternativas
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((alt, i) => {
            const elegida = elegidas.has(alt.id)
            const clase = alt.esCorrecta
              ? 'border-emerald-300 bg-emerald-50'
              : elegida
                ? 'border-rose-300 bg-rose-50'
                : 'border-slate-200 bg-white'
            return (
              <li key={alt.id} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${clase}`}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white font-bold text-slate-700 ring-1 ring-slate-200">
                  {String.fromCharCode(65 + i)}
                </span>
                <div className="min-w-0 flex-1">
                  <span className={CLASE_HTML_ENRIQUECIDO} dangerouslySetInnerHTML={{ __html: htmlSeguro(alt.textoHtml) }} />
                  {alt.imagenUrl && <img src={alt.imagenUrl} alt="" className="mt-2 max-h-40 rounded-lg" />}
                </div>
                <span className="flex shrink-0 flex-col items-end gap-1 text-[11px] font-bold">
                  {alt.esCorrecta && <span className="text-emerald-700">Respuesta correcta</span>}
                  {elegida && <span className={alt.esCorrecta ? 'text-emerald-700' : 'text-rose-700'}>Tu respuesta</span>}
                </span>
              </li>
            )
          })}
      </ul>
    )
  }

  if (pregunta.tipoPregunta === 'NUMERICA') {
    const tolerancia = meta.toleranciaError as number | undefined
    return (
      <div className="flex flex-col gap-1">
        <Dato etiqueta="Tu respuesta" valor={dada.valor === null || dada.valor === undefined ? 'En blanco' : String(dada.valor)} tono="neutro" />
        <Dato etiqueta="Respuesta correcta" valor={`${String(meta.valorCorrecto)}${tolerancia ? ` (± ${tolerancia})` : ''}`} tono="bien" />
      </div>
    )
  }

  if (pregunta.tipoPregunta === 'EMPAREJAMIENTO') {
    const izquierda = (meta.columnaIzquierda as string[] | undefined) ?? []
    const derecha = (meta.columnaDerecha as string[] | undefined) ?? []
    const correctos = (meta.paresCorrectos as { izquierda: number; derecha: number }[] | undefined) ?? []
    const dados = (dada.pares as { izquierda: number; derecha: number }[] | undefined) ?? []
    return (
      <ul className="flex flex-col gap-2 text-sm">
        {izquierda.map((texto, i) => {
          const correcta = correctos.find((p) => p.izquierda === i)?.derecha
          const elegida = dados.find((p) => p.izquierda === i)?.derecha
          const bien = elegida !== undefined && elegida === correcta
          return (
            <li key={i} className={`rounded-xl border p-3 ${bien ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              <p className="font-semibold text-slate-900">{texto}</p>
              <p className={bien ? 'text-emerald-700' : 'text-rose-700'}>Tu respuesta: {elegida === undefined ? 'En blanco' : derecha[elegida]}</p>
              {!bien && correcta !== undefined && <p className="font-semibold text-emerald-700">Respuesta correcta: {derecha[correcta]}</p>}
            </li>
          )
        })}
      </ul>
    )
  }

  // DESARROLLO: no hay una unica respuesta correcta; la califica el docente.
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="font-semibold text-slate-700">Tu respuesta:</p>
      <p className="rounded-xl border border-slate-200 bg-white p-3 whitespace-pre-wrap text-slate-900">{(dada.texto as string | undefined) ?? 'En blanco'}</p>
      {pregunta.resultado === 'PENDIENTE_REVISION' && <p className="text-amber-700">Tu docente todavía no la calificó.</p>}
    </div>
  )
}

function TarjetaPregunta({ pregunta, explicacionesDisponibles }: { pregunta: PreguntaRevision; explicacionesDisponibles: boolean }) {
  const resultado = RESULTADO[pregunta.resultado]
  return (
    <li>
      <details className="group rounded-xl border border-slate-200 bg-white open:shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-3 sm:p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 font-display text-sm font-bold text-primary-600">
            {pregunta.numero}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{textoPlanoDe(pregunta.enunciadoHtml, 120) || 'Pregunta con imagen o audio'}</p>
            <p className="text-[11px] text-slate-500">{pregunta.temaNombre}</p>
          </div>
          <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${resultado.clase}`}>
            <Icon name={resultado.icono} size={14} />
            {resultado.etiqueta}
          </span>
          <Icon name="expand_more" size={20} className="shrink-0 text-slate-400 transition group-open:rotate-180" />
        </summary>

        <div className="flex flex-col gap-4 border-t border-slate-100 p-3 sm:p-4">
          <div className={`text-[15px] leading-7 text-slate-900 ${CLASE_HTML_ENRIQUECIDO}`} dangerouslySetInnerHTML={{ __html: htmlSeguro(pregunta.enunciadoHtml) }} />
          <RespuestaRevisada pregunta={pregunta} />

          {pregunta.explicacionHtml ? (
            <div className="rounded-xl bg-primary-50/70 p-3 sm:p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-primary-700">
                <Icon name="lightbulb" size={16} />
                Explicación
              </p>
              <div className={`text-sm leading-6 text-slate-900 ${CLASE_HTML_ENRIQUECIDO}`} dangerouslySetInnerHTML={{ __html: htmlSeguro(pregunta.explicacionHtml) }} />
            </div>
          ) : (
            !explicacionesDisponibles &&
            pregunta.resultado !== 'CORRECTA' && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Icon name="lock" size={16} />
                La explicación de cada respuesta está disponible con el plan Premium.
              </p>
            )
          )}
        </div>
      </details>
    </li>
  )
}

/** CU-05: revision pregunta por pregunta del simulacro terminado (que marco, cual era la correcta y por que). */
export default function RevisionRespuestas({ simulacroId }: { simulacroId: string }) {
  const { data: revision, error, isPending } = useQuery({
    queryKey: claves.revisionSimulacro(simulacroId),
    queryFn: () => obtenerRevision(simulacroId),
  })
  const [filtroElegido, setFiltroElegido] = useState<Filtro | null>(null)

  if (isPending) return <p className="text-sm text-slate-500">Cargando la revisión de tus respuestas...</p>
  if (error || !revision) return <Alert>{mensajeDeError(error, 'No se pudo cargar la revisión de tus respuestas.')}</Alert>

  const contar = (r: ResultadoPregunta) => revision.preguntas.filter((p) => p.resultado === r).length
  const incorrectas = contar('INCORRECTA')
  // Por defecto se abre en las que fallo, que es lo que el alumno quiere repasar.
  const filtro: Filtro = filtroElegido ?? (incorrectas > 0 ? 'INCORRECTAS' : 'TODAS')
  const visibles = revision.preguntas.filter((p) => cumpleFiltro(p, filtro))

  return (
    <section aria-label="Revisa tus respuestas" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">Revisa tus respuestas</h2>
          <p className="text-xs text-slate-500 sm:text-sm">Abre cada pregunta para ver qué marcaste, cuál era la respuesta correcta y por qué.</p>
        </div>
        <SegmentedControl
          ariaLabel="Filtrar preguntas"
          value={filtro}
          onChange={setFiltroElegido}
          options={[
            { value: 'INCORRECTAS', label: `Incorrectas (${incorrectas})` },
            { value: 'EN_BLANCO', label: `En blanco (${contar('EN_BLANCO')})` },
            { value: 'CORRECTAS', label: `Correctas (${contar('CORRECTA')})` },
            { value: 'TODAS', label: `Todas (${revision.preguntas.length})` },
          ]}
        />
      </div>

      {!revision.explicacionesDisponibles && (
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-accent-50 p-3 text-xs text-accent-800 sm:text-sm">
          <Icon name="workspace_premium" size={18} className="shrink-0" />
          Con el plan Premium verás además la explicación de cada respuesta.
        </p>
      )}

      {visibles.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">No hay preguntas en este grupo.</p>
      ) : (
        <ol className="flex list-none flex-col gap-2">
          {visibles.map((p) => (
            <TarjetaPregunta key={p.respuestaSimulacroId} pregunta={p} explicacionesDisponibles={revision.explicacionesDisponibles} />
          ))}
        </ol>
      )}
    </section>
  )
}
