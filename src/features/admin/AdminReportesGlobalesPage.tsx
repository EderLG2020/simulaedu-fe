import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { generarReporteGlobal, type ReporteGlobal } from '../../api/adminReportesGlobalesApi'
import { ApiError } from '../../api/client'
import { Alert, Button, Card, EmptyState, Icon, Input, PageHeader, StatCard, Table, TableHead, Td, Th } from '../../components/ui'

/** Migracion 1:1 del mockup de Stitch (antes en public/, ya eliminado). El "% de participacion"
 * por plan SI es real (se calcula aqui mismo sobre los montos reales de ingresosPorPlan), pero
 * los widgets "Distribucion por Casa de Estudio" y "Efectividad de Prueba" del mockup no se
 * migraron - no hay ningun endpoint que cuente pruebas por universidad ni tasas de abandono.
 * Tampoco se migraron los badges "+14.2%" etc.: no hay un periodo anterior con el que comparar. */

function formatearPorcentaje(tasa: number | null): string {
  return tasa === null ? 'Sin datos aún' : `${Math.round(tasa * 100)}%`
}

function aInstanteInicioDia(fecha: string): string {
  return `${fecha}T00:00:00Z`
}

function aInstanteFinDia(fecha: string): string {
  return `${fecha}T23:59:59Z`
}

export default function AdminReportesGlobalesPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [reporte, setReporte] = useState<ReporteGlobal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  function cargar(desde: string, hasta: string) {
    generarReporteGlobal({
      desde: desde ? aInstanteInicioDia(desde) : undefined,
      hasta: hasta ? aInstanteFinDia(hasta) : undefined,
    })
      .then((data) => {
        setReporte(data)
        setError(null)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo generar el reporte.'))
      .finally(() => setCargando(false))
  }

  useEffect(() => cargar(desde, hasta), []) // eslint-disable-line react-hooks/exhaustive-deps -- solo la carga inicial, handleFiltrar cubre los cambios de filtro

  function handleFiltrar(evento: FormEvent) {
    evento.preventDefault()
    setCargando(true)
    cargar(desde, hasta)
  }

  const totalIngresos = useMemo(() => reporte?.ingresosPorPlan.reduce((acc, i) => acc + i.total, 0) ?? 0, [reporte])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Panel de solo lectura
        </span>
        <PageHeader
          title="Reportes Globales y Métricas"
          description="Consolidado analítico de actividad, simulacros rendidos e ingresos por suscripción."
          actions={
            <form onSubmit={handleFiltrar} className="flex items-center gap-2">
              <Input type="date" aria-label="Desde" className="w-auto" value={desde} onChange={(evento) => setDesde(evento.target.value)} />
              <span className="text-xs text-slate-300">–</span>
              <Input type="date" aria-label="Hasta" className="w-auto" value={hasta} onChange={(evento) => setHasta(evento.target.value)} />
              <Button type="submit" loading={cargando}>
                {cargando ? 'Generando...' : 'Generar'}
              </Button>
            </form>
          }
        />
      </div>

      {error && <Alert>{error}</Alert>}
      {reporte === null && !error && <p className="text-sm text-slate-500">Cargando reporte...</p>}

      {reporte !== null && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Usuarios activos"
              icon="group"
              tone="primary"
              value={reporte.usuariosActivos.total.toLocaleString('es-PE')}
              hint={
                <>
                  {reporte.usuariosActivos.estudiantes.toLocaleString('es-PE')} estudiantes · {reporte.usuariosActivos.docentes.toLocaleString('es-PE')} docentes
                </>
              }
            />
            <StatCard
              label="Simulacros rendidos"
              icon="assignment"
              tone="info"
              value={reporte.simulacrosRendidos.toLocaleString('es-PE')}
              hint="En el período seleccionado"
            />
            <StatCard
              label="Conversión Free → Premium"
              icon="auto_graph"
              tone="success"
              value={formatearPorcentaje(reporte.conversionFreePremium.tasa)}
              hint={
                <>
                  {reporte.conversionFreePremium.estudiantesPremium.toLocaleString('es-PE')} de{' '}
                  {reporte.conversionFreePremium.totalEstudiantesConSuscripcion.toLocaleString('es-PE')} estudiantes con suscripción
                </>
              }
            />
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Ingresos por plan</h2>
                <p className="mt-0.5 text-xs text-slate-500">Monto acumulado en Soles (S/) en el período seleccionado, ordenado de mayor a menor.</p>
              </div>
              <div className="flex items-center gap-3 self-start rounded-lg bg-primary-50 px-4 py-2.5 sm:self-auto">
                <Icon name="payments" size={20} className="text-primary-600" />
                <div>
                  <span className="block text-xs font-semibold text-primary-600">Total acumulado</span>
                  <span className="font-display text-lg font-bold text-primary-900">S/ {totalIngresos.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {reporte.ingresosPorPlan.length === 0 ? (
              <EmptyState icon="payments" title="No hay pagos registrados en este período." />
            ) : (
              <Table>
                <TableHead>
                  <Th>Plan</Th>
                  <Th className="text-right">Monto en soles</Th>
                  <Th className="text-right">Participación</Th>
                </TableHead>
                <tbody>
                  {[...reporte.ingresosPorPlan]
                    .sort((a, b) => b.total - a.total)
                    .map((ingreso) => {
                      const participacion = totalIngresos === 0 ? 0 : (ingreso.total / totalIngresos) * 100
                      return (
                        <tr key={ingreso.planId}>
                          <Td className="align-middle font-semibold text-slate-900">{ingreso.planNombre}</Td>
                          <Td className="text-right align-middle font-display font-bold text-slate-900">S/ {ingreso.total.toFixed(2)}</Td>
                          <Td className="align-middle">
                            <div className="flex items-center justify-end gap-3">
                              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-primary-600" style={{ width: `${participacion}%` }} />
                              </div>
                              <span className="w-12 text-right text-xs font-semibold text-slate-600">{participacion.toFixed(1)}%</span>
                            </div>
                          </Td>
                        </tr>
                      )
                    })}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
