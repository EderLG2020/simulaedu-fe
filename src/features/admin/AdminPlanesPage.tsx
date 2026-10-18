import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { claves } from '../../api/claves'
import { actualizarPlan, crearPlan, eliminarPlan, listarPlanes, type PlanAdmin, type TipoPlan } from '../../api/adminPlanesApi'
import { mensajeDeError } from '../../api/client'
import { Alert, Badge, Button, Card, cn, EmptyState, Field, FieldGroup, Icon, Input, PageHeader, Select, StatCard } from '../../components/ui'

/** Migracion 1:1 del mockup de Stitch (antes en public/, ya eliminado): tarjetas de precio +
 * panel de edicion persistente a la derecha, en vez de la tabla plana de antes. Las metricas de
 * marketing del mockup (MRR estimado, conversion free-to-pro, pasarela Izipay activa, banner
 * "estrategia admision") no se migraron - ningun endpoint las respalda hoy. */

const TABS: { tipo: TipoPlan; label: string; icono: string }[] = [
  { tipo: 'ESTUDIANTE', label: 'Estudiante', icono: 'school' },
  { tipo: 'DOCENTE', label: 'Docente', icono: 'menu_book' },
  { tipo: 'INSTITUCION', label: 'Institución', icono: 'corporate_fare' },
]

interface FormularioPlan {
  nombre: string
  tipo: TipoPlan
  tier: string
  precioMensual: string
  simulacrosPorMes: string
  universidadesMax: string
  alumnosMax: string
  gruposMax: string
  rankingHabilitado: boolean
  estadisticasAvanzadas: boolean
  reportesDescargables: boolean
  programasExtra: boolean
}

const FORMULARIO_VACIO: FormularioPlan = {
  nombre: '',
  tipo: 'ESTUDIANTE',
  tier: '',
  precioMensual: '0',
  simulacrosPorMes: '',
  universidadesMax: '',
  alumnosMax: '',
  gruposMax: '',
  rankingHabilitado: false,
  estadisticasAvanzadas: false,
  reportesDescargables: false,
  programasExtra: false,
}

function aEnteroOpcional(valor: string): number | null {
  return valor.trim() === '' ? null : Number(valor)
}

function formatearLimite(valor: number | null, unidad: string): string {
  return valor === null ? 'Sin límite' : `${valor} ${unidad}`
}

function FeatureRow({ activo, label }: { activo: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon name={activo ? 'check_circle' : 'cancel'} className={activo ? 'text-emerald-600' : 'text-slate-300'} />
      <span className={activo ? 'font-medium text-slate-700' : 'text-slate-400 line-through'}>{label}</span>
    </div>
  )
}

function LimiteRow({ icono, children }: { icono: string; children: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon name={icono} size={16} className="text-slate-400" />
      {children}
    </span>
  )
}

/** Interruptor de modulo (checkbox con label en fila). */
function ModuloCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (valor: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50">
      {label}
      <input type="checkbox" checked={checked} onChange={(evento) => onChange(evento.target.checked)} className="h-4 w-4 accent-primary-600" />
    </label>
  )
}

export default function AdminPlanesPage() {
  const consulta = useQuery({ queryKey: claves.admin.planes, queryFn: () => listarPlanes() })
  const planes = consulta.data ?? null
  const [tipoActivo, setTipoActivo] = useState<TipoPlan>('ESTUDIANTE')
  const [errorAccion, setError] = useState<string | null>(null)
  const error = errorAccion ?? (consulta.isError ? 'No se pudieron cargar los planes.' : null)
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)

  const [planEnEdicion, setPlanEnEdicion] = useState<PlanAdmin | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [formulario, setFormulario] = useState<FormularioPlan>(FORMULARIO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    void consulta.refetch()
  }

  const planesDelTipo = useMemo(() => planes?.filter((p) => p.tipo === tipoActivo) ?? null, [planes, tipoActivo])

  function abrirCrear() {
    setPlanEnEdicion(null)
    setFormulario({ ...FORMULARIO_VACIO, tipo: tipoActivo })
    setErrorFormulario(null)
    setFormularioAbierto(true)
  }

  function abrirEditar(plan: PlanAdmin) {
    setPlanEnEdicion(plan)
    setFormulario({
      nombre: plan.nombre,
      tipo: plan.tipo,
      tier: plan.tier,
      precioMensual: String(plan.precioMensual),
      simulacrosPorMes: plan.simulacrosPorMes === null ? '' : String(plan.simulacrosPorMes),
      universidadesMax: plan.universidadesMax === null ? '' : String(plan.universidadesMax),
      alumnosMax: plan.alumnosMax === null ? '' : String(plan.alumnosMax),
      gruposMax: plan.gruposMax === null ? '' : String(plan.gruposMax),
      rankingHabilitado: plan.rankingHabilitado,
      estadisticasAvanzadas: plan.estadisticasAvanzadas,
      reportesDescargables: plan.reportesDescargables,
      programasExtra: plan.programasExtra,
    })
    setErrorFormulario(null)
    setFormularioAbierto(true)
  }

  function cerrarFormulario() {
    setFormularioAbierto(false)
    setPlanEnEdicion(null)
  }

  async function handleGuardar(evento: FormEvent) {
    evento.preventDefault()
    setErrorFormulario(null)

    const camposComunes = {
      nombre: formulario.nombre,
      precioMensual: Number(formulario.precioMensual),
      simulacrosPorMes: aEnteroOpcional(formulario.simulacrosPorMes),
      universidadesMax: aEnteroOpcional(formulario.universidadesMax),
      alumnosMax: aEnteroOpcional(formulario.alumnosMax),
      gruposMax: aEnteroOpcional(formulario.gruposMax),
      rankingHabilitado: formulario.rankingHabilitado,
      estadisticasAvanzadas: formulario.estadisticasAvanzadas,
      reportesDescargables: formulario.reportesDescargables,
      programasExtra: formulario.programasExtra,
    }

    setGuardando(true)
    try {
      if (planEnEdicion) {
        await actualizarPlan(planEnEdicion.id, camposComunes)
      } else {
        await crearPlan({ ...camposComunes, tipo: formulario.tipo, tier: formulario.tier })
      }
      cerrarFormulario()
      cargar()
    } catch (err) {
      setErrorFormulario(mensajeDeError(err, 'No se pudo guardar el plan.'))
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(plan: PlanAdmin) {
    if (!window.confirm(`¿Eliminar el plan "${plan.nombre}"? Esta accion no se puede deshacer.`)) return

    setError(null)
    setAccionEnProceso(plan.id)
    try {
      await eliminarPlan(plan.id)
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar el plan.'))
    } finally {
      setAccionEnProceso(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        title="Gestión de Planes y Suscripciones"
        description="Configuración de tiers, límites de simulacros y precios comerciales para la plataforma."
        actions={
          <Button icon="add" onClick={abrirCrear}>
            Nuevo plan
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {planes && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Planes configurados" value={planes.length} icon="sell" />
        </div>
      )}

      {/* Pestanas por tipo con contador: SegmentedControl solo acepta label de texto, por eso va local. */}
      <div className="flex w-fit flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
        {TABS.map((tab) => {
          const count = planes?.filter((p) => p.tipo === tab.tipo).length ?? 0
          const activo = tab.tipo === tipoActivo
          return (
            <button
              key={tab.tipo}
              type="button"
              aria-pressed={activo}
              onClick={() => setTipoActivo(tab.tipo)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                'focus-visible:outline-2 focus-visible:outline-primary-600',
                activo ? 'bg-white text-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              <Icon name={tab.icono} size={16} />
              {tab.label}
              <Badge tone={activo ? 'primary' : 'neutral'}>{count}</Badge>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8 xl:grid-cols-3">
          {planesDelTipo === null && !error && (
            <Card className="col-span-full">
              <EmptyState icon="hourglass_empty" title="Cargando planes..." />
            </Card>
          )}
          {planesDelTipo !== null && planesDelTipo.length === 0 && (
            <Card className="col-span-full">
              <EmptyState icon="sell" title="No hay planes de este tipo todavía." />
            </Card>
          )}
          {planesDelTipo?.map((plan) => (
            <Card key={plan.id} className="flex flex-col gap-4 p-5">
              <div>
                <Badge tone="primary">Tier {plan.tier}</Badge>
                <h3 className="mt-2 font-display text-lg font-bold text-slate-900">{plan.nombre}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold text-slate-900">S/ {plan.precioMensual.toFixed(2)}</span>
                  <span className="text-xs text-slate-400">/mes</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <LimiteRow icono="bolt">{formatearLimite(plan.simulacrosPorMes, 'simulacros/mes')}</LimiteRow>
                <LimiteRow icono="account_balance">{formatearLimite(plan.universidadesMax, 'universidades')}</LimiteRow>
                <LimiteRow icono="groups">{formatearLimite(plan.alumnosMax, 'alumnos')}</LimiteRow>
                <LimiteRow icono="diversity_3">{formatearLimite(plan.gruposMax, 'grupos')}</LimiteRow>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                <FeatureRow activo={plan.rankingHabilitado} label="Ranking nacional" />
                <FeatureRow activo={plan.estadisticasAvanzadas} label="Estadísticas avanzadas" />
                <FeatureRow activo={plan.reportesDescargables} label="Reportes descargables" />
                <FeatureRow activo={plan.programasExtra} label="Idiomas y tecnología" />
              </div>

              <div className="mt-auto flex items-center gap-2 pt-2">
                <Button variant="secondary" size="sm" className="flex-1" disabled={accionEnProceso === plan.id} onClick={() => abrirEditar(plan)}>
                  Editar plan
                </Button>
                <Button
                  variant="danger"
                  size="icon"
                  title="Eliminar plan"
                  aria-label="Eliminar plan"
                  disabled={accionEnProceso === plan.id}
                  onClick={() => handleEliminar(plan)}
                >
                  <Icon name="delete" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden lg:sticky lg:top-8 lg:col-span-4">
          {!formularioAbierto ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
              <Icon name="tune" size={32} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Elige "Editar plan" en una tarjeta, o crea uno nuevo, para configurarlo aquí.</p>
            </div>
          ) : (
            <form onSubmit={handleGuardar} className="flex flex-col">
              <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Icon name="sell" size={20} />
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-500">Configuración comercial</span>
                  <div className="truncate font-display text-base font-bold text-slate-900">{planEnEdicion ? `Editar: ${planEnEdicion.nombre}` : 'Nuevo plan'}</div>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5">
                {errorFormulario && <Alert>{errorFormulario}</Alert>}

                {planEnEdicion ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                    <Icon name="lock" size={16} className="mt-px" />
                    <span>
                      El <strong>tipo</strong> y <strong>tier</strong> ({planEnEdicion.tipo} / {planEnEdicion.tier}) no son editables tras crear el plan.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tipo de plan">
                      <Select value={formulario.tipo} onChange={(evento) => setFormulario({ ...formulario, tipo: evento.target.value as TipoPlan })}>
                        <option value="ESTUDIANTE">Estudiante</option>
                        <option value="DOCENTE">Docente</option>
                        <option value="INSTITUCION">Institución</option>
                      </Select>
                    </Field>
                    <Field label="Tier interno">
                      <Input value={formulario.tier} onChange={(evento) => setFormulario({ ...formulario, tier: evento.target.value })} required />
                    </Field>
                  </div>
                )}

                <Field label="Nombre comercial público">
                  <Input value={formulario.nombre} onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })} required />
                </Field>

                <Field label="Precio mensual (S/)">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.precioMensual}
                    onChange={(evento) => setFormulario({ ...formulario, precioMensual: evento.target.value })}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Simulacros/mes (vacío = sin límite)">
                    <Input type="number" min="0" value={formulario.simulacrosPorMes} onChange={(evento) => setFormulario({ ...formulario, simulacrosPorMes: evento.target.value })} />
                  </Field>
                  <Field label="Universidades máx.">
                    <Input type="number" min="0" value={formulario.universidadesMax} onChange={(evento) => setFormulario({ ...formulario, universidadesMax: evento.target.value })} />
                  </Field>
                  <Field label="Alumnos máx.">
                    <Input type="number" min="0" value={formulario.alumnosMax} onChange={(evento) => setFormulario({ ...formulario, alumnosMax: evento.target.value })} />
                  </Field>
                  <Field label="Grupos máx.">
                    <Input type="number" min="0" value={formulario.gruposMax} onChange={(evento) => setFormulario({ ...formulario, gruposMax: evento.target.value })} />
                  </Field>
                </div>

                <FieldGroup label="Módulos y permisos avanzados">
                  <ModuloCheckbox
                    label="Ranking nacional"
                    checked={formulario.rankingHabilitado}
                    onChange={(rankingHabilitado) => setFormulario({ ...formulario, rankingHabilitado })}
                  />
                  <ModuloCheckbox
                    label="Estadísticas avanzadas"
                    checked={formulario.estadisticasAvanzadas}
                    onChange={(estadisticasAvanzadas) => setFormulario({ ...formulario, estadisticasAvanzadas })}
                  />
                  <ModuloCheckbox
                    label="Reportes descargables"
                    checked={formulario.reportesDescargables}
                    onChange={(reportesDescargables) => setFormulario({ ...formulario, reportesDescargables })}
                  />
                  <ModuloCheckbox
                    label="Idiomas y tecnología"
                    checked={formulario.programasExtra}
                    onChange={(programasExtra) => setFormulario({ ...formulario, programasExtra })}
                  />
                </FieldGroup>

                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" className="flex-1" loading={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
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
