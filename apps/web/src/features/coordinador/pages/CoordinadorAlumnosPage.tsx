import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { claves } from '../../../shared/api/claves'
import { mensajeDeError } from '../../../shared/api/client'
import {
  asignarLicencia,
  asignarLicenciasEnLote,
  listarAlumnos,
  obtenerInstitucion,
  quitarAlumnoDeInstitucion,
  regenerarCodigoInvitacion,
  revocarLicencia,
  type AlumnoCoordinador,
} from '../api/coordinadorApi'
import { Alert, Badge, Button, Card, EmptyState, Input, PageHeader, SegmentedControl, StatCard } from '../../../shared/components/ui'
import { plural } from '../../../shared/lib/formato'
import ConfirmarModal from '../components/ConfirmarModal'
import ImportarAlumnosModal from '../components/ImportarAlumnosModal'
import TarjetaCodigoInvitacion from '../components/TarjetaCodigoInvitacion'
import { formatearFecha, formatearPuntaje } from '../lib/formato'

type Filtro = 'TODOS' | 'SIN_LICENCIA' | 'INACTIVOS'

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'SIN_LICENCIA', label: 'Sin licencia' },
  { value: 'INACTIVOS', label: 'Inactivos' },
]

function coincide(alumno: AlumnoCoordinador, texto: string, filtro: Filtro): boolean {
  if (filtro === 'SIN_LICENCIA' && alumno.licenciaAsignada) return false
  if (filtro === 'INACTIVOS' && !alumno.inactivo) return false
  const t = texto.trim().toLowerCase()
  return !t || alumno.nombre.toLowerCase().includes(t) || alumno.email.toLowerCase().includes(t)
}

export default function CoordinadorAlumnosPage() {
  const queryClient = useQueryClient()
  const consultaInstitucion = useQuery({ queryKey: claves.coordinador.institucion, queryFn: obtenerInstitucion })
  const consultaAlumnos = useQuery({ queryKey: claves.coordinador.alumnos, queryFn: listarAlumnos })
  const institucion = consultaInstitucion.data ?? null
  const alumnos = consultaAlumnos.data ?? null

  const [errorAccion, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [alumnoEnProceso, setAlumnoEnProceso] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [asignandoLote, setAsignandoLote] = useState(false)
  const [aQuitar, setAQuitar] = useState<AlumnoCoordinador | null>(null)
  const [importando, setImportando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('TODOS')

  const error =
    errorAccion ??
    (consultaInstitucion.isError
      ? 'No se pudo cargar la información de tu institución.'
      : consultaAlumnos.isError
        ? 'No se pudo cargar la lista de alumnos.'
        : null)

  /** Licencias, alumnos, secciones y métricas cambian juntos: se invalida todo el panel. */
  function refrescar() {
    return queryClient.invalidateQueries({ queryKey: claves.coordinador.todo })
  }

  async function ejecutar(alumnoId: string, accion: () => Promise<unknown>, mensajeError: string) {
    setError(null)
    setAviso(null)
    setAlumnoEnProceso(alumnoId)
    try {
      await accion()
      await refrescar()
    } catch (err) {
      setError(mensajeDeError(err, mensajeError))
    } finally {
      setAlumnoEnProceso(null)
    }
  }

  async function asignarSeleccionados() {
    setError(null)
    setAviso(null)
    setAsignandoLote(true)
    try {
      const r = await asignarLicenciasEnLote([...seleccion])
      const partes = [plural(r.asignadas, 'licencia asignada', 'licencias asignadas')]
      if (r.yaTenian > 0) partes.push(`${plural(r.yaTenian, 'alumno ya tenía', 'alumnos ya tenían')} licencia`)
      if (r.sinLicenciaDisponible > 0)
        partes.push(`${plural(r.sinLicenciaDisponible, 'alumno quedó', 'alumnos quedaron')} sin licencia porque no hay más disponibles`)
      setAviso(`${partes.join(' · ')}.`)
      setSeleccion(new Set())
      await refrescar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron asignar las licencias.'))
    } finally {
      setAsignandoLote(false)
    }
  }

  async function quitar(alumno: AlumnoCoordinador) {
    await quitarAlumnoDeInstitucion(alumno.id)
    setSeleccion((s) => {
      const nueva = new Set(s)
      nueva.delete(alumno.id)
      return nueva
    })
    setAviso(`${alumno.nombre} ya no pertenece a tu institución.`)
    await refrescar()
  }

  async function regenerarCodigo() {
    const actualizada = await regenerarCodigoInvitacion()
    queryClient.setQueryData(claves.coordinador.institucion, actualizada)
  }

  function alternar(alumnoId: string) {
    setSeleccion((s) => {
      const nueva = new Set(s)
      if (nueva.has(alumnoId)) nueva.delete(alumnoId)
      else nueva.add(alumnoId)
      return nueva
    })
  }

  const visibles = alumnos?.filter((a) => coincide(a, busqueda, filtro)) ?? []
  const todosVisiblesSeleccionados = visibles.length > 0 && visibles.every((a) => seleccion.has(a.id))
  function alternarTodos() {
    setSeleccion((s) => {
      const nueva = new Set(s)
      for (const a of visibles) {
        if (todosVisiblesSeleccionados) nueva.delete(a.id)
        else nueva.add(a.id)
      }
      return nueva
    })
  }

  const sinLicenciasDisponibles = institucion !== null && institucion.licenciasDisponibles <= 0

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        title="Alumnos"
        description="Gestiona los alumnos de tu institución, sus licencias y su actividad."
        actions={
          <Button icon="upload_file" variant="secondary" onClick={() => setImportando(true)}>
            Importar CSV
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}
      {aviso && <Alert tone="success">{aviso}</Alert>}

      {institucion !== null && (
        <section aria-label="Licencias" className="flex flex-col gap-4">
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
          <TarjetaCodigoInvitacion codigo={institucion.codigoInvitacion} onRegenerar={regenerarCodigo} />
        </section>
      )}

      {alumnos === null && !error && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando alumnos..." />
        </Card>
      )}

      {alumnos !== null && alumnos.length === 0 && (
        <Card>
          <EmptyState icon="group" title="Todavía no hay alumnos en tu institución.">
            Comparte el código de invitación o importa un CSV con sus nombres y correos.
          </EmptyState>
        </Card>
      )}

      {alumnos !== null && alumnos.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                type="search"
                aria-label="Buscar alumno"
                placeholder="Buscar por nombre o correo"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="sm:w-72"
              />
              <SegmentedControl options={FILTROS} value={filtro} onChange={setFiltro} ariaLabel="Filtrar alumnos" className="flex-nowrap" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">{plural(seleccion.size, 'seleccionado', 'seleccionados')}</span>
              <Button
                size="sm"
                icon="badge"
                disabled={seleccion.size === 0 || sinLicenciasDisponibles}
                loading={asignandoLote}
                onClick={asignarSeleccionados}
              >
                Asignar licencias
              </Button>
            </div>
          </div>

          <label className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2 text-xs font-semibold text-slate-500">
            <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={todosVisiblesSeleccionados} onChange={alternarTodos} />
            Seleccionar {visibles.length === alumnos.length ? 'todos' : 'los filtrados'} ({visibles.length})
          </label>

          {visibles.length === 0 ? (
            <EmptyState icon="search_off" title="Ningún alumno coincide con la búsqueda." />
          ) : (
            <ul className="list-none divide-y divide-slate-100">
              {visibles.map((alumno) => {
                const enProceso = alumnoEnProceso === alumno.id
                return (
                  <li key={alumno.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar a ${alumno.nombre}`}
                        className="h-4 w-4 shrink-0 accent-primary-600"
                        checked={seleccion.has(alumno.id)}
                        onChange={() => alternar(alumno.id)}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/coordinador/alumnos/${alumno.id}`} className="truncate font-semibold text-slate-900 hover:text-primary-600 hover:underline">
                            {alumno.nombre}
                          </Link>
                          {alumno.licenciaAsignada ? <Badge tone="success">Con licencia</Badge> : <Badge>Sin licencia</Badge>}
                          {alumno.inactivo && <Badge tone="warning">Inactivo</Badge>}
                        </div>
                        <p className="truncate text-sm text-slate-500">{alumno.email}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Última actividad: {formatearFecha(alumno.ultimaActividad)} · {plural(alumno.totalSimulacros, 'simulacro', 'simulacros')} ·
                          Promedio {formatearPuntaje(alumno.puntajePromedio)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 pl-7 lg:pl-0">
                      {alumno.licenciaAsignada ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={enProceso}
                          onClick={() => ejecutar(alumno.id, () => revocarLicencia(alumno.id), 'No se pudo revocar la licencia.')}
                        >
                          Revocar licencia
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          loading={enProceso}
                          disabled={sinLicenciasDisponibles}
                          onClick={() => ejecutar(alumno.id, () => asignarLicencia(alumno.id), 'No se pudo asignar la licencia.')}
                        >
                          Asignar licencia
                        </Button>
                      )}
                      <Button variant="danger" size="sm" icon="person_remove" disabled={enProceso} onClick={() => setAQuitar(alumno)}>
                        Quitar
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}

      {aQuitar && (
        <ConfirmarModal
          titulo="Quitar alumno de la institución"
          etiquetaConfirmar="Quitar alumno"
          onConfirmar={() => quitar(aQuitar)}
          onCerrar={() => setAQuitar(null)}
        >
          <p>
            <strong>{aQuitar.nombre}</strong> dejará de pertenecer a tu institución: se revocará su licencia (si tiene una) y saldrá de
            todas sus secciones. Su cuenta y su historial no se borran.
          </p>
        </ConfirmarModal>
      )}

      {importando && <ImportarAlumnosModal onCerrar={() => setImportando(false)} onImportado={() => void refrescar()} />}
    </div>
  )
}
