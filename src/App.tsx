import { Link } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  const { usuario, estaAutenticado, cerrarSesion } = useAuth()

  return (
    <div className="home">
      <h1>SimulaEdu</h1>
      {estaAutenticado && usuario ? (
        <>
          <p>Hola, {usuario.nombre}.</p>
          <div className="home-actions">
            {usuario.rol === 'COORDINADOR' && <Link to="/coordinador">Panel de coordinador</Link>}
            {usuario.rol === 'DOCENTE' && (
              <>
                <Link to="/docente/grupos">Mis grupos</Link>
                <Link to="/docente/revisiones">Revisiones pendientes</Link>
              </>
            )}
            {usuario.rol === 'ADMIN' && (
              <>
                <Link to="/admin/usuarios">Usuarios</Link>
                <Link to="/admin/universidades">Universidades</Link>
                <Link to="/admin/planes">Planes</Link>
                <Link to="/admin/instituciones">Instituciones</Link>
                <Link to="/admin/reportes">Reportes globales</Link>
              </>
            )}
            {usuario.rol !== 'COORDINADOR' && usuario.rol !== 'DOCENTE' && usuario.rol !== 'ADMIN' && (
              <Link to="/examenes">Ver examenes disponibles</Link>
            )}
            <button type="button" onClick={cerrarSesion}>
              Cerrar sesion
            </button>
          </div>
        </>
      ) : (
        <div className="home-actions">
          <Link to="/login">Iniciar sesion</Link>
          <Link to="/registro">Crear cuenta</Link>
        </div>
      )}
    </div>
  )
}

export default App
