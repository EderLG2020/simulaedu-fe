import { Link } from 'react-router-dom'
import { btnBase, btnGhost, btnPrimary, btnSm } from '../estilosLanding'

/** Barra superior fija con el logo, los anclas a cada seccion y los accesos de login/registro. */
export default function Encabezado() {
  return (
    <header className="vt-encabezado sticky top-0 z-50 border-b border-slate-200 bg-slate-50/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between gap-3 px-6">
        <Link to="/" className="flex min-w-0 shrink-0 items-center">
          <img src="/logo_simulaedu.png" alt="SimulaEdu" className="h-8 w-auto max-w-[44vw] object-contain sm:h-10" />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          <a href="#como-funciona" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Como funciona
          </a>
          <a href="#caracteristicas" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Caracteristicas
          </a>
          <a href="#planes" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Planes
          </a>
          <a href="#institucional" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Institucional
          </a>
          <a href="#preguntas-frecuentes" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Preguntas frecuentes
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <Link to="/login" className={`hidden xs:inline-flex ${btnBase} ${btnGhost} ${btnSm}`}>
            Iniciar sesion
          </Link>
          <Link to="/registro" className={`${btnBase} ${btnPrimary} ${btnSm}`}>
            Registrate gratis
          </Link>
        </div>
      </div>
    </header>
  )
}
