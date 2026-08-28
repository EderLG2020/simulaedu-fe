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
          <button type="button" onClick={cerrarSesion}>
            Cerrar sesion
          </button>
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
