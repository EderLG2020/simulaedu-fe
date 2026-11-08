import { useQuery } from '@tanstack/react-query'
import { claves } from '../../../shared/api/claves'
import { mensajeDeError } from '../../../shared/api/client'
import { listarDocentes, obtenerInstitucion } from '../api/coordinadorApi'
import { Alert, Badge, Card, EmptyState, Icon, PageHeader } from '../../../shared/components/ui'
import { plural } from '../../../shared/lib/formato'

export default function CoordinadorDocentesPage() {
  const consulta = useQuery({ queryKey: claves.coordinador.docentes, queryFn: listarDocentes })
  const consultaInstitucion = useQuery({ queryKey: claves.coordinador.institucion, queryFn: obtenerInstitucion })
  const docentes = consulta.data ?? null
  const codigo = consultaInstitucion.data?.codigoInvitacion

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="Docentes" description="Docentes de tu institución. Puedes ponerlos a cargo de una sección." />

      <Alert tone="info">
        Los docentes se unen por su cuenta: crean su cuenta de docente y, en Configuración › Institución, ingresan el código de
        invitación{codigo ? (
          <>
            {' '}
            <strong className="tracking-widest">{codigo}</strong>
          </>
        ) : null}
        . Lo encuentras (y puedes regenerarlo) en la pantalla de Alumnos.
      </Alert>

      {consulta.isError && <Alert>{mensajeDeError(consulta.error, 'No se pudieron cargar los docentes.')}</Alert>}
      {consulta.isPending && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando docentes..." />
        </Card>
      )}

      {docentes !== null && docentes.length === 0 && (
        <Card>
          <EmptyState icon="school" title="Todavía no hay docentes en tu institución." />
        </Card>
      )}

      {docentes !== null && docentes.length > 0 && (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {docentes.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <Icon name="school" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{d.nombre}</p>
                  <p className="truncate text-sm text-slate-500">{d.email}</p>
                </div>
                <Badge tone={d.totalSecciones > 0 ? 'primary' : 'neutral'}>
                  {d.totalSecciones > 0 ? `A cargo de ${plural(d.totalSecciones, 'sección', 'secciones')}` : 'Sin secciones'}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
