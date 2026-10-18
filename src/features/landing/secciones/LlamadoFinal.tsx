import { Link } from 'react-router-dom'
import { btnBase, btnLg, btnPrimary } from '../estilosLanding'
import Reveal from '../Reveal'

/** Llamado a la accion final antes del pie de pagina. */
export default function LlamadoFinal() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="relative overflow-hidden rounded-[24px] bg-gradient-to-tr from-primary-600 to-violet-700 py-14 px-6 text-center text-white">
          <div className="relative z-[1] mx-auto max-w-[620px]">
            <span className="mb-3 inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-[11px] font-bold tracking-wider text-white uppercase">
              El momento de empezar es hoy
            </span>
            <h2 className="mt-3.5 mb-3 font-display text-[30px] leading-tight">Tu vacante se gana practicando hoy</h2>
            <p className="mb-6 text-[15px] text-primary-100">Registrate gratis y rinde tu primer simulacro en minutos.</p>
            <div className="flex flex-col items-center gap-3 xs:flex-row xs:justify-center">
              <Link to="/registro" className={`${btnBase} ${btnPrimary} ${btnLg}`}>
                Crear cuenta gratis
              </Link>
              <a href="#como-funciona" className={`${btnBase} bg-white/10 text-white hover:bg-white/20 ${btnLg}`}>
                Explorar como funciona
              </a>
            </div>
            <div className="mt-4.5 flex flex-wrap items-center justify-center gap-2 text-xs text-primary-100">
              <span>&#10003; Sin tarjeta de credito</span>
              <span>&#8226;</span>
              <span>&#10003; Activacion inmediata</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
