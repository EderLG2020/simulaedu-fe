import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { calificarRevision, listarRevisionesPendientes, type RevisionPendiente } from '../../api/revisionesApi'
import { Alert, Button, Card, EmptyState, Field, Icon, Input, PageHeader } from '../../components/ui'
import { CLASE_CODIGO_Y_AUDIO } from '../simulacro/estilosSimulacro'
import { htmlSeguro } from '../../lib/html'

function textoDeRespuesta(respuestaDada: Record<string, unknown>): string {
  if (typeof respuestaDada.texto === 'string' && respuestaDada.texto.trim() !== '') {
    return respuestaDada.texto
  }
  return Object.keys(respuestaDada).length === 0 ? 'El alumno no respondio esta pregunta.' : JSON.stringify(respuestaDada)
}

export default function RevisionesPage() {
  const [pendientes, setPendientes] = useState<RevisionPendiente[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [puntajes, setPuntajes] = useState<Record<string, string>>({})
  const [calificandoId, setCalificandoId] = useState<string | null>(null)

  function cargar() {
    listarRevisionesPendientes()
      .then(setPendientes)
      .catch(() => setError('No se pudieron cargar las revisiones pendientes.'))
  }

  useEffect(cargar, [])

  async function handleCalificar(evento: FormEvent, revision: RevisionPendiente) {
    evento.preventDefault()
    const puntaje = Number(puntajes[revision.respuestaSimulacroId])
    if (Number.isNaN(puntaje) || puntaje < 0 || puntaje > revision.puntajeMaximo) {
      setError(`El puntaje debe estar entre 0 y ${revision.puntajeMaximo}.`)
      return
    }

    setError(null)
    setCalificandoId(revision.respuestaSimulacroId)
    try {
      await calificarRevision(revision.respuestaSimulacroId, puntaje)
      setPendientes((actual) => actual?.filter((r) => r.respuestaSimulacroId !== revision.respuestaSimulacroId) ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo calificar la respuesta.')
    } finally {
      setCalificandoId(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="Revisiones pendientes" description="Respuestas de desarrollo que esperan tu calificación." />

      {error && <Alert>{error}</Alert>}

      {pendientes === null && !error && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando revisiones..." />
        </Card>
      )}
      {pendientes !== null && pendientes.length === 0 && (
        <Card>
          <EmptyState icon="task_alt" title="No tienes revisiones pendientes por ahora." />
        </Card>
      )}

      <ul className="flex flex-col gap-4">
        {pendientes?.map((revision) => {
          const calificando = calificandoId === revision.respuestaSimulacroId
          return (
            <li key={revision.respuestaSimulacroId}>
              <Card className="flex flex-col gap-4 p-5">
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                  <Icon name="person" size={16} className="text-slate-400" />
                  <span className="font-medium text-slate-700">{revision.alumnoNombre}</span> &middot; {revision.examenNombre}
                </p>
                <div
                  className={`text-sm text-slate-900 [&_img]:max-w-full [&_img]:rounded-md ${CLASE_CODIGO_Y_AUDIO}`}
                  dangerouslySetInnerHTML={{ __html: htmlSeguro(revision.enunciadoHtml) }}
                />
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm whitespace-pre-wrap text-slate-700">
                  {textoDeRespuesta(revision.respuestaDada)}
                </p>

                <form
                  className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4"
                  onSubmit={(evento) => handleCalificar(evento, revision)}
                >
                  <Field label={`Puntaje (0 - ${revision.puntajeMaximo})`}>
                    <Input
                      type="number"
                      className="w-32"
                      min={0}
                      max={revision.puntajeMaximo}
                      step="0.1"
                      value={puntajes[revision.respuestaSimulacroId] ?? ''}
                      onChange={(evento) =>
                        setPuntajes((actual) => ({ ...actual, [revision.respuestaSimulacroId]: evento.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Button type="submit" icon="check" loading={calificando}>
                    {calificando ? 'Calificando...' : 'Calificar'}
                  </Button>
                </form>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
