import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { contarNoLeidas } from '../../api/notificacionesApi'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../hooks/useAuth'
import ConfiguracionModal from '../perfil/ConfiguracionModal'

/**
 * Shell de los paneles internos (admin, docente, coordinador): sidebar + topbar que persisten al
 * navegar entre modulos; cada pagina solo devuelve su contenido, montado aqui via <Outlet />.
 * Cada rol solo define su menu (AdminLayout, DocenteLayout, CoordinadorLayout).
 */

const iconoBase = 'material-symbols-outlined'

export interface ItemNav {
  to: string
  icono: string
  label: string
  /** Solo marca activo en la ruta exacta (para una ruta raiz como /coordinador con subrutas hermanas). */
  exacto?: boolean
  /** Muestra el contador de notificaciones no leidas. */
  conNoLeidas?: boolean
  /** Pantalla que todavia no existe: se muestra deshabilitada. */
  inerte?: boolean
}

export interface SeccionNav {
  titulo: string
  items: ItemNav[]
}

/** Lo que el layout comparte con sus paginas via <Outlet context>. */
export interface ContextoPanel {
  /** Vuelve a pedir el contador de no leidas (ej. tras marcar una notificacion como leida). */
  refrescarNoLeidas: () => void
}

interface Props {
  /** Etiqueta junto al logo (ej. "Admin"). */
  etiqueta: string
  /** Rol bajo el nombre del usuario en el topbar (ej. "Administrador"). */
  rolTexto: string
  secciones: SeccionNav[]
  rutaNotificaciones: string
  /** Placeholder del buscador del topbar; sin el, no se muestra buscador. */
  busqueda?: string
}

function NavItem({ item, badge }: { item: ItemNav; badge?: string }) {
  const { pathname } = useLocation()
  // Tambien en sus subrutas (ej. /admin/examenes/:id sigue marcando "Exámenes").
  const activo = pathname === item.to || (!item.exacto && pathname.startsWith(`${item.to}/`))

  if (item.inerte) {
    return (
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 opacity-60 cursor-default" title="Todavia no existe esta pantalla">
        <div className="flex items-center gap-3">
          <span className={`${iconoBase} text-[20px] text-slate-500`}>{item.icono}</span>
          <span>{item.label}</span>
        </div>
      </div>
    )
  }

  return (
    <Link
      to={item.to}
      className={
        activo
          ? 'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 shadow-sm shadow-primary-600/30 transition-all'
          : 'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors'
      }
      aria-current={activo ? 'page' : undefined}
    >
      <div className="flex items-center gap-3">
        <span className={`${iconoBase} text-[20px] ${activo ? 'text-white' : 'text-slate-400'}`}>{item.icono}</span>
        <span>{item.label}</span>
      </div>
      {badge && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-accent-500/20 text-accent-400 border border-accent-500/30">{badge}</span>}
    </Link>
  )
}

export default function PanelLayout({ etiqueta, rolTexto, secciones, rutaNotificaciones, busqueda }: Props) {
  const { usuario, cerrarSesion } = useAuth()
  const [noLeidas, setNoLeidas] = useState(0)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [configuracionAbierta, setConfiguracionAbierta] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  function refrescarNoLeidas() {
    contarNoLeidas()
      .then(setNoLeidas)
      .catch(() => {})
  }

  useEffect(refrescarNoLeidas, [])

  const contexto: ContextoPanel = { refrescarNoLeidas }

  // Menu del usuario (topbar): se cierra con clic fuera o con Esc.
  useEffect(() => {
    if (!menuAbierto) return
    function alClicFuera(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuAbierto(false)
    }
    function alPresionar(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuAbierto(false)
    }
    document.addEventListener('mousedown', alClicFuera)
    document.addEventListener('keydown', alPresionar)
    return () => {
      document.removeEventListener('mousedown', alClicFuera)
      document.removeEventListener('keydown', alPresionar)
    }
  }, [menuAbierto])

  const nombre = usuario?.nombre ?? etiqueta
  const badgeNoLeidas = noLeidas > 0 ? String(noLeidas) : undefined

  return (
    <div className="bg-slate-50 text-slate-900 antialiased selection:bg-primary-500 selection:text-white min-h-screen">
      <aside className="fixed inset-y-0 left-0 w-[260px] bg-slate-900 text-slate-300 z-50 flex flex-col border-r border-slate-800 shadow-xl">
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-600/30">
              <span className={`${iconoBase} text-[22px]`}>school</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-[19px] font-bold tracking-tight text-white leading-none">SimulaEdu</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  {etiqueta}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-tight mt-0.5">Pre-Admisión Perú</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-oscuro px-4 py-6 flex flex-col gap-6">
          {secciones.map((seccion) => (
            <div key={seccion.titulo}>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{seccion.titulo}</div>
              <nav className="flex flex-col gap-1">
                {seccion.items.map((item) => (
                  <NavItem key={item.to + item.label} item={item} badge={item.conNoLeidas ? badgeNoLeidas : undefined} />
                ))}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      <div className="pl-[260px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 h-[68px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {busqueda ? (
            <div className="w-96 max-w-md relative">
              <span className={`${iconoBase} absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]`}>search</span>
              <input
                className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                placeholder={busqueda}
                type="text"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs text-[11px] font-semibold text-slate-500">
                ⌘K
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Hola, <span className="font-semibold text-slate-900">{nombre.split(' ')[0]}</span>
            </p>
          )}

          <div className="flex items-center gap-4">
            <Link
              to={rutaNotificaciones}
              aria-label="Notificaciones"
              className="relative p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <span className={`${iconoBase} text-[22px]`}>notifications</span>
              {noLeidas > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-accent-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {noLeidas}
                </span>
              )}
            </Link>
            <div className="h-7 w-[1px] bg-slate-200" />
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuAbierto((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuAbierto}
                className="flex items-center gap-3 pl-1 pr-1.5 py-1 rounded-xl cursor-pointer group hover:bg-slate-100 transition-colors"
              >
                <Avatar nombre={nombre} fotoUrl={usuario?.fotoUrl} className="w-10 h-10 text-sm ring-2 ring-primary-50 shadow-sm" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors leading-tight">{nombre}</span>
                  <span className="text-xs font-medium text-slate-400 leading-tight">{rolTexto}</span>
                </div>
                <span className={`${iconoBase} text-slate-400 group-hover:text-slate-600 text-[18px] transition-transform ml-1 ${menuAbierto ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {menuAbierto && (
                <div role="menu" className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuAbierto(false)
                      setConfiguracionAbierta(true)
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <span className={`${iconoBase} text-[18px]`}>tune</span>
                    Configuración
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={cerrarSesion}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <span className={`${iconoBase} text-[18px]`}>logout</span>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet context={contexto} />
        </main>
      </div>

      {configuracionAbierta && <ConfiguracionModal onCerrar={() => setConfiguracionAbierta(false)} />}
    </div>
  )
}
