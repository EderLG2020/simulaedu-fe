import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-body text-slate-900">
      <header className="fixed top-0 left-0 z-50 w-full border-b border-slate-200 bg-slate-50/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Link to="/" className="flex items-center">
            <img src="/logo_simulaedu.png" alt="SimulaEdu" className="h-7 w-auto object-contain sm:h-8" />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Volver al inicio
            </Link>
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
              Iniciar sesion
            </Link>
            <Link to="/registro" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-28">
        <div
          className="pointer-events-none absolute -top-16 -left-16 -z-10 h-80 w-80 rounded-full bg-primary-50 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-12 -bottom-16 -z-10 h-96 w-96 rounded-full bg-accent-100 blur-3xl"
          aria-hidden="true"
        />
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 text-center sm:flex-row sm:text-left">
          <p className="text-[13px] text-slate-700">&copy; 2026 SimulaEdu Peru. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5 text-[13px] text-slate-700">
            <span>Terminos y condiciones</span>
            <span>Privacidad</span>
            <a href="mailto:soporte@simulaedu.pe" className="hover:text-slate-900">
              Centro de ayuda
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
