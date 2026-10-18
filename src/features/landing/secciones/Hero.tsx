import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Icon } from '../../../components/ui'
import { UNIVERSIDADES } from '../datosLanding'
import { btnBase, btnGhost, btnLg, btnPrimary } from '../estilosLanding'
import Reveal from '../Reveal'

/** Portada: titular, llamados a la accion, maqueta animada de un simulacro y franja de universidades. */
export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 pb-18">
      <div
        className="pointer-events-none absolute -top-24 left-[10%] -z-10 h-[420px] w-[420px] rounded-full bg-primary-600/10 blur-[80px]"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <Reveal>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-600">
            <motion.span
              className="h-[7px] w-[7px] rounded-full bg-accent-500"
              animate={{ opacity: [1, 0.5, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            Admision 2026
          </span>
          <h1 className="mt-4 mb-4 font-display text-[34px] leading-[1.15] font-bold tracking-tight text-slate-900 sm:text-[44px]">
            Entrena con el examen real.{' '}
            <span className="block">
              Ingresa a{' '}
              <span className="relative isolate whitespace-nowrap text-primary-600">
                tu universidad
                {/* Resaltado tipo marcador que se "dibuja" de izquierda a derecha. */}
                <motion.span
                  className="absolute inset-x-[-4px] bottom-[0.08em] -z-10 h-[0.32em] origin-left rounded-sm bg-accent-500/30"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
                  aria-hidden="true"
                />
              </span>
              .
            </span>
          </h1>
          <p className="mb-6 max-w-[48ch] text-[17px] leading-relaxed text-slate-700">
            Rinde simulacros con el tiempo, el formato y la calificación oficial de la UNMSM, UNI, UNFV y más.{' '}
            <strong className="font-semibold text-slate-900">Descubre tus cursos débiles</strong> y mira tu puesto en el
            ranking antes del día del examen.
          </p>
          <div className="mb-7 flex flex-col gap-3 xs:flex-row">
            <Link to="/registro" className={`${btnBase} ${btnPrimary} ${btnLg}`}>
              <span>Registrarme gratis</span>
              <Icon name="arrow_forward" size={18} />
            </Link>
            <a href="#como-funciona" className={`${btnBase} ${btnGhost} ${btnLg}`}>
              <Icon name="play_circle" size={20} className="text-primary-600" />
              <span>Ver como funciona</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-50 bg-primary-600 text-[13px] font-bold text-white">
                CQ
              </span>
              <span className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-50 bg-accent-500 text-[13px] font-bold text-white">
                RV
              </span>
              <span className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-50 bg-primary-950 text-[13px] font-bold text-white">
                LB
              </span>
            </div>
            <div>
              <div className="text-sm tracking-[2px] text-amber-400">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="mt-0.5 text-[13px] text-slate-500">Postulantes preparandose con SimulaEdu</p>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={150} className="relative">
          <img
            src="/chica_estudiando.png"
            alt="Estudiante peruana preparandose para su examen de admision"
            className="block h-[340px] w-full rounded-[20px] object-cover object-top shadow-[0_20px_40px_-12px_rgba(15,23,42,0.25)] sm:h-[420px] lg:h-[480px]"
          />
          <motion.div
            className="relative mx-4 -mt-14 ml-auto w-[min(280px,82%)] sm:absolute sm:-right-5 sm:-bottom-8 sm:m-0 sm:w-[280px]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative rounded-[20px] bg-white p-5 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.18)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-primary-50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <motion.span
                    className="h-2 w-2 rounded-full bg-rose-500"
                    animate={{ opacity: [1, 0.5, 1], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span>SIMULACRO EN CURSO</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-bold tabular-nums text-accent-500">
                  02:44:10
                </div>
              </div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-600">
                  Pregunta 42 de 100
                </span>
              </div>
              <div className="mb-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-[10px] border border-primary-600 bg-primary-50 p-2.5 text-sm font-bold">
                  <span className="flex items-center">
                    <span className="mr-2.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                      B
                    </span>
                    1,480.000 puntos
                  </span>
                  <span aria-hidden="true">&#10003;</span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-slate-200 p-2.5 text-sm">
                  <span className="flex items-center">
                    <span className="mr-2.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                      C
                    </span>
                    1,510.125 puntos
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex gap-2">
                  <button type="button" className="rounded-lg bg-slate-100 px-3.5 py-2 font-semibold text-slate-900">
                    Anterior
                  </button>
                  <button type="button" className="rounded-lg bg-primary-600 px-3.5 py-2 font-semibold text-white">
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>

      <Reveal className="mx-auto mt-14 max-w-[1200px] px-6">
        <p className="mb-4 text-center text-xs tracking-widest text-slate-500 uppercase">
          Estructura de examen adaptada para
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {UNIVERSIDADES.map((u) => (
            <div className="rounded-[10px] bg-white p-3 text-center shadow-sm" key={u.sigla}>
              <strong className="block font-display text-base text-primary-600">{u.sigla}</strong>
              <span className="text-[11px] text-slate-500">{u.nombre}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
