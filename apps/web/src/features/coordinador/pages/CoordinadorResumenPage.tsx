import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { claves } from '../../../shared/api/claves'
import { mensajeDeError } from '../../../shared/api/client'
import { obtenerDashboard, obtenerInstitucion } from '../api/coordinadorApi'
import { Alert, Badge, buttonClasses, Card, EmptyState, Icon, PageHeader, StatCard } from '../../../shared/components/ui'
import GraficoEvolucion from '../components/GraficoEvolucion'
import ListaTemasDebiles from '../components/ListaTemasDebiles'
import { formatearFecha, formatearPuntaje } from '../lib/formato'

/** Encabezado de un bloque dentro de su Card. */
function EncabezadoBloque({ icono, titulo, accion }: { icono: string; titulo: string; accion?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
        <Icon name={icono} size={20} className="text-primary-600" />
        {titulo}
      </h2>
      {accion}
    </div>
  )
}

export default function CoordinadorResumenPage() {
  const consultaInstitucion = useQuery({ queryKey: claves.coordinador.institucion, queryFn: obtenerInstitucion })
  const consulta = useQuery({ queryKey: claves.coordinador.dashboard, queryFn: obtenerDashboard })
  const dashboard = consulta.data ?? null
  const institucion = consultaInstitucion.data ?? null

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        title={institucion ? institucion.nombre : 'Resumen'}
        description="Cómo va tu institución: actividad de los alumnos, puntajes y temas a reforzar."
        actions={
          <Link to="/coordinador/reportes" className={buttonClasses('secondary')}>
            <Icon name="description" size={18} />
            Reportes
          </Link>
        }
      />

      {consulta.isError && <Alert>{mensajeDeError(consulta.error, 'No se pudo cargar el resumen de tu institución.')}</Alert>}

      {consulta.isPending && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando resumen..." />
        </Card>
      )}

      {dashboard && (
        <>
          <section aria-label="Indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Alumnos"
              value={dashboard.totalAlumnos}
              icon="group"
              hint={`${dashboard.alumnosConLicencia} con licencia`}
            />
            <StatCard
              label="Simulacros (últimos 7 días)"
              value={dashboard.simulacrosUltimos7Dias}
              icon="quiz"
              tone="info"
              hint={`${dashboard.simulacrosTotales} en total`}
            />
            <StatCard label="Puntaje promedio" value={formatearPuntaje(dashboard.puntajePromedio)} icon="grade" tone="success" />
            <StatCard
              label="Alumnos inactivos"
              value={dashboard.alumnosInactivos}
              icon="event_busy"
              tone={dashboard.alumnosInactivos > 0 ? 'warning' : 'neutral'}
              hint="Sin simulacros en 7 días"
            />
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link to="/coordinador/secciones" className="rounded-xl focus-visible:outline-2 focus-visible:outline-primary-600">
              <StatCard label="Secciones" value={dashboard.totalSecciones} icon="groups" tone="accent" className="transition-colors hover:border-primary-200" />
            </Link>
            <Link to="/coordinador/docentes" className="rounded-xl focus-visible:outline-2 focus-visible:outline-primary-600">
              <StatCard label="Docentes" value={dashboard.totalDocentes} icon="school" tone="neutral" className="transition-colors hover:border-primary-200" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <EncabezadoBloque icono="bar_chart" titulo="Simulacros por semana" />
              <div className="px-5 py-4">
                {dashboard.evolucionSemanal.length === 0 ? (
                  <EmptyState icon="bar_chart" title="Aún no hay simulacros para graficar." />
                ) : (
                  <GraficoEvolucion puntos={dashboard.evolucionSemanal} />
                )}
              </div>
            </Card>
            <Card className="lg:col-span-2">
              <EncabezadoBloque icono="trending_down" titulo="Temas a reforzar" />
              <ListaTemasDebiles temas={dashboard.temasDebiles} vacio="Aún no hay respuestas suficientes para detectar temas débiles." />
            </Card>
          </div>

          <Card className="overflow-hidden">
            <EncabezadoBloque
              icono="event_busy"
              titulo="Alumnos inactivos"
              accion={
                <Link to="/coordinador/alumnos" className={buttonClasses('ghost', 'sm')}>
                  Ver todos
                  <Icon name="arrow_forward" size={16} />
                </Link>
              }
            />
            {dashboard.inactivos.length === 0 ? (
              <EmptyState icon="task_alt" title="Todos tus alumnos rindieron al menos un simulacro esta semana." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {dashboard.inactivos.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/coordinador/alumnos/${a.id}`}
                      className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <Icon name="person" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-900">{a.nombre}</span>
                        <span className="block truncate text-xs text-slate-500">{a.email}</span>
                      </span>
                      <Badge tone="warning">Última actividad: {formatearFecha(a.ultimaActividad)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
