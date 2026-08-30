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
import { useAuth } from '../../hooks/useAuth'
import './coordinador.css'

export default function CoordinadorPage() {
  const { cerrarSesion } = useAuth()
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
    <div className="coordinador-page">
      <header className="coordinador-header">
        <h1>Panel de coordinador</h1>
        <button type="button" className="coordinador-cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </header>

      {error && <p className="coordinador-error">{error}</p>}

      {institucion === null && !error && <p>Cargando institucion...</p>}

      {institucion !== null && (
        <section className="coordinador-resumen">
          <h2>{institucion.nombre}</h2>
          <div className="coordinador-licencias">
            <div>
              <span className="coordinador-licencia-valor">{institucion.licenciasUsadas}</span>
              <span className="coordinador-licencia-etiqueta">usadas</span>
            </div>
            <div>
              <span className="coordinador-licencia-valor">{institucion.licenciasDisponibles}</span>
              <span className="coordinador-licencia-etiqueta">disponibles</span>
            </div>
            <div>
              <span className="coordinador-licencia-valor">{institucion.licenciasTotales}</span>
              <span className="coordinador-licencia-etiqueta">contratadas</span>
            </div>
          </div>
        </section>
      )}

      {alumnos !== null && alumnos.length === 0 && <p>Todavia no hay alumnos asignados a tu institucion.</p>}

      {alumnos !== null && alumnos.length > 0 && (
        <ul className="coordinador-lista">
          {alumnos.map((alumno) => (
            <li key={alumno.id} className="coordinador-alumno">
              <div>
                <h3>{alumno.nombre}</h3>
                <p className="coordinador-alumno-email">{alumno.email}</p>
              </div>
              {alumno.licenciaAsignada ? (
                <button
                  type="button"
                  className="coordinador-revocar"
                  disabled={alumnoEnProceso === alumno.id}
                  onClick={() => handleRevocar(alumno)}
                >
                  {alumnoEnProceso === alumno.id ? 'Revocando...' : 'Revocar licencia'}
                </button>
              ) : (
                <button
                  type="button"
                  className="coordinador-asignar"
                  disabled={alumnoEnProceso === alumno.id || sinLicenciasDisponibles}
                  onClick={() => handleAsignar(alumno)}
                >
                  {alumnoEnProceso === alumno.id ? 'Asignando...' : 'Asignar licencia'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
