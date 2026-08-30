import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerEstadisticasGrupo, type EstadisticasGrupo } from '../../api/estadisticasApi'
import ReporteBoton from './ReporteBoton'
import './docente.css'

function formatearPuntaje(valor: number | null): string {
  return valor === null ? 'Sin datos' : valor.toString()
}

export default function GrupoEstadisticasPage() {
  const { id: grupoId } = useParams<{ id: string }>()
  const [estadisticas, setEstadisticas] = useState<EstadisticasGrupo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!grupoId) return
    obtenerEstadisticasGrupo(grupoId)
      .then(setEstadisticas)
      .catch(() => setError('No se pudieron cargar las estadisticas del grupo.'))
  }, [grupoId])

  return (
    <div className="docente-page">
      <header className="docente-header">
        <div>
          <Link to={`/docente/grupos/${grupoId}`} className="docente-volver">
            &larr; Volver al grupo
          </Link>
          <h1>Estadisticas del grupo</h1>
        </div>
      </header>

      {error && <p className="docente-error">{error}</p>}
      {estadisticas === null && !error && <p>Cargando estadisticas...</p>}

      {estadisticas !== null && (
        <>
          {!estadisticas.estadisticasAvanzadasDisponibles && (
            <p className="docente-error">
              Tu plan no incluye estadisticas avanzadas (temas debiles por alumno). Actualiza a Plan Pro para verlas.
            </p>
          )}

          {grupoId && (
            <p className="docente-reporte-grupo">
              Reporte de todo el grupo: <ReporteBoton base={{ tipo: 'GRUPO', grupoId }} etiqueta="Generar" />
            </p>
          )}

          <table className="docente-tabla">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Intentos</th>
                <th>Puntaje promedio</th>
                {estadisticas.estadisticasAvanzadasDisponibles && <th>Temas debiles</th>}
                <th>Reporte individual</th>
              </tr>
            </thead>
            <tbody>
              {estadisticas.alumnos.map((alumno) => (
                <tr key={alumno.alumnoId}>
                  <td>{alumno.nombre}</td>
                  <td>{alumno.totalIntentos}</td>
                  <td>{formatearPuntaje(alumno.puntajePromedio)}</td>
                  {estadisticas.estadisticasAvanzadasDisponibles && (
                    <td>
                      {alumno.temasDebiles && alumno.temasDebiles.length > 0
                        ? alumno.temasDebiles.map((t) => t.temaNombre).join(', ')
                        : 'Sin datos suficientes'}
                    </td>
                  )}
                  <td>
                    <ReporteBoton base={{ tipo: 'ALUMNO', alumnoId: alumno.alumnoId }} etiqueta="Generar" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {estadisticas.alumnos.length === 0 && <p>Este grupo todavia no tiene alumnos.</p>}
        </>
      )}
    </div>
  )
}
