import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { obtenerEstadisticasExamen, type EstadisticasExamen } from '../../api/estadisticasApi'
import './docente.css'

function formatearTiempo(segundos: number | null): string {
  if (segundos === null) return 'Sin datos'
  const minutos = Math.round(segundos / 60)
  return `${minutos} min`
}

function formatearPorcentaje(fraccion: number): string {
  return `${Math.round(fraccion * 100)}%`
}

export default function ExamenEstadisticasPage() {
  const { examenId } = useParams<{ examenId: string }>()
  const [estadisticas, setEstadisticas] = useState<EstadisticasExamen | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!examenId) return
    obtenerEstadisticasExamen(examenId)
      .then(setEstadisticas)
      .catch(() => setError('No se pudieron cargar las estadisticas del examen.'))
  }, [examenId])

  return (
    <div className="docente-page">
      <header className="docente-header">
        <h1>Estadisticas del examen</h1>
      </header>

      {error && <p className="docente-error">{error}</p>}
      {estadisticas === null && !error && <p>Cargando estadisticas...</p>}

      {estadisticas !== null && (
        <>
          <div className="docente-resumen-examen">
            <div>
              <span className="docente-resumen-valor">{estadisticas.totalIntentos}</span>
              <span className="docente-resumen-etiqueta">intentos</span>
            </div>
            <div>
              <span className="docente-resumen-valor">{estadisticas.puntajePromedio ?? 'Sin datos'}</span>
              <span className="docente-resumen-etiqueta">puntaje promedio</span>
            </div>
            <div>
              <span className="docente-resumen-valor">{formatearTiempo(estadisticas.tiempoPromedioSeg)}</span>
              <span className="docente-resumen-etiqueta">tiempo promedio</span>
            </div>
          </div>

          <h2>Preguntas con mayor tasa de error</h2>
          {estadisticas.preguntasConMayorTasaError.length === 0 ? (
            <p>Todavia no hay suficientes respuestas para calcular esto.</p>
          ) : (
            <ul className="docente-lista">
              {estadisticas.preguntasConMayorTasaError.map((pregunta) => (
                <li key={pregunta.preguntaId} className="docente-pregunta-error">
                  <div className="docente-revision-enunciado" dangerouslySetInnerHTML={{ __html: pregunta.enunciadoHtml }} />
                  <p className="docente-alumno-email">
                    {formatearPorcentaje(pregunta.tasaError)} de error &middot; {pregunta.totalRespuestas} respuesta(s)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
