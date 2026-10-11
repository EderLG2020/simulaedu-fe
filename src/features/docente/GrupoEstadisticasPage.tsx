import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerEstadisticasGrupo, type EstadisticasGrupo } from '../../api/estadisticasApi'
import { Alert, buttonClasses, Card, EmptyState, Icon, PageHeader, Table, TableHead, Td, Th } from '../../components/ui'
import ReporteBoton from './ReporteBoton'

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
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to={`/docente/grupos/${grupoId}`} className={buttonClasses('ghost', 'sm', '-ml-3 self-start')}>
          &larr; Volver al grupo
        </Link>
        <PageHeader title="Estadisticas del grupo" />
      </div>

      {error && <Alert>{error}</Alert>}
      {estadisticas === null && !error && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando estadisticas..." />
        </Card>
      )}

      {estadisticas !== null && (
        <>
          {!estadisticas.estadisticasAvanzadasDisponibles && (
            <Alert tone="warning">
              Tu plan no incluye estadisticas avanzadas (temas debiles por alumno). Actualiza a Plan Pro para verlas.
            </Alert>
          )}

          {grupoId && (
            <Card className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm text-slate-700">
              <Icon name="description" size={20} className="text-primary-600" />
              <p className="flex flex-wrap items-center gap-3">
                Reporte de todo el grupo: <ReporteBoton base={{ tipo: 'GRUPO', grupoId }} etiqueta="Generar" />
              </p>
            </Card>
          )}

          <Card className="overflow-hidden">
            <Table>
              <TableHead>
                <Th>Alumno</Th>
                <Th>Intentos</Th>
                <Th>Puntaje promedio</Th>
                {estadisticas.estadisticasAvanzadasDisponibles && <Th>Temas debiles</Th>}
                <Th>Reporte individual</Th>
              </TableHead>
              <tbody>
                {estadisticas.alumnos.map((alumno) => (
                  <tr key={alumno.alumnoId}>
                    <Td className="whitespace-nowrap font-medium text-slate-900">{alumno.nombre}</Td>
                    <Td className="whitespace-nowrap tabular-nums text-slate-700">{alumno.totalIntentos}</Td>
                    <Td className="whitespace-nowrap tabular-nums text-slate-700">{formatearPuntaje(alumno.puntajePromedio)}</Td>
                    {estadisticas.estadisticasAvanzadasDisponibles && (
                      <Td className="text-slate-700">
                        {alumno.temasDebiles && alumno.temasDebiles.length > 0
                          ? alumno.temasDebiles.map((t) => t.temaNombre).join(', ')
                          : 'Sin datos suficientes'}
                      </Td>
                    )}
                    <Td className="whitespace-nowrap">
                      <ReporteBoton base={{ tipo: 'ALUMNO', alumnoId: alumno.alumnoId }} etiqueta="Generar" />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {estadisticas.alumnos.length === 0 && <EmptyState icon="group" title="Este grupo todavia no tiene alumnos." />}
          </Card>
        </>
      )}
    </div>
  )
}
