import { useCallback, useEffect, useState } from 'react'
import {
  asignarLicencia,
  listarAlumnos,
  obtenerInstitucion,
  revocarLicencia,
  type AlumnoCoordinador,
  type InstitucionCoordinador,
} from '../../api/coordinadorApi'
import { ApiError } from '../../api/client'
import { Alert, Badge, Button, Card, EmptyState, Icon, PageHeader, StatCard } from '../../components/ui'

export default function CoordinadorPage() {
  const [institucion, setInstitucion] = useState<InstitucionCoordinador | null>(null)
  const [alumnos, setAlumnos] = useState<AlumnoCoordinador[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [alumnoEnProceso, setAlumnoEnProceso] = useState<string | null>(null)

  const cargar = useCallback(() => {
    Promise.all([obtenerInstitucion(), listarAlumnos()])
      .then(([institucionCargada, alumnosCargados]) => {
        setInstitucion(institucionCargada)
        setAlumnos(alumnosCargados)
      })
      .catch(() => setError('No se pudo cargar la informacion de tu institucion.'))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function handleAsignar(alumno: AlumnoCoordinador) {
    setError(null)
    setAlumnoEnProceso(alumno.id)
    try {
      await asignarLicencia(alumno.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo asignar la licencia.')
    } finally {
      setAlumnoEnProceso(null)
    }
  }

  async function handleRevocar(alumno: AlumnoCoordinador) {
    setError(null)
    setAlumnoEnProceso(alumno.id)
    try {
      await revocarLicencia(alumno.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo revocar la licencia.')
    } finally {
      setAlumnoEnProceso(null)
    }
  }

  const sinLicenciasDisponibles = institucion !== null && institucion.licenciasDisponibles <= 0

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="Licencias y alumnos" description="Asigna o revoca las licencias de tu institución entre tus alumnos." />

      {error && <Alert>{error}</Alert>}

      {institucion === null && !error && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando institucion..." />
        </Card>
      )}

      {institucion !== null && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
            <Icon name="apartment" size={20} className="text-primary-600" />
            {institucion.nombre}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Licencias usadas" value={institucion.licenciasUsadas} icon="badge" tone="primary" />
            <StatCard
              label="Licencias disponibles"
              value={institucion.licenciasDisponibles}
              icon="event_available"
              tone={sinLicenciasDisponibles ? 'warning' : 'success'}
            />
            <StatCard label="Licencias contratadas" value={institucion.licenciasTotales} icon="inventory_2" tone="neutral" />
          </div>
        </section>
      )}

      {alumnos !== null && alumnos.length === 0 && (
        <Card>
          <EmptyState icon="group" title="Todavia no hay alumnos asignados a tu institucion." />
        </Card>
      )}

      {alumnos !== null && alumnos.length > 0 && (
        <Card className="overflow-hidden">
          <ul className="list-none divide-y divide-slate-100">
            {alumnos.map((alumno) => {
              const enProceso = alumnoEnProceso === alumno.id
              return (
                <li key={alumno.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                      <Icon name="person" size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-slate-900">{alumno.nombre}</h3>
                        {alumno.licenciaAsignada ? <Badge tone="success">Con licencia</Badge> : <Badge>Sin licencia</Badge>}
                      </div>
                      <p className="truncate text-sm text-slate-500">{alumno.email}</p>
                    </div>
                  </div>
                  {alumno.licenciaAsignada ? (
                    <Button variant="secondary" className="shrink-0" loading={enProceso} onClick={() => handleRevocar(alumno)}>
                      {enProceso ? 'Revocando...' : 'Revocar licencia'}
                    </Button>
                  ) : (
                    <Button
                      className="shrink-0"
                      loading={enProceso}
                      disabled={sinLicenciasDisponibles}
                      onClick={() => handleAsignar(alumno)}
                    >
                      {enProceso ? 'Asignando...' : 'Asignar licencia'}
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
