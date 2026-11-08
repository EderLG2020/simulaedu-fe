import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { claves } from '../../../shared/api/claves'
import { mensajeDeError } from '../../../shared/api/client'
import { asignarLicencia, obtenerAlumno, quitarAlumnoDeInstitucion, revocarLicencia } from '../api/coordinadorApi'
import { Alert, Badge, Button, buttonClasses, Card, EmptyState, Icon, PageHeader, StatCard, Table, TableHead, Td, Th } from '../../../shared/components/ui'
import ConfirmarModal from '../components/ConfirmarModal'
import ListaTemasDebiles from '../components/ListaTemasDebiles'
import { formatearFecha, formatearPuntaje } from '../lib/formato'

export default function CoordinadorAlumnoDetallePage() {
  const { id: alumnoId = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const consulta = useQuery({ queryKey: claves.coordinador.alumno(alumnoId), queryFn: () => obtenerAlumno(alumnoId) })
  const detalle = consulta.data ?? null
  const [errorAccion, setError] = useState<string | null>(null)
  const [cambiandoLicencia, setCambiandoLicencia] = useState(false)
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false)

  async function alternarLicencia() {
    if (!detalle) return
    setError(null)
    setCambiandoLicencia(true)
    try {
      if (detalle.alumno.licenciaAsignada) await revocarLicencia(alumnoId)
      else await asignarLicencia(alumnoId)
      await queryClient.invalidateQueries({ queryKey: claves.coordinador.todo })
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo actualizar la licencia.'))
    } finally {
      setCambiandoLicencia(false)
    }
  }

  async function quitar() {
    await quitarAlumnoDeInstitucion(alumnoId)
    // Primero se sale de la pantalla: refrescar el detalle de un alumno que ya no es de la institucion daria error.
    navigate('/coordinador/alumnos')
    queryClient.removeQueries({ queryKey: claves.coordinador.alumno(alumnoId) })
    void queryClient.invalidateQueries({ queryKey: claves.coordinador.todo })
  }

  const alumno = detalle?.alumno

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to="/coordinador/alumnos" className={buttonClasses('ghost', 'sm', '-ml-3 self-start')}>
          &larr; Volver a alumnos
        </Link>
        <PageHeader
          title={alumno?.nombre ?? 'Alumno'}
          description={alumno?.email}
          actions={
            alumno && (
              <>
                <Button variant={alumno.licenciaAsignada ? 'secondary' : 'primary'} icon="badge" loading={cambiandoLicencia} onClick={alternarLicencia}>
                  {alumno.licenciaAsignada ? 'Revocar licencia' : 'Asignar licencia'}
                </Button>
                <Button variant="danger" icon="person_remove" onClick={() => setConfirmandoQuitar(true)}>
                  Quitar de la institución
                </Button>
              </>
            )
          }
        />
      </div>

      {errorAccion && <Alert>{errorAccion}</Alert>}
      {consulta.isError && <Alert>{mensajeDeError(consulta.error, 'No se pudo cargar el alumno.')}</Alert>}
      {consulta.isPending && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando alumno..." />
        </Card>
      )}

      {detalle && alumno && (
        <>
          <div className="flex flex-wrap gap-2">
            {alumno.licenciaAsignada ? <Badge tone="success">Con licencia</Badge> : <Badge>Sin licencia</Badge>}
            {alumno.inactivo ? <Badge tone="warning">Inactivo (sin simulacros en 7 días)</Badge> : <Badge tone="info">Activo</Badge>}
            {detalle.secciones.map((s) => (
              <Link key={s.id} to={`/coordinador/secciones/${s.id}`}>
                <Badge tone="primary">
                  <Icon name="groups" size={14} />
                  {s.nombre}
                </Badge>
              </Link>
            ))}
            {detalle.secciones.length === 0 && <Badge>Sin sección</Badge>}
          </div>

          <section aria-label="Indicadores del alumno" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Simulacros rendidos" value={alumno.totalSimulacros} icon="quiz" />
            <StatCard label="Puntaje promedio" value={formatearPuntaje(alumno.puntajePromedio)} icon="grade" tone="success" />
            <StatCard
              label="Última actividad"
              value={formatearFecha(alumno.ultimaActividad)}
              icon="schedule"
              tone={alumno.inactivo ? 'warning' : 'neutral'}
            />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <h2 className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 font-display text-base font-semibold text-slate-900">
                <Icon name="trending_down" size={20} className="text-primary-600" />
                Temas a reforzar
              </h2>
              <ListaTemasDebiles temas={detalle.temasDebiles} vacio="Aún no hay respuestas suficientes." />
            </Card>
            <Card className="overflow-hidden lg:col-span-2">
              <h2 className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 font-display text-base font-semibold text-slate-900">
                <Icon name="history" size={20} className="text-primary-600" />
                Historial de simulacros
              </h2>
              {detalle.historial.length === 0 ? (
                <EmptyState icon="quiz" title="Este alumno todavía no rindió simulacros." />
              ) : (
                <Table>
                  <TableHead>
                    <Th>Examen</Th>
                    <Th>Fecha</Th>
                    <Th>Puntaje</Th>
                    <Th>Correctas</Th>
                    <Th>Incorrectas</Th>
                    <Th>En blanco</Th>
                  </TableHead>
                  <tbody>
                    {detalle.historial.map((h) => (
                      <tr key={h.simulacroId}>
                        <Td className="font-medium text-slate-900">{h.examenNombre}</Td>
                        <Td className="whitespace-nowrap text-slate-700">{formatearFecha(h.fecha)}</Td>
                        <Td className="tabular-nums text-slate-900">{formatearPuntaje(h.puntajeTotal)}</Td>
                        <Td className="tabular-nums text-emerald-700">{h.correctas}</Td>
                        <Td className="tabular-nums text-rose-700">{h.incorrectas}</Td>
                        <Td className="tabular-nums text-slate-500">{h.enBlanco}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </div>
        </>
      )}

      {confirmandoQuitar && alumno && (
        <ConfirmarModal
          titulo="Quitar alumno de la institución"
          etiquetaConfirmar="Quitar alumno"
          onConfirmar={quitar}
          onCerrar={() => setConfirmandoQuitar(false)}
        >
          <p>
            <strong>{alumno.nombre}</strong> dejará de pertenecer a tu institución: se revocará su licencia (si tiene una) y saldrá de
            todas sus secciones. Su cuenta y su historial no se borran.
          </p>
        </ConfirmarModal>
      )}
    </div>
  )
}
