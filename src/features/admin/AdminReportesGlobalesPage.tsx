import { useEffect, useState } from 'react'
import { generarReporteGlobal, type ReporteGlobal } from '../../api/adminReportesGlobalesApi'
import { ApiError } from '../../api/client'
import './admin.css'

function formatearPorcentaje(tasa: number | null): string {
  return tasa === null ? 'Sin datos' : `${Math.round(tasa * 100)}%`
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

  function handleFiltrar(evento: React.FormEvent) {
    evento.preventDefault()
    setCargando(true)
    cargar(desde, hasta)
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Reportes globales</h1>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <form className="admin-filtros" onSubmit={handleFiltrar}>
        <label>
          Desde
          <input type="date" value={desde} onChange={(evento) => setDesde(evento.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={hasta} onChange={(evento) => setHasta(evento.target.value)} />
        </label>
        <button type="submit" disabled={cargando}>
          {cargando ? 'Generando...' : 'Generar'}
        </button>
      </form>

      {reporte === null && !error && <p>Cargando reporte...</p>}

      {reporte !== null && (
        <>
          <div className="admin-resumen">
            <div>
              <span className="admin-resumen-valor">{reporte.usuariosActivos.total}</span>
              <span className="admin-resumen-etiqueta">usuarios activos</span>
            </div>
            <div>
              <span className="admin-resumen-valor">{reporte.usuariosActivos.estudiantes}</span>
              <span className="admin-resumen-etiqueta">estudiantes activos</span>
            </div>
            <div>
              <span className="admin-resumen-valor">{reporte.usuariosActivos.docentes}</span>
              <span className="admin-resumen-etiqueta">docentes activos</span>
            </div>
            <div>
              <span className="admin-resumen-valor">{reporte.simulacrosRendidos}</span>
              <span className="admin-resumen-etiqueta">simulacros rendidos</span>
            </div>
            <div>
              <span className="admin-resumen-valor">{formatearPorcentaje(reporte.conversionFreePremium.tasa)}</span>
              <span className="admin-resumen-etiqueta">
                conversion Free-&gt;Premium ({reporte.conversionFreePremium.estudiantesPremium} de{' '}
                {reporte.conversionFreePremium.totalEstudiantesConSuscripcion})
              </span>
            </div>
          </div>

          <h2>Ingresos por plan</h2>
          {reporte.ingresosPorPlan.length === 0 ? (
            <p>No hay pagos registrados en este periodo.</p>
          ) : (
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {reporte.ingresosPorPlan.map((ingreso) => (
                  <tr key={ingreso.planId}>
                    <td>{ingreso.planNombre}</td>
                    <td>S/ {ingreso.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}
