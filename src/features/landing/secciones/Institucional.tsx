import { Link } from 'react-router-dom'
import { btnBase, btnLg } from '../estilosLanding'
import Reveal from '../Reveal'

/** Banner para colegios y academias (licencias institucionales). */
export default function Institucional() {
  return (
    <section className="py-16" id="institucional">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal className="relative flex flex-col gap-7 overflow-hidden rounded-[24px] bg-gradient-to-br from-primary-600 to-primary-950 p-8 text-white lg:flex-row lg:items-center lg:justify-between lg:p-12">
          <div>
            <span className="mb-3 inline-flex w-fit items-center rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-white uppercase">
              Colegios y academias
            </span>
            <h2 className="mt-2.5 mb-3 font-display text-[26px] leading-tight">Eres coordinador de un colegio o academia?</h2>
            <p className="max-w-[60ch] text-[15px] leading-relaxed text-primary-100">
              Asigna licencias Premium a tus alumnos desde un panel institucional y sigue su avance dentro de tu propia
              institucion.
            </p>
          </div>
          <Link to="/registro" className={`${btnBase} bg-white text-primary-600 hover:bg-primary-50 ${btnLg}`}>
            Solicitar acceso institucional
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
