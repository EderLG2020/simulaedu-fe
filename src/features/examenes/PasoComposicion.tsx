import { Alert, Button, cn, Input } from '../../components/ui'
import BuscadorPreguntas from './BuscadorPreguntas'
import { EtiquetaDificultad, ResumenPuntaje, SeccionCard } from './ComponentesEditor'
import ComposicionAreas from './ComposicionAreas'
import { moverElemento } from './composicion'
import type { EditorExamen } from './useEditorExamen'

/** Paso 2: banco o areas a la izquierda y, fijo a la derecha, el resumen de puntaje y las preguntas elegidas. */
export default function PasoComposicion({ editor }: { editor: EditorExamen }) {
  const {
    esFija,
    tieneDesarrollo,
    preguntasElegidas,
    infoPreguntas,
    cambiarPreguntas,
    puntajeAsignado,
    puntajeTotal,
    cantidadItems,
    repartirPuntaje,
    handleGuardarComposicion,
    guardando,
    composicionSucia,
    irAPaso,
  } = editor

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* Por areas no se sabe de antemano que tocara: el aviso va siempre. En fijo, solo si eligio alguna. */}
      {(!esFija || tieneDesarrollo) && (
        <Alert tone="info" className="lg:col-span-12">
          Las preguntas de desarrollo las calificas tú, así que solo se toman cuando <strong>asignas este examen a un grupo</strong>. Si
          un alumno lo rinde por su cuenta, esas preguntas se omiten.
        </Alert>
      )}
      {esFija ? <BuscadorPreguntas editor={editor} /> : <ComposicionAreas editor={editor} />}

      {/* Resumen fijo a la vista mientras se recorre el banco o las areas. */}
      <div className={cn('flex flex-col gap-6 lg:sticky lg:top-[92px]', esFija ? 'lg:col-span-5' : 'lg:col-span-4')}>
        <SeccionCard titulo={esFija ? `Preguntas del examen (${preguntasElegidas.length})` : 'Puntaje'}>
          <div className="flex flex-col gap-4 p-5">
            <ResumenPuntaje asignado={puntajeAsignado} total={puntajeTotal} puedeRepartir={cantidadItems > 0} onRepartir={repartirPuntaje} />

            {esFija &&
              (preguntasElegidas.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-500">
                  Aún no agregas preguntas. Elige un tema en el banco y pulsa las que quieras incluir.
                </p>
              ) : (
                <ol className="flex max-h-[min(420px,calc(100vh-420px))] min-h-40 flex-col gap-2 overflow-y-auto pr-1">
                  {preguntasElegidas.map((p, i) => {
                    const info = infoPreguntas[p.preguntaId]
                    return (
                      <li key={p.preguntaId} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-primary-50 px-1 text-xs font-bold text-primary-600">{i + 1}</span>
                          <span className="line-clamp-2 flex-1 text-xs text-slate-700">{info?.texto ?? 'Cargando enunciado...'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {info && <EtiquetaDificultad dificultad={info.dificultad} />}
                          <div className="ml-auto flex items-center gap-1.5">
                            {/* Ancho en un div: cn no resuelve conflictos y el w-full del Input ganaria. */}
                            <div className="w-16">
                              <Input
                                type="number"
                                min="0"
                                className="text-center"
                                aria-label={`Puntaje de la pregunta ${i + 1}`}
                                value={p.puntajeAsignado}
                                onChange={(e) =>
                                  cambiarPreguntas((prev) => prev.map((x) => (x.preguntaId === p.preguntaId ? { ...x, puntajeAsignado: Number(e.target.value) } : x)))
                                }
                              />
                            </div>
                            <span className="text-xs text-slate-500">pts</span>
                          </div>
                          <div className="flex items-center">
                            <Button variant="ghost" size="icon" icon="arrow_upward" aria-label={`Subir pregunta ${i + 1}`} disabled={i === 0} onClick={() => cambiarPreguntas((prev) => moverElemento(prev, i, -1))} />
                            <Button
                              variant="ghost"
                              size="icon"
                              icon="arrow_downward"
                              aria-label={`Bajar pregunta ${i + 1}`}
                              disabled={i === preguntasElegidas.length - 1}
                              onClick={() => cambiarPreguntas((prev) => moverElemento(prev, i, 1))}
                            />
                            <Button
                              variant="danger"
                              size="icon"
                              icon="close"
                              aria-label={`Quitar pregunta ${i + 1}`}
                              onClick={() => cambiarPreguntas((prev) => prev.filter((x) => x.preguntaId !== p.preguntaId))}
                            />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              ))}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5">
            <Button variant="secondary" onClick={handleGuardarComposicion} loading={guardando} disabled={!composicionSucia}>
              {composicionSucia ? 'Guardar composición' : 'Guardada'}
            </Button>
            <Button icon="arrow_forward" disabled={composicionSucia} onClick={() => irAPaso(3)}>
              Siguiente
            </Button>
          </div>
        </SeccionCard>
      </div>
    </div>
  )
}
