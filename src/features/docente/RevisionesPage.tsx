import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { calificarRevision, listarRevisionesPendientes, type RevisionPendiente } from '../../api/revisionesApi'
import { useAuth } from '../../hooks/useAuth'
import './docente.css'

function textoDeRespuesta(respuestaDada: Record<string, unknown>): string {
  if (typeof respuestaDada.texto === 'string' && respuestaDada.texto.trim() !== '') {
    return respuestaDada.texto
  }
  return Object.keys(respuestaDada).length === 0 ? 'El alumno no respondio esta pregunta.' : JSON.stringify(respuestaDada)
}

export default function RevisionesPage() {
  const { cerrarSesion } = useAuth()
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
    <div className="docente-page">
      <header className="docente-header">
        <h1>Revisiones pendientes</h1>
        <button type="button" className="docente-cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </header>

      {error && <p className="docente-error">{error}</p>}

      {pendientes === null && !error && <p>Cargando revisiones...</p>}
      {pendientes !== null && pendientes.length === 0 && <p>No tienes revisiones pendientes por ahora.</p>}

      <ul className="docente-lista">
        {pendientes?.map((revision) => (
          <li key={revision.respuestaSimulacroId} className="docente-revision">
            <p className="docente-alumno-email">
              {revision.alumnoNombre} &middot; {revision.examenNombre}
            </p>
            <div className="docente-revision-enunciado" dangerouslySetInnerHTML={{ __html: revision.enunciadoHtml }} />
            <p className="docente-revision-respuesta">{textoDeRespuesta(revision.respuestaDada)}</p>

            <form className="docente-calificar" onSubmit={(evento) => handleCalificar(evento, revision)}>
              <label>
                Puntaje (0 - {revision.puntajeMaximo})
                <input
                  type="number"
                  min={0}
                  max={revision.puntajeMaximo}
                  step="0.1"
                  value={puntajes[revision.respuestaSimulacroId] ?? ''}
                  onChange={(evento) =>
                    setPuntajes((actual) => ({ ...actual, [revision.respuestaSimulacroId]: evento.target.value }))
                  }
                  required
                />
              </label>
              <button type="submit" disabled={calificandoId === revision.respuestaSimulacroId}>
                {calificandoId === revision.respuestaSimulacroId ? 'Calificando...' : 'Calificar'}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
