import { Link, useLocation, useParams } from 'react-router-dom'
import type { ResumenSimulacro } from '../../api/simulacrosApi'
import './resumen.css'

interface EstadoUbicacion {
  resumen?: ResumenSimulacro
}

export default function ResumenSimulacroPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const resumen = (location.state as EstadoUbicacion | null)?.resumen

  if (!resumen) {
    return (
      <div className="resumen-page">
        <p>No hay un resumen disponible para el simulacro {id}.</p>
        <Link to="/examenes">Volver a examenes</Link>
      </div>
    )
  }

  return (
    <div className="resumen-page">
      <h1>Resultado del simulacro</h1>

      <div className="resumen-puntaje">{resumen.puntajeTotal}</div>
      <p className="resumen-subtitulo">puntos</p>

      <div className="resumen-conteos">
        <div>
          <strong>{resumen.correctas}</strong>
          <span>correctas</span>
        </div>
        <div>
          <strong>{resumen.incorrectas}</strong>
          <span>incorrectas</span>
        </div>
        <div>
          <strong>{resumen.enBlanco}</strong>
          <span>en blanco</span>
        </div>
      </div>

      {resumen.desglosePorTema.length > 0 && (
        <table className="resumen-tabla">
          <thead>
            <tr>
              <th>Tema</th>
              <th>Correctas</th>
              <th>Incorrectas</th>
              <th>En blanco</th>
            </tr>
          </thead>
          <tbody>
            {resumen.desglosePorTema.map((tema) => (
              <tr key={tema.temaId}>
                <td>{tema.temaNombre}</td>
                <td>{tema.correctas}</td>
                <td>{tema.incorrectas}</td>
                <td>{tema.enBlanco}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link to="/examenes" className="resumen-volver">
        Volver a examenes
      </Link>
    </div>
  )
}
