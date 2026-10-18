import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { claves } from '../../api/claves'
import { obtenerEstadisticasExamen } from '../../api/estadisticasApi'
import { Alert, Badge, Card, EmptyState, PageHeader, StatCard } from '../../components/ui'
import { CLASE_CODIGO_Y_AUDIO } from '../simulacro/estilosSimulacro'
import { htmlSeguro } from '../../lib/html'

function formatearTiempo(segundos: number | null): string {
  if (segundos === null) return 'Sin datos'
  const minutos = Math.round(segundos / 60)
  return `${minutos} min`
}

function formatearPorcentaje(fraccion: number): string {
  return `${Math.round(fraccion * 100)}%`
}

export default function ExamenEstadisticasPage() {
  const { examenId = '' } = useParams<{ examenId: string }>()
  const consulta = useQuery({ queryKey: claves.examenes.estadisticas(examenId), queryFn: () => obtenerEstadisticasExamen(examenId) })
  const estadisticas = consulta.data ?? null
  const error = consulta.isError ? 'No se pudieron cargar las estadisticas del examen.' : null

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="Estadisticas del examen" />

      {error && <Alert>{error}</Alert>}
      {estadisticas === null && !error && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando estadisticas..." />
        </Card>
      )}

      {estadisticas !== null && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="intentos" value={estadisticas.totalIntentos} icon="assignment_turned_in" />
            <StatCard label="puntaje promedio" value={estadisticas.puntajePromedio ?? 'Sin datos'} icon="grade" tone="success" />
            <StatCard label="tiempo promedio" value={formatearTiempo(estadisticas.tiempoPromedioSeg)} icon="schedule" tone="info" />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold text-slate-900">Preguntas con mayor tasa de error</h2>
            {estadisticas.preguntasConMayorTasaError.length === 0 ? (
              <Card>
                <EmptyState icon="query_stats" title="Todavia no hay suficientes respuestas para calcular esto." />
              </Card>
            ) : (
              <ul className="flex flex-col gap-3">
                {estadisticas.preguntasConMayorTasaError.map((pregunta) => (
                  <li key={pregunta.preguntaId}>
                    <Card className="flex flex-col gap-3 p-5">
                      <div
                        className={`text-sm text-slate-900 [&_img]:max-w-full [&_img]:rounded-md ${CLASE_CODIGO_Y_AUDIO}`}
                        dangerouslySetInnerHTML={{ __html: htmlSeguro(pregunta.enunciadoHtml) }}
                      />
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <BarraError fraccion={pregunta.tasaError} />
                        <p>
                          <Badge tone="danger">{formatearPorcentaje(pregunta.tasaError)} de error</Badge> &middot; {pregunta.totalRespuestas} respuesta(s)
                        </p>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

/** Barra horizontal decorativa con la tasa de error (el valor accesible va en el texto contiguo). */
function BarraError({ fraccion }: { fraccion: number }) {
  const ancho = Math.min(100, Math.max(0, Math.round(fraccion * 100)))
  return (
    <span aria-hidden="true" className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
      <span className="block h-full rounded-full bg-rose-500" style={{ width: `${ancho}%` }} />
    </span>
  )
}
