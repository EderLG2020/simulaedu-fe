import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { claves } from '../../../shared/api/claves'
import { mensajeDeError } from '../../../shared/api/client'
import {
  actualizarSeccion,
  agregarAlumnosASeccion,
  descargarReporteSeccion,
  eliminarSeccion,
  listarAlumnos,
  listarDocentes,
  obtenerSeccion,
  quitarAlumnoDeSeccion,
  type SeccionInput,
} from '../api/coordinadorApi'
import { Alert, Badge, Button, buttonClasses, Card, EmptyState, Icon, Input, PageHeader, StatCard } from '../../../shared/components/ui'
import { plural } from '../../../shared/lib/formato'
import BotonReporte from '../components/BotonReporte'
import ConfirmarModal from '../components/ConfirmarModal'
import SeccionFormModal from '../components/SeccionFormModal'
import { formatearPuntaje } from '../lib/formato'

function EncabezadoBloque({ icono, titulo }: { icono: string; titulo: string }) {
  return (
    <h2 className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 font-display text-base font-semibold text-slate-900">
      <Icon name={icono} size={20} className="text-primary-600" />
      {titulo}
    </h2>
  )
}

export default function CoordinadorSeccionDetallePage() {
  const { id: seccionId = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const consulta = useQuery({ queryKey: claves.coordinador.seccion(seccionId), queryFn: () => obtenerSeccion(seccionId) })
  const consultaAlumnos = useQuery({ queryKey: claves.coordinador.alumnos, queryFn: listarAlumnos })
  const consultaDocentes = useQuery({ queryKey: claves.coordinador.docentes, queryFn: listarDocentes })
  const detalle = consulta.data ?? null

  const [errorAccion, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [alumnoEnProceso, setAlumnoEnProceso] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [agregando, setAgregando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  function refrescar() {
    return queryClient.invalidateQueries({ queryKey: claves.coordinador.todo })
  }

  async function guardar(datos: SeccionInput) {
    await actualizarSeccion(seccionId, datos)
    await refrescar()
  }

  async function eliminar() {
    await eliminarSeccion(seccionId)
    navigate('/coordinador/secciones')
    queryClient.removeQueries({ queryKey: claves.coordinador.seccion(seccionId) })
    void refrescar()
  }

  async function quitar(alumnoId: string) {
    setError(null)
    setAlumnoEnProceso(alumnoId)
    try {
      await quitarAlumnoDeSeccion(seccionId, alumnoId)
      await refrescar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo quitar al alumno de la sección.'))
    } finally {
      setAlumnoEnProceso(null)
    }
  }

  async function agregarSeleccionados() {
    setError(null)
    setAgregando(true)
    try {
      const actualizado = await agregarAlumnosASeccion(seccionId, [...seleccion])
      queryClient.setQueryData(claves.coordinador.seccion(seccionId), actualizado)
      setSeleccion(new Set())
      await refrescar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron agregar los alumnos.'))
    } finally {
      setAgregando(false)
    }
  }

  function alternar(alumnoId: string) {
    setSeleccion((s) => {
      const nueva = new Set(s)
      if (nueva.has(alumnoId)) nueva.delete(alumnoId)
      else nueva.add(alumnoId)
      return nueva
    })
  }

  const enSeccion = new Set(detalle?.alumnos.map((a) => a.id) ?? [])
  const texto = busqueda.trim().toLowerCase()
  const disponibles =
    consultaAlumnos.data?.filter(
      (a) => !enSeccion.has(a.id) && (!texto || a.nombre.toLowerCase().includes(texto) || a.email.toLowerCase().includes(texto)),
    ) ?? []
  const inactivos = detalle?.alumnos.filter((a) => a.inactivo).length ?? 0
  const seccion = detalle?.seccion

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to="/coordinador/secciones" className={buttonClasses('ghost', 'sm', '-ml-3 self-start')}>
          &larr; Volver a secciones
        </Link>
        <PageHeader
          title={seccion?.nombre ?? 'Sección'}
          description={seccion ? `Docente a cargo: ${seccion.docenteNombre}` : undefined}
          actions={
            seccion && (
              <>
                <Button variant="secondary" icon="edit" onClick={() => setEditando(true)} disabled={!consultaDocentes.isSuccess}>
                  Editar
                </Button>
                <Button variant="danger" icon="delete" onClick={() => setEliminando(true)}>
                  Eliminar
                </Button>
              </>
            )
          }
        />
      </div>

      {errorAccion && <Alert>{errorAccion}</Alert>}
      {consulta.isError && <Alert>{mensajeDeError(consulta.error, 'No se pudo cargar la sección.')}</Alert>}
      {consulta.isPending && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando sección..." />
        </Card>
      )}

      {detalle && seccion && (
        <>
          <section aria-label="Indicadores de la sección" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Alumnos" value={seccion.totalAlumnos} icon="group" />
            <StatCard label="Puntaje promedio" value={formatearPuntaje(seccion.puntajePromedio)} icon="grade" tone="success" />
            <StatCard label="Inactivos" value={inactivos} icon="event_busy" tone={inactivos > 0 ? 'warning' : 'neutral'} hint="Sin simulacros en 7 días" />
          </section>

          <Card className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm text-slate-700">
            <Icon name="description" size={20} className="text-primary-600" />
            <span>Reporte de la sección:</span>
            <BotonReporte nombreBase={seccion.nombre} descargar={(formato) => descargarReporteSeccion(seccionId, formato)} />
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="overflow-hidden lg:col-span-3">
              <EncabezadoBloque icono="group" titulo={`Alumnos de la sección (${detalle.alumnos.length})`} />
              {detalle.alumnos.length === 0 ? (
                <EmptyState icon="group" title="Esta sección todavía no tiene alumnos." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {detalle.alumnos.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/coordinador/alumnos/${a.id}`} className="truncate font-medium text-slate-900 hover:text-primary-600 hover:underline">
                            {a.nombre}
                          </Link>
                          {a.inactivo && <Badge tone="warning">Inactivo</Badge>}
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {a.email} · {plural(a.totalSimulacros, 'simulacro', 'simulacros')} · Promedio {formatearPuntaje(a.puntajePromedio)}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        icon="person_remove"
                        loading={alumnoEnProceso === a.id}
                        onClick={() => quitar(a.id)}
                        aria-label={`Quitar a ${a.nombre} de la sección`}
                      >
                        Quitar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="flex flex-col overflow-hidden lg:col-span-2">
              <EncabezadoBloque icono="person_add" titulo="Agregar alumnos" />
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3">
                <Input
                  type="search"
                  aria-label="Buscar alumno para agregar"
                  placeholder="Buscar por nombre o correo"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                <Button size="sm" icon="person_add" disabled={seleccion.size === 0} loading={agregando} onClick={agregarSeleccionados}>
                  Agregar {seleccion.size > 0 ? plural(seleccion.size, 'alumno', 'alumnos') : 'seleccionados'}
                </Button>
              </div>
              {consultaAlumnos.isError && <Alert className="m-4">No se pudo cargar la lista de alumnos de la institución.</Alert>}
              {consultaAlumnos.isSuccess && disponibles.length === 0 ? (
                <EmptyState icon="group" title={texto ? 'Ningún alumno coincide con la búsqueda.' : 'Todos los alumnos de la institución ya están en esta sección.'} />
              ) : (
                <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                  {disponibles.map((a) => (
                    <li key={a.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-5 py-2.5 hover:bg-slate-50/60">
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 accent-primary-600"
                          checked={seleccion.has(a.id)}
                          onChange={() => alternar(a.id)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900">{a.nombre}</span>
                          <span className="block truncate text-xs text-slate-500">{a.email}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      {editando && seccion && consultaDocentes.data && (
        <SeccionFormModal
          titulo="Editar sección"
          inicial={{ nombre: seccion.nombre, docenteId: seccion.docenteId }}
          docentes={consultaDocentes.data}
          onGuardar={guardar}
          onCerrar={() => setEditando(false)}
        />
      )}

      {eliminando && seccion && (
        <ConfirmarModal titulo="Eliminar sección" etiquetaConfirmar="Eliminar sección" onConfirmar={eliminar} onCerrar={() => setEliminando(false)}>
          <p>
            Se eliminará la sección <strong>{seccion.nombre}</strong>. Sus alumnos siguen en la institución y conservan su historial; el
            docente dejará de ver este grupo.
          </p>
        </ConfirmarModal>
      )}
    </div>
  )
}
