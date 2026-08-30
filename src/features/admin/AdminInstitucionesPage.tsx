import { useEffect, useState } from 'react'
import {
  actualizarInstitucion,
  asignarLicencias,
  crearInstitucion,
  listarInstituciones,
  type InstitucionAdmin,
  type TipoInstitucion,
} from '../../api/adminInstitucionesApi'
import { ApiError } from '../../api/client'
import './admin.css'

interface FormularioInstitucion {
  nombre: string
  tipo: TipoInstitucion
}

const FORMULARIO_VACIO: FormularioInstitucion = { nombre: '', tipo: 'ACADEMIA' }

export default function AdminInstitucionesPage() {
  const [instituciones, setInstituciones] = useState<InstitucionAdmin[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)
  const [errorLicencias, setErrorLicencias] = useState<Record<string, string>>({})

  const [institucionEnEdicion, setInstitucionEnEdicion] = useState<InstitucionAdmin | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [formulario, setFormulario] = useState<FormularioInstitucion>(FORMULARIO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    listarInstituciones()
      .then(setInstituciones)
      .catch(() => setError('No se pudieron cargar las instituciones.'))
  }

  useEffect(cargar, [])

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

  async function handleGuardar(evento: React.FormEvent) {
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
      setErrorFormulario(err instanceof ApiError ? err.message : 'No se pudo guardar la institucion.')
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
      const mensaje = err instanceof ApiError ? err.message : 'No se pudo actualizar las licencias.'
      setErrorLicencias((previo) => ({ ...previo, [institucion.id]: mensaje }))
    } finally {
      setAccionEnProceso(null)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Instituciones</h1>
        <button type="button" onClick={abrirCrear}>
          Nueva institucion
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {formularioAbierto && (
        <form className="admin-formulario" onSubmit={handleGuardar}>
          <h2>{institucionEnEdicion ? 'Editar institucion' : 'Nueva institucion'}</h2>
          {errorFormulario && <p className="admin-error">{errorFormulario}</p>}
          <label>
            Nombre
            <input
              value={formulario.nombre}
              onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
              required
            />
          </label>
          <label>
            Tipo
            <select
              value={formulario.tipo}
              onChange={(evento) => setFormulario({ ...formulario, tipo: evento.target.value as TipoInstitucion })}
            >
              <option value="ACADEMIA">Academia</option>
              <option value="COLEGIO">Colegio</option>
            </select>
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

      {instituciones === null && !error && <p>Cargando instituciones...</p>}
      {instituciones !== null && instituciones.length === 0 && <p>No hay instituciones registradas.</p>}

      {instituciones !== null && instituciones.length > 0 && (
        <table className="admin-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Licencias usadas</th>
              <th>Licencias totales</th>
              <th>Disponibles</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {instituciones.map((institucion) => (
              <tr key={institucion.id}>
                <td>{institucion.nombre}</td>
                <td>{institucion.tipo}</td>
                <td>{institucion.licenciasUsadas}</td>
                <td>{institucion.licenciasTotales}</td>
                <td>{institucion.licenciasDisponibles}</td>
                <td className="admin-acciones admin-acciones-licencias">
                  <button type="button" disabled={accionEnProceso === institucion.id} onClick={() => abrirEditar(institucion)}>
                    Editar
                  </button>
                  <form
                    className="admin-form-licencias"
                    onSubmit={(evento) => {
                      evento.preventDefault()
                      const input = evento.currentTarget.elements.namedItem('licencias') as HTMLInputElement
                      handleAsignarLicencias(institucion, input.value)
                    }}
                  >
                    <input
                      key={`${institucion.id}-${institucion.licenciasTotales}`}
                      name="licencias"
                      type="number"
                      min="0"
                      defaultValue={institucion.licenciasTotales}
                      disabled={accionEnProceso === institucion.id}
                    />
                    <button type="submit" disabled={accionEnProceso === institucion.id}>
                      Actualizar licencias
                    </button>
                  </form>
                  {errorLicencias[institucion.id] && <p className="admin-error admin-error-fila">{errorLicencias[institucion.id]}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
