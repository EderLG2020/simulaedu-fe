import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { claves } from '../../../shared/api/claves'
import { mensajeDeError } from '../../../shared/api/client'
import { descargarReporteInstitucion, descargarReporteSeccion, listarSecciones, obtenerInstitucion } from '../api/coordinadorApi'
import { Alert, Card, EmptyState, Icon, PageHeader } from '../../../shared/components/ui'
import { plural } from '../../../shared/lib/formato'
import BotonReporte from '../components/BotonReporte'

export default function CoordinadorReportesPage() {
  const consultaInstitucion = useQuery({ queryKey: claves.coordinador.institucion, queryFn: obtenerInstitucion })
  const consultaSecciones = useQuery({ queryKey: claves.coordinador.secciones, queryFn: listarSecciones })
  const institucion = consultaInstitucion.data ?? null
  const secciones = consultaSecciones.data ?? null

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Reportes"
        description="Descarga en PDF o Excel el desempeño de tu institución o de cada sección. Se generan al instante con los datos de hoy."
      />

      {consultaInstitucion.isError && <Alert>No se pudo cargar la información de tu institución.</Alert>}

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Icon name="apartment" size={20} />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">Reporte de la institución</h2>
            <p className="text-sm text-slate-500">Indicadores generales, evolución semanal, temas débiles y resumen por sección.</p>
          </div>
        </div>
        <BotonReporte nombreBase={institucion?.nombre ?? 'institucion'} descargar={descargarReporteInstitucion} />
      </Card>

      <Card className="overflow-hidden">
        <h2 className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 font-display text-base font-semibold text-slate-900">
          <Icon name="groups" size={20} className="text-primary-600" />
          Reportes por sección
        </h2>
        {consultaSecciones.isError && (
          <Alert className="m-4">{mensajeDeError(consultaSecciones.error, 'No se pudieron cargar las secciones.')}</Alert>
        )}
        {consultaSecciones.isPending && <EmptyState icon="hourglass_empty" title="Cargando secciones..." />}
        {secciones !== null && secciones.length === 0 && (
          <EmptyState icon="groups" title="Todavía no hay secciones.">
            <Link to="/coordinador/secciones" className="font-semibold text-primary-600 hover:underline">
              Crea una sección
            </Link>{' '}
            para descargar su reporte.
          </EmptyState>
        )}
        {secciones !== null && secciones.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {secciones.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link to={`/coordinador/secciones/${s.id}`} className="font-semibold text-slate-900 hover:text-primary-600 hover:underline">
                    {s.nombre}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    {s.docenteNombre} · {plural(s.totalAlumnos, 'alumno', 'alumnos')}
                  </p>
                </div>
                <BotonReporte nombreBase={s.nombre} descargar={(formato) => descargarReporteSeccion(s.id, formato)} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
