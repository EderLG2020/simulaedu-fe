import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../hooks/useAuth'
import ConfiguracionModal from '../perfil/ConfiguracionModal'
import { Icon } from '../../components/ui'

interface StudentHeaderProps {
  /** Notificaciones no leidas: las pide AlumnoLayout, que tambien las comparte con sus paginas. */
  noLeidas: number
}

interface SeccionAlumno {
  to: string
  label: string
  icono: string
  /** Rutas que cuentan como esta seccion (ej. el detalle de un programa es parte de Examenes). */
  activa: (pathname: string) => boolean
}

const SECCIONES: SeccionAlumno[] = [
  { to: '/', label: 'Inicio', icono: 'home', activa: (p) => p === '/' },
  { to: '/examenes', label: 'Exámenes', icono: 'quiz', activa: (p) => p === '/examenes' || p.startsWith('/examenes/') },
  // El resumen de un simulacro terminado se llega desde el historial.
  { to: '/simulacros/historial', label: 'Historial', icono: 'history', activa: (p) => p === '/simulacros/historial' || /^\/simulacros\/[^/]+\/resumen$/.test(p) },
  // Visible para todos: con plan Free, la pagina explica que el ranking es Premium (RN-03).
  { to: '/ranking', label: 'Ranking', icono: 'leaderboard', activa: (p) => p === '/ranking' },
]

const SECCION_AVISOS: SeccionAlumno = { to: '/notificaciones', label: 'Avisos', icono: 'notifications', activa: (p) => p === '/notificaciones' }

/** Clase en <body> para dejar espacio a la barra inferior fija en celular (ver index.css). */
const CLASE_BODY_NAV_INFERIOR = 'con-nav-alumno'

function ContadorNoLeidas({ cantidad }: { cantidad: number }) {
  if (cantidad <= 0) return null
  return (
    <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
      {cantidad > 99 ? '99+' : cantidad}
    </span>
  )
}

/**
 * Encabezado de todas las paginas del alumno, salvo el simulacro en curso (que va sin
 * navegacion para no distraer). En escritorio las secciones van arriba; en celular, en
 * una barra fija abajo, al alcance del pulgar.
 */
export default function StudentHeader({ noLeidas }: StudentHeaderProps) {
  const { usuario, cerrarSesion } = useAuth()
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [configuracionAbierta, setConfiguracionAbierta] = useState(false)

  useEffect(() => {
    document.body.classList.add(CLASE_BODY_NAV_INFERIOR)
    return () => document.body.classList.remove(CLASE_BODY_NAV_INFERIOR)
  }, [])

  if (!usuario) return null

  return (
    <>
      <header className="vt-encabezado sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-6 px-6">
          <div className="flex h-full items-center gap-8">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <img src="/logo_simulaedu.png" alt="SimulaEdu" className="h-8 w-auto object-contain" />
            </Link>

            <nav aria-label="Secciones" className="hidden h-full items-stretch gap-1 md:flex">
              {SECCIONES.map((s) => {
                const activa = s.activa(pathname)
                return (
                  <Link
                    key={s.to}
                    to={s.to}
                    aria-current={activa ? 'page' : undefined}
                    className={`relative flex items-center px-3 text-sm font-semibold transition ${
                      activa ? 'text-primary-600' : 'text-slate-700 hover:text-primary-600'
                    }`}
                  >
                    {s.label}
                    <span
                      className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full transition ${activa ? 'bg-primary-600' : 'bg-transparent'}`}
                    />
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/notificaciones"
              className={`relative hidden rounded-xl p-2 transition hover:bg-primary-50 hover:text-primary-600 md:block ${
                SECCION_AVISOS.activa(pathname) ? 'bg-primary-50 text-primary-600' : 'text-slate-700'
              }`}
              aria-label="Ver notificaciones"
              aria-current={SECCION_AVISOS.activa(pathname) ? 'page' : undefined}
            >
              <Icon name="notifications" size={24} />
              <ContadorNoLeidas cantidad={noLeidas} />
            </Link>

            <div className="mx-1 hidden h-6 w-px bg-slate-200 md:block" />

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAbierto((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl p-1 transition hover:bg-slate-100"
              >
                <Avatar nombre={usuario.nombre} fotoUrl={usuario.fotoUrl} className="h-9 w-9 text-sm ring-2 ring-primary-50" />
                <div className="hidden flex-col pr-1 text-left sm:flex">
                  <span className="text-xs leading-tight font-bold text-slate-900">{usuario.nombre}</span>
                  <span className="text-[10px] font-medium text-slate-500">Estudiante</span>
                </div>
                <Icon name="expand_more" size={18} className="hidden text-slate-500 sm:inline" />
              </button>

              {menuAbierto && (
                <div className="animar-menu absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(false)
                      setConfiguracionAbierta(true)
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Icon name="tune" size={16} />
                    Configuración
                  </button>
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Icon name="logout" size={16} />
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav
        aria-label="Secciones (movil)"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
          {[...SECCIONES, SECCION_AVISOS].map((s) => {
            const activa = s.activa(pathname)
            return (
              <li key={s.to}>
                <Link
                  to={s.to}
                  aria-current={activa ? 'page' : undefined}
                  className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
                    activa ? 'text-primary-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className={`relative flex h-7 w-12 items-center justify-center rounded-full transition ${activa ? 'bg-primary-50' : ''}`}>
                    <Icon name={s.icono} size={22} />
                    {s === SECCION_AVISOS && <ContadorNoLeidas cantidad={noLeidas} />}
                  </span>
                  {s.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {configuracionAbierta && <ConfiguracionModal onCerrar={() => setConfiguracionAbierta(false)} />}
    </>
  )
}
