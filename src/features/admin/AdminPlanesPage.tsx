import { useEffect, useState } from 'react'
import {
  actualizarPlan,
  crearPlan,
  eliminarPlan,
  listarPlanes,
  type PlanAdmin,
  type TipoPlan,
} from '../../api/adminPlanesApi'
import { ApiError } from '../../api/client'
import './admin.css'

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
}

function aEnteroOpcional(valor: string): number | null {
  return valor.trim() === '' ? null : Number(valor)
}

function formatearLimite(valor: number | null): string {
  return valor === null ? 'Sin limite' : String(valor)
}

export default function AdminPlanesPage() {
  const [planes, setPlanes] = useState<PlanAdmin[] | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<TipoPlan | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)

  const [planEnEdicion, setPlanEnEdicion] = useState<PlanAdmin | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [formulario, setFormulario] = useState<FormularioPlan>(FORMULARIO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    listarPlanes(filtroTipo || undefined)
      .then(setPlanes)
      .catch(() => setError('No se pudieron cargar los planes.'))
  }

  useEffect(cargar, [filtroTipo])

  function abrirCrear() {
    setPlanEnEdicion(null)
    setFormulario(FORMULARIO_VACIO)
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
    })
    setErrorFormulario(null)
    setFormularioAbierto(true)
  }

  function cerrarFormulario() {
    setFormularioAbierto(false)
    setPlanEnEdicion(null)
  }

  async function handleGuardar(evento: React.FormEvent) {
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
      setErrorFormulario(err instanceof ApiError ? err.message : 'No se pudo guardar el plan.')
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
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar el plan.')
    } finally {
      setAccionEnProceso(null)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Planes</h1>
        <button type="button" onClick={abrirCrear}>
          Nuevo plan
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-filtros">
        <select value={filtroTipo} onChange={(evento) => setFiltroTipo(evento.target.value as TipoPlan | '')}>
          <option value="">Todos los tipos</option>
          <option value="ESTUDIANTE">Estudiante</option>
          <option value="DOCENTE">Docente</option>
          <option value="INSTITUCION">Institucion</option>
        </select>
      </div>

      {formularioAbierto && (
        <form className="admin-formulario" onSubmit={handleGuardar}>
          <h2>{planEnEdicion ? 'Editar plan' : 'Nuevo plan'}</h2>
          {errorFormulario && <p className="admin-error">{errorFormulario}</p>}
          <label>
            Nombre
            <input
              value={formulario.nombre}
              onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
              required
            />
          </label>
          {planEnEdicion ? (
            <p className="admin-formulario-nota">
              Tipo: {planEnEdicion.tipo} · Tier: {planEnEdicion.tier} (no editables)
            </p>
          ) : (
            <>
              <label>
                Tipo
                <select
                  value={formulario.tipo}
                  onChange={(evento) => setFormulario({ ...formulario, tipo: evento.target.value as TipoPlan })}
                >
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="INSTITUCION">Institucion</option>
                </select>
              </label>
              <label>
                Tier
                <input value={formulario.tier} onChange={(evento) => setFormulario({ ...formulario, tier: evento.target.value })} required />
              </label>
            </>
          )}
          <label>
            Precio mensual (S/)
            <input
              type="number"
              min="0"
              step="0.01"
              value={formulario.precioMensual}
              onChange={(evento) => setFormulario({ ...formulario, precioMensual: evento.target.value })}
              required
            />
          </label>
          <label>
            Simulacros por mes (vacio = sin limite)
            <input
              type="number"
              min="0"
              value={formulario.simulacrosPorMes}
              onChange={(evento) => setFormulario({ ...formulario, simulacrosPorMes: evento.target.value })}
            />
          </label>
          <label>
            Universidades max (vacio = sin limite)
            <input
              type="number"
              min="0"
              value={formulario.universidadesMax}
              onChange={(evento) => setFormulario({ ...formulario, universidadesMax: evento.target.value })}
            />
          </label>
          <label>
            Alumnos max (vacio = sin limite)
            <input
              type="number"
              min="0"
              value={formulario.alumnosMax}
              onChange={(evento) => setFormulario({ ...formulario, alumnosMax: evento.target.value })}
            />
          </label>
          <label>
            Grupos max (vacio = sin limite)
            <input
              type="number"
              min="0"
              value={formulario.gruposMax}
              onChange={(evento) => setFormulario({ ...formulario, gruposMax: evento.target.value })}
            />
          </label>
          <label className="admin-formulario-checkbox">
            <input
              type="checkbox"
              checked={formulario.rankingHabilitado}
              onChange={(evento) => setFormulario({ ...formulario, rankingHabilitado: evento.target.checked })}
            />
            Ranking habilitado
          </label>
          <label className="admin-formulario-checkbox">
            <input
              type="checkbox"
              checked={formulario.estadisticasAvanzadas}
              onChange={(evento) => setFormulario({ ...formulario, estadisticasAvanzadas: evento.target.checked })}
            />
            Estadisticas avanzadas
          </label>
          <label className="admin-formulario-checkbox">
            <input
              type="checkbox"
              checked={formulario.reportesDescargables}
              onChange={(evento) => setFormulario({ ...formulario, reportesDescargables: evento.target.checked })}
            />
            Reportes descargables
          </label>
          <div className="admin-formulario-acciones">
            <button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={cerrarFormulario} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {planes === null && !error && <p>Cargando planes...</p>}
      {planes !== null && planes.length === 0 && <p>No hay planes que coincidan con este filtro.</p>}

      {planes !== null && planes.length > 0 && (
        <table className="admin-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Tier</th>
              <th>Precio</th>
              <th>Simulacros/mes</th>
              <th>Universidades</th>
              <th>Alumnos</th>
              <th>Grupos</th>
              <th>Features</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {planes.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.nombre}</td>
                <td>{plan.tipo}</td>
                <td>{plan.tier}</td>
                <td>S/ {plan.precioMensual.toFixed(2)}</td>
                <td>{formatearLimite(plan.simulacrosPorMes)}</td>
                <td>{formatearLimite(plan.universidadesMax)}</td>
                <td>{formatearLimite(plan.alumnosMax)}</td>
                <td>{formatearLimite(plan.gruposMax)}</td>
                <td>
                  {[
                    plan.rankingHabilitado && 'Ranking',
                    plan.estadisticasAvanzadas && 'Estadisticas',
                    plan.reportesDescargables && 'Reportes',
                  ]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </td>
                <td className="admin-acciones">
                  <button type="button" disabled={accionEnProceso === plan.id} onClick={() => abrirEditar(plan)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="admin-eliminar"
                    disabled={accionEnProceso === plan.id}
                    onClick={() => handleEliminar(plan)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
