import { Outlet } from 'react-router-dom'
import { useNoLeidas } from '../../hooks/useNoLeidas'
import StudentHeader from './StudentHeader'
import { Icon } from '../../components/ui'

/**
 * Shell de las paginas del alumno (inicio, examenes, historial, ranking, avisos): fondo y
 * StudentHeader, que persisten al navegar entre ellas. Cada pagina arma su contenido con
 * <PaginaAlumno>. El simulacro en curso queda fuera: va sin navegacion para no distraer.
 */
export default function AlumnoLayout() {
  const contexto = useNoLeidas()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-body text-slate-900">
      <StudentHeader noLeidas={contexto.noLeidas} />
      <div className="flex flex-1 flex-col">
        <Outlet context={contexto} />
      </div>

      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-700">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-900">SimulaEdu</span>
            <span className="text-slate-200">|</span>
            <span>&copy; 2026 SimulaEdu Peru. Todos los derechos reservados.</span>
          </div>
          <a href="mailto:soporte@simulaedu.pe" className="flex items-center gap-1 font-medium transition hover:text-primary-600">
            <Icon name="support_agent" size={14} />
            Contactar soporte
          </a>
        </div>
      </footer>
    </div>
  )
}
