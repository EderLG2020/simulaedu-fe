import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contarNoLeidas } from '../../api/notificacionesApi'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../hooks/useAuth'
import ConfiguracionModal from '../perfil/ConfiguracionModal'

interface StudentHeaderProps {
  /** Si el padre ya tiene el conteo (ej. EstudianteHomePage lo usa tambien en otras tarjetas), se lo pasa aqui para no pedirlo dos veces. */
  noLeidas?: number
}

export default function StudentHeader({ noLeidas: noLeidasProp }: StudentHeaderProps) {
  const { usuario, cerrarSesion } = useAuth()
  const [noLeidasPropia, setNoLeidasPropia] = useState(0)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [configuracionAbierta, setConfiguracionAbierta] = useState(false)
  const noLeidas = noLeidasProp ?? noLeidasPropia

  useEffect(() => {
    if (noLeidasProp !== undefined) return
    contarNoLeidas().then(setNoLeidasPropia).catch(() => {})
  }, [noLeidasProp])

  if (!usuario) return null

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo_simulaedu.png" alt="SimulaEdu" className="h-8 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/notificaciones"
              className="relative rounded-xl p-2 text-slate-700 transition hover:bg-primary-50 hover:text-primary-600"
              aria-label="Ver notificaciones"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {noLeidas > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {noLeidas}
                </span>
              )}
            </Link>

            <div className="mx-1 h-6 w-px bg-slate-200" />

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
                <span className="material-symbols-outlined hidden text-lg text-slate-500 sm:inline">expand_more</span>
              </button>

              {menuAbierto && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(false)
                      setConfiguracionAbierta(true)
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-base">tune</span>
                    Configuración
                  </button>
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {configuracionAbierta && <ConfiguracionModal onCerrar={() => setConfiguracionAbierta(false)} />}
    </>
  )
}
