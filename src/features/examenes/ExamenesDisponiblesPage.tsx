import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { listarExamenesPublicados, type ExamenResumen } from '../../api/examenesApi'
import { iniciarSimulacro } from '../../api/simulacrosApi'
import { useAuth } from '../../hooks/useAuth'
import './examenes.css'

function formatearDuracion(segundos: number): string {
  const minutos = Math.round(segundos / 60)
  return `${minutos} min`
}

export default function ExamenesDisponiblesPage() {
  const navigate = useNavigate()
  const { cerrarSesion } = useAuth()
  const [examenes, setExamenes] = useState<ExamenResumen[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [iniciandoId, setIniciandoId] = useState<string | null>(null)

  useEffect(() => {
    listarExamenesPublicados()
      .then(setExamenes)
      .catch(() => setError('No se pudieron cargar los examenes disponibles.'))
  }, [])

  async function handleIniciar(examen: ExamenResumen) {
    setError(null)
    setIniciandoId(examen.id)
    try {
      const simulacro = await iniciarSimulacro(examen.id, 'PRACTICA_LIBRE')
      navigate(`/simulacros/${simulacro.id}`, { state: { simulacro } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar el simulacro.')
      setIniciandoId(null)
    }
  }

  return (
    <div className="examenes-page">
      <header className="examenes-header">
        <h1>Examenes disponibles</h1>
        <button type="button" className="examenes-cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </header>

      {error && <p className="examenes-error">{error}</p>}

      {examenes === null && !error && <p>Cargando examenes...</p>}
      {examenes !== null && examenes.length === 0 && <p>Todavia no hay examenes publicados.</p>}

      <ul className="examenes-lista">
        {examenes?.map((examen) => (
          <li key={examen.id} className="examen-item">
            <div>
              <h2>{examen.nombre}</h2>
              <p className="examen-meta">
                {formatearDuracion(examen.duracionSeg)} · {examen.puntajeTotal} pts ·{' '}
                {examen.navegacion === 'LIBRE' ? 'navegacion libre' : 'navegacion secuencial'}
              </p>
            </div>
            <button
              type="button"
              className="examen-iniciar"
              disabled={iniciandoId === examen.id}
              onClick={() => handleIniciar(examen)}
            >
              {iniciandoId === examen.id ? 'Iniciando...' : 'Iniciar simulacro'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
