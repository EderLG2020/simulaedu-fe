import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import {
  actualizarInstitucion,
  asignarLicencias,
  crearInstitucion,
  listarInstituciones,
  type InstitucionAdmin,
  type TipoInstitucion,
} from '../../api/adminInstitucionesApi'
import { claves } from '../../api/claves'
import { mensajeDeError } from '../../api/client'
import { Alert, Button, Card, cn, EmptyState, Field, FieldGroup, Icon, Input, PageHeader, SegmentedControl, StatCard } from '../../components/ui'

/** Migracion 1:1 del mockup de Stitch (antes en public/, ya eliminado). Las tarjetas de
 * licencias (totales/asignadas/disponibles) SI son reales - agregadas en el cliente sobre
 * las instituciones ya cargadas, no inventadas. El widget "Actividad simulacros B2B en tiempo
 * real" y los campos "correo del coordinador"/"sede principal" del formulario del mockup no se
 * migraron: no hay ningun endpoint ni campo que los respalde (crear/editar solo acepta
 * nombre + tipo). */

interface FormularioInstitucion {
  nombre: string
  tipo: TipoInstitucion
}

const FORMULARIO_VACIO: FormularioInstitucion = { nombre: '', tipo: 'ACADEMIA' }

const OPCIONES_FILTRO: { value: TipoInstitucion | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'COLEGIO', label: 'Colegios' },
  { value: 'ACADEMIA', label: 'Academias' },
]

const OPCIONES_TIPO: { value: TipoInstitucion; label: string }[] = [
  { value: 'COLEGIO', label: 'Colegio' },
  { value: 'ACADEMIA', label: 'Academia' },
]

function iniciales(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase()
}

function porcentaje(usadas: number, totales: number): number {
  return totales === 0 ? 0 : Math.round((usadas / totales) * 100)
}

export default function AdminInstitucionesPage() {
  const consulta = useQuery({ queryKey: claves.admin.instituciones, queryFn: listarInstituciones })
  const instituciones = consulta.data ?? null
  const [filtroTipo, setFiltroTipo] = useState<TipoInstitucion | ''>('')
  const [busqueda, setBusqueda] = useState('')
  const error = consulta.isError ? 'No se pudieron cargar las instituciones.' : null
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)
  const [errorLicencias, setErrorLicencias] = useState<Record<string, string>>({})

  const [institucionEnEdicion, setInstitucionEnEdicion] = useState<InstitucionAdmin | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [formulario, setFormulario] = useState<FormularioInstitucion>(FORMULARIO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    void consulta.refetch()
  }

  const filtradas = useMemo(() => {
    if (!instituciones) return null
    const q = busqueda.trim().toLowerCase()
    return instituciones.filter((i) => (filtroTipo === '' || i.tipo === filtroTipo) && (q === '' || i.nombre.toLowerCase().includes(q)))
  }, [instituciones, filtroTipo, busqueda])

  const totales = useMemo(() => {
    if (!instituciones) return null
    return instituciones.reduce(
      (acc, i) => ({
        totales: acc.totales + i.licenciasTotales,
        usadas: acc.usadas + i.licenciasUsadas,
        disponibles: acc.disponibles + i.licenciasDisponibles,
      }),
      { totales: 0, usadas: 0, disponibles: 0 },
    )
  }, [instituciones])

  function abrirCrear() {
    setInstitucionEnEdicion(null)
    setFormulario(FORMULARIO_VACIO)
    setErrorFormulario(null)
    setFormularioAbierto(true)
  }

  function abrirEditar(institucion: InstitucionAdmin) {
    setInstitucionEnEdicion(institucion)
    setFormulario({ nombre: institucion.nombre, tipo: institucion.tipo })
    setErrorFormulario(null)
    setFormularioAbierto(true)
  }

  function cerrarFormulario() {
    setFormularioAbierto(false)
    setInstitucionEnEdicion(null)
  }

  async function handleGuardar(evento: FormEvent) {
    evento.preventDefault()
    setErrorFormulario(null)

    setGuardando(true)
    try {
      if (institucionEnEdicion) {
        await actualizarInstitucion(institucionEnEdicion.id, formulario)
      } else {
        await crearInstitucion(formulario)
      }
      cerrarFormulario()
      cargar()
    } catch (err) {
      setErrorFormulario(mensajeDeError(err, 'No se pudo guardar la institucion.'))
    } finally {
      setGuardando(false)
    }
  }

  async function handleAsignarLicencias(institucion: InstitucionAdmin, valor: string) {
    const licenciasTotales = Number(valor)
    setErrorLicencias((previo) => ({ ...previo, [institucion.id]: '' }))
    setAccionEnProceso(institucion.id)
    try {
      await asignarLicencias(institucion.id, licenciasTotales)
      cargar()
    } catch (err) {
      const mensaje = mensajeDeError(err, 'No se pudo actualizar las licencias.')
      setErrorLicencias((previo) => ({ ...previo, [institucion.id]: mensaje }))
    } finally {
      setAccionEnProceso(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        title="Gestión de Instituciones"
        description="Control de colegios, academias preuniversitarias y asignación de licencias de simulacros."
        actions={
          <Button icon="add" onClick={abrirCrear}>
            Nueva institución
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {instituciones && totales && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Instituciones activas" value={instituciones.length} icon="account_balance" />
          <StatCard label="Licencias totales" value={totales.totales.toLocaleString('es-PE')} icon="assignment" tone="neutral" />
          <StatCard
            label="Licencias asignadas"
            value={totales.usadas.toLocaleString('es-PE')}
            icon="person_check"
            hint={`${porcentaje(totales.usadas, totales.totales)}% ocupación`}
          />
          <StatCard label="Licencias disponibles" value={totales.disponibles.toLocaleString('es-PE')} icon="verified_user" tone="success" />
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Card className="flex flex-col overflow-hidden lg:col-span-8">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input aria-label="Filtrar por nombre" className="pl-9" placeholder="Filtrar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <SegmentedControl options={OPCIONES_FILTRO} value={filtroTipo} onChange={setFiltroTipo} />
          </div>

          {filtradas === null && !error && <EmptyState icon="hourglass_empty" title="Cargando instituciones..." />}
          {filtradas !== null && filtradas.length === 0 && <EmptyState icon="domain" title="No hay instituciones que coincidan." />}

          {filtradas !== null && filtradas.length > 0 && (
            <div className="divide-y divide-slate-100">
              {filtradas.map((institucion) => {
                const ocupacion = porcentaje(institucion.licenciasUsadas, institucion.licenciasTotales)
                const ocupada = accionEnProceso === institucion.id
                return (
                  <div key={institucion.id} className="flex flex-col gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50/60 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 font-display font-bold text-primary-600">
                      {iniciales(institucion.nombre)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-900">{institucion.nombre}</div>
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <span className={cn('h-2 w-2 rounded-full', institucion.tipo === 'COLEGIO' ? 'bg-primary-500' : 'bg-violet-500')} />
                        {institucion.tipo === 'COLEGIO' ? 'Colegio' : 'Academia'}
                      </span>
                    </div>
                    <div className="w-full shrink-0 sm:w-48">
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {institucion.licenciasUsadas} / {institucion.licenciasTotales}
                        </span>
                        <span className="font-semibold text-slate-700">{ocupacion}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className={cn('h-full rounded-full', ocupacion >= 90 ? 'bg-accent-500' : 'bg-primary-600')} style={{ width: `${Math.min(100, ocupacion)}%` }} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button variant="ghost" size="sm" icon="edit" disabled={ocupada} onClick={() => abrirEditar(institucion)}>
                        Editar
                      </Button>
                      <form
                        className="flex items-center gap-1.5"
                        onSubmit={(evento) => {
                          evento.preventDefault()
                          const input = evento.currentTarget.elements.namedItem('licencias') as HTMLInputElement
                          handleAsignarLicencias(institucion, input.value)
                        }}
                      >
                        <Input
                          key={`${institucion.id}-${institucion.licenciasTotales}`}
                          name="licencias"
                          type="number"
                          min="0"
                          aria-label={`Licencias totales de ${institucion.nombre}`}
                          defaultValue={institucion.licenciasTotales}
                          disabled={ocupada}
                          className="h-8 w-20 px-2 text-xs"
                        />
                        <Button type="submit" variant="secondary" size="sm" disabled={ocupada}>
                          Actualizar
                        </Button>
                      </form>
                    </div>
                    {errorLicencias[institucion.id] && <p className="basis-full text-xs font-medium text-rose-600">{errorLicencias[institucion.id]}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden lg:sticky lg:top-8 lg:col-span-4">
          {!formularioAbierto ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
              <Icon name="domain_add" size={32} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Elige "Editar" en una institución, o crea una nueva, para configurarla aquí.</p>
            </div>
          ) : (
            <form onSubmit={handleGuardar} className="flex flex-col">
              <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Icon name="account_balance" size={20} />
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-500">B2B Educativo</span>
                  <div className="truncate font-display text-base font-bold text-slate-900">
                    {institucionEnEdicion ? `Editar: ${institucionEnEdicion.nombre}` : 'Registrar nueva institución'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5">
                {errorFormulario && <Alert>{errorFormulario}</Alert>}

                <Field label="Nombre de la institución">
                  <Input value={formulario.nombre} onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })} required />
                </Field>

                <FieldGroup label="Tipo de entidad">
                  <SegmentedControl options={OPCIONES_TIPO} value={formulario.tipo} onChange={(tipo) => setFormulario({ ...formulario, tipo })} />
                </FieldGroup>

                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" className="flex-1" loading={guardando}>
                    {guardando ? 'Guardando...' : institucionEnEdicion ? 'Guardar cambios' : 'Registrar institución'}
                  </Button>
                  <Button variant="secondary" onClick={cerrarFormulario} disabled={guardando}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
