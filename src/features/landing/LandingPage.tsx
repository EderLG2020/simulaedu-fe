import * as Accordion from '@radix-ui/react-accordion'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerEstadisticasLanding, type LandingEstadisticas } from '../../api/landingApi'
import Reveal from './Reveal'
import RollingNumber from './RollingNumber'

const UNIVERSIDADES = [
  { sigla: 'UNMSM', nombre: 'Decana de America' },
  { sigla: 'UNI', nombre: 'Ciencias e Ingenieria' },
  { sigla: 'PUCP', nombre: 'Evaluacion Talento' },
  { sigla: 'UNFV', nombre: 'Federico Villarreal' },
  { sigla: 'UNSA', nombre: 'San Agustin Arequipa' },
  { sigla: 'UNT', nombre: 'Nacional de Trujillo' },
]

const PASOS = [
  {
    numero: '01',
    titulo: 'Elige tu universidad objetivo',
    texto: 'Configura el examen a tu medida: cada universidad tiene su propia estructura de cursos, duracion y forma de calificar.',
  },
  {
    numero: '02',
    titulo: 'Rinde simulacros cronometrados',
    texto: 'Practica con navegacion libre o secuencial, igual que en el examen oficial, con temporizador en tiempo real.',
  },
  {
    numero: '03',
    titulo: 'Revisa tu puntaje ponderado',
    texto: 'El sistema calcula tu puntaje con la misma penalizacion por error que aplica tu universidad objetivo.',
  },
  {
    numero: '04',
    titulo: 'Compara tu ranking',
    texto: 'Ve tu posicion frente a otros postulantes en el ranking nacional e institucional, actualizado automaticamente.',
  },
]

const CARACTERISTICAS = [
  {
    icono: 'timer',
    color: 'primary',
    titulo: 'Simulacros cronometrados',
    texto: 'Examenes completos con navegacion libre o secuencial y temporizador en vivo, igual que el dia oficial.',
  },
  {
    icono: 'library_books',
    color: 'accent',
    titulo: 'Banco de preguntas por curso',
    texto: 'Preguntas organizadas por curso y nivel de dificultad, revisadas y aprobadas antes de publicarse.',
  },
  {
    icono: 'calculate',
    color: 'deep',
    titulo: 'Puntaje ponderado real',
    texto: 'Respuesta correcta suma, errada descuenta segun el reglamento configurado para cada universidad.',
  },
  {
    icono: 'leaderboard',
    color: 'primary',
    titulo: 'Ranking en tiempo real',
    texto: 'Compara tu desempeno contra otros postulantes a nivel nacional o dentro de tu institucion.',
  },
  {
    icono: 'fact_check',
    color: 'accent',
    titulo: 'Revision docente incluida',
    texto: 'Las preguntas de desarrollo son calificadas por un docente, no solo por un sistema automatico.',
  },
  {
    icono: 'bar_chart',
    color: 'deep',
    titulo: 'Reportes descargables',
    texto: 'Estadisticas de progreso y reportes en PDF/Excel para estudiantes Premium, docentes e instituciones.',
  },
]

const ICONO_COLOR: Record<string, string> = {
  primary: 'bg-primary-50 text-primary-600',
  accent: 'bg-accent-50 text-accent-500',
  deep: 'bg-violet-100 text-primary-950',
}

interface Testimonio {
  iniciales: string
  color: string
  foto?: string
  nombre: string
  rol: string
  texto: string
}

const TESTIMONIOS: Testimonio[] = [
  {
    iniciales: 'CQ',
    color: '#4f46e5',
    foto: '/chica_diploma.png',
    nombre: 'Camila Q.',
    rol: 'Postulante a Medicina Humana',
    texto: '"Practicar con el mismo temporizador y la misma penalizacion que mi universidad me ayudo a entender cuando arriesgarme y cuando pasar de pregunta."',
  },
  {
    iniciales: 'RV',
    color: '#f97316',
    nombre: 'Renzo V.',
    rol: 'Postulante a Ingenieria',
    texto: '"Poder cambiar de universidad objetivo y ver el ranking actualizado en cada simulacro me ayudo a medir en que nivel estaba realmente."',
  },
  {
    iniciales: 'LB',
    color: '#1e1b4b',
    nombre: 'Luciana B.',
    rol: 'Postulante a Derecho',
    texto: '"Los reportes de progreso me mostraron exactamente en que cursos estaba mas debil, asi que pude enfocar mejor mis ultimas semanas de estudio."',
  },
]

const FAQS = [
  {
    pregunta: 'Como funciona el calculo de puntaje y penalizacion?',
    respuesta:
      'Cada universidad tiene su propio reglamento de calificacion, configurado en la plataforma: una respuesta correcta suma puntos y una errada puede descontar segun el factor oficial de esa casa de estudios. El calculo se aplica automaticamente segun el examen que estes rindiendo.',
  },
  {
    pregunta: 'Puedo cambiar mi universidad objetivo despues de registrarme?',
    respuesta:
      'Si. Puedes elegir o cambiar tu universidad objetivo cuando quieras desde tu cuenta; los examenes disponibles se filtran automaticamente segun la universidad que elijas.',
  },
  {
    pregunta: 'Que diferencia hay entre el plan Free y el Premium?',
    respuesta:
      'El plan Free incluye 2 simulacros oficiales al mes en una sola universidad. El plan Premium quita ese limite, habilita todas las universidades, el ranking, las estadisticas avanzadas y los reportes descargables.',
  },
  {
    pregunta: 'Las preguntas de desarrollo quien las califica?',
    respuesta:
      'Las preguntas de tipo desarrollo (no de opcion multiple) pasan por revision de un docente despues de que finalizas el simulacro, no solo por un corrector automatico.',
  },
  {
    pregunta: 'Necesito tarjeta de credito para probar la plataforma?',
    respuesta: 'No. El plan Free no pide ningun medio de pago y puedes empezar a rendir simulacros apenas verificas tu correo.',
  },
]

const btnBase = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition whitespace-nowrap'
const btnGhost = 'border border-slate-200 bg-white text-slate-900 hover:bg-primary-50'
const btnPrimary = 'bg-accent-500 text-white shadow-[0_4px_6px_-1px_rgba(79,70,229,0.15)] hover:-translate-y-0.5 hover:bg-accent-600'
const btnSm = 'px-3.5 py-2 text-[13px] sm:px-5 sm:py-2.5 sm:text-sm'
const btnLg = 'px-7 py-3.5 text-[15px] rounded-[10px]'

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-[640px] text-center">
      <span className="mb-3 inline-block rounded-full bg-primary-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-600">
        {eyebrow}
      </span>
      <h2 className="mb-2.5 font-display text-[28px] text-slate-900">{title}</h2>
      <p className="text-base leading-relaxed text-slate-700">{text}</p>
    </Reveal>
  )
}

export default function LandingPage() {
  const [estadisticas, setEstadisticas] = useState<LandingEstadisticas | null>(null)
  const [faqAbierta, setFaqAbierta] = useState<string | undefined>('faq-0')

  useEffect(() => {
    obtenerEstadisticasLanding()
      .then(setEstadisticas)
      .catch(() => {})
  }, [])

  return (
    <div className="bg-slate-50 font-body text-left text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-slate-50/90 backdrop-blur-xl">
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

      <main>
        {/* HERO */}
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
                Practica como si fuera el examen real.{' '}
                <span className="text-primary-600 underline decoration-accent-500 decoration-wavy decoration-2">
                  Ingresa a la universidad
                </span>{' '}
                que sueñas.
              </h1>
              <p className="mb-6 max-w-[46ch] text-[17px] leading-relaxed text-slate-700">
                Simulacros cronometrados con banco de preguntas por curso, puntaje ponderado segun el reglamento oficial de
                cada universidad y ranking en tiempo real.
              </p>
              <div className="mb-7 flex flex-col gap-3 xs:flex-row">
                <Link to="/registro" className={`${btnBase} ${btnPrimary} ${btnLg}`}>
                  <span>Registrarme gratis</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <a href="#como-funciona" className={`${btnBase} ${btnGhost} ${btnLg}`}>
                  <span className="material-symbols-outlined text-primary-600 text-[20px]">play_circle</span>
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

        {/* CIFRAS REALES */}
        <section className="bg-primary-600 py-14 text-white">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-6 text-center md:grid-cols-4">
            {[
              {
                valor: estadisticas?.simulacrosRendidos,
                titulo: 'Simulacros rendidos',
                texto: 'Evaluaciones completas registradas en la plataforma.',
              },
              {
                valor: estadisticas?.postulantesRegistrados,
                titulo: 'Postulantes registrados',
                texto: 'Estudiantes preparandose para su examen de admision.',
              },
              {
                valor: estadisticas?.universidades,
                titulo: 'Universidades cubiertas',
                texto: 'Con estructura y calificacion propia por casa de estudios.',
              },
              {
                valor: estadisticas?.preguntasBanco,
                titulo: 'Preguntas en el banco',
                texto: 'Publicadas y revisadas, listas para tus simulacros.',
              },
            ].map((s, index) => (
              <Reveal delayMs={index * 60} key={s.titulo}>
                <div className="font-display text-4xl font-bold text-amber-400 sm:text-5xl">
                  {s.valor === undefined ? (
                    <span className="inline-block h-10 w-20 animate-pulse rounded bg-white/20 align-middle" />
                  ) : (
                    <RollingNumber value={s.valor} />
                  )}
                </div>
                <h3 className="mt-2 text-sm font-semibold">{s.titulo}</h3>
                <p className="mx-auto mt-1 max-w-[22ch] text-[13px] text-primary-200">{s.texto}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-primary-200/70">Cifras reales, actualizadas en vivo desde la plataforma.</p>
        </section>

        {/* COMO FUNCIONA */}
        <section className="py-16" id="como-funciona">
          <div className="mx-auto max-w-[1200px] px-6">
            <SectionHead
              eyebrow="Paso a paso"
              title="Como funciona SimulaEdu"
              text="Un metodo estructurado para dominar el tiempo y llegar mejor preparado al examen oficial."
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PASOS.map((paso, index) => (
                <Reveal
                  className="rounded-[14px] bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                  delayMs={index * 80}
                  key={paso.numero}
                >
                  <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-50 font-display font-bold text-primary-600">
                    {paso.numero}
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold">{paso.titulo}</h3>
                  <p className="text-[13px] leading-relaxed text-slate-700">{paso.texto}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CARACTERISTICAS */}
        <section className="bg-primary-50 py-16" id="caracteristicas">
          <div className="mx-auto max-w-[1200px] px-6">
            <SectionHead
              eyebrow="Ventajas"
              title="Herramientas pensadas para tu ingreso"
              text="Cada funcionalidad existe para resolver un problema real de la preparacion preuniversitaria."
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CARACTERISTICAS.map((c, index) => (
                <Reveal
                  className="group rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl"
                  delayMs={index * 70}
                  whileHover={{ y: -4 }}
                  key={c.titulo}
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${ICONO_COLOR[c.color]}`}
                  >
                    <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
                      {c.icono}
                    </span>
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold">{c.titulo}</h3>
                  <p className="text-[13px] leading-relaxed text-slate-700">{c.texto}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6">
            <SectionHead
              eyebrow="Casos de uso"
              title="Asi usan SimulaEdu los postulantes"
              text="Ejemplos ilustrativos de como estudiantes preparan su examen de admision con la plataforma."
            />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {TESTIMONIOS.map((t, index) => (
                <Reveal className="rounded-[14px] bg-white p-6 shadow-sm" delayMs={index * 90} key={t.nombre}>
                  <div className="mb-3.5 flex items-center gap-3.5">
                    {t.foto ? (
                      <img src={t.foto} alt={t.nombre} className="h-[52px] w-[52px] shrink-0 rounded-full object-cover object-top" />
                    ) : (
                      <span
                        className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                        style={{ background: t.color }}
                      >
                        {t.iniciales}
                      </span>
                    )}
                    <div>
                      <h4 className="text-[15px] font-semibold">{t.nombre}</h4>
                      <span className="text-xs font-bold text-primary-600">{t.rol}</span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 italic">{t.texto}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PLANES */}
        <section className="bg-primary-50 py-16" id="planes">
          <div className="mx-auto max-w-[1200px] px-6">
            <SectionHead
              eyebrow="Inversion accesible"
              title="Un plan para cada etapa de tu preparacion"
              text="Sin matriculas ocultas ni contratos forzosos."
            />
            <div className="mx-auto grid max-w-[780px] grid-cols-1 gap-6 sm:grid-cols-2">
              <Reveal className="flex flex-col justify-between rounded-[20px] bg-white p-8 shadow-sm">
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl">Free</h3>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">Basico</span>
                  </div>
                  <p className="mb-4 text-[13px] text-slate-700">Para conocer la plataforma y medir tu nivel sin costo.</p>
                  <div className="mb-5 flex items-baseline gap-1.5">
                    <strong className="font-display text-[34px] text-slate-900">S/ 0</strong>
                    <span className="text-sm text-slate-700">/ para siempre</span>
                  </div>
                  <ul className="mb-6 flex flex-col gap-2.5">
                    <li className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold text-primary-600">&#10003;</span>
                      <span>2 simulacros oficiales al mes</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold text-primary-600">&#10003;</span>
                      <span>1 universidad objetivo</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold text-primary-600">&#10003;</span>
                      <span>Puntaje y penalizacion oficial</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[13px] text-slate-400 line-through">
                      <span>&#10007;</span>
                      <span>Ranking nacional</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[13px] text-slate-400 line-through">
                      <span>&#10007;</span>
                      <span>Estadisticas avanzadas</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[13px] text-slate-400 line-through">
                      <span>&#10007;</span>
                      <span>Reportes descargables</span>
                    </li>
                  </ul>
                </div>
                <Link to="/registro" className="block w-full rounded-[10px] bg-slate-100 py-3 text-center text-sm font-bold text-slate-900">
                  Comenzar gratis
                </Link>
              </Reveal>

              <Reveal
                className="relative flex flex-col justify-between rounded-[20px] border-2 border-primary-600 bg-white p-8 shadow-[0_20px_40px_-12px_rgba(79,70,229,0.25)]"
                delayMs={100}
              >
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-500 px-4 py-1.5 text-[11px] font-bold tracking-wide text-white uppercase whitespace-nowrap">
                  Recomendado
                </span>
                <div>
                  <div className="mt-2 mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-primary-600">Premium</h3>
                    <span className="rounded-md bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-600">
                      Acceso total
                    </span>
                  </div>
                  <p className="mb-4 text-[13px] text-slate-700">La preparacion sin limites para llegar mejor al examen oficial.</p>
                  <div className="mb-5 flex items-baseline gap-1.5">
                    <strong className="font-display text-[34px] text-slate-900">S/ 9.90</strong>
                    <span className="text-sm text-slate-700">/ mes</span>
                  </div>
                  <ul className="mb-6 flex flex-col gap-2.5">
                    <li className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold text-accent-500">&#10003;</span>
                      <span>
                        <strong>Simulacros ilimitados</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold text-accent-500">&#10003;</span>
                      <span>Todas las universidades</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold text-accent-500">&#10003;</span>
                      <span>Ranking nacional e institucional</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold text-accent-500">&#10003;</span>
                      <span>Estadisticas avanzadas</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold text-accent-500">&#10003;</span>
                      <span>Reportes descargables en PDF/Excel</span>
                    </li>
                  </ul>
                </div>
                <Link
                  to="/registro"
                  className="block w-full rounded-[10px] bg-accent-500 py-3 text-center text-sm font-bold text-white transition hover:bg-accent-600"
                >
                  Empezar preparacion ahora
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* INSTITUCIONAL */}
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

        {/* FAQ */}
        <section className="bg-primary-50 py-16" id="preguntas-frecuentes">
          <div className="mx-auto max-w-[1200px] px-6">
            <SectionHead
              eyebrow="Despeja tus dudas"
              title="Preguntas frecuentes"
              text="Todo lo que necesitas saber antes de dar tu primer simulacro."
            />
            <Accordion.Root
              type="single"
              collapsible
              value={faqAbierta}
              onValueChange={(v) => setFaqAbierta(v || undefined)}
              className="mx-auto flex max-w-[760px] flex-col gap-2.5"
            >
              {FAQS.map((faq, index) => {
                const valor = `faq-${index}`
                const abierta = faqAbierta === valor
                return (
                  <Reveal delayMs={index * 60} key={faq.pregunta}>
                    <Accordion.Item value={valor} className="overflow-hidden rounded-[14px] bg-white shadow-sm">
                      <Accordion.Header>
                        <Accordion.Trigger className="flex w-full items-center justify-between gap-3 px-5 py-[18px] text-left text-[15px] font-bold text-slate-900">
                          <span>{faq.pregunta}</span>
                          <motion.span
                            className="shrink-0 text-primary-600"
                            animate={{ rotate: abierta ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            &#9660;
                          </motion.span>
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <AnimatePresence initial={false}>
                        {abierta && (
                          <Accordion.Content forceMount asChild>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                              className="overflow-hidden text-sm leading-relaxed text-slate-700"
                            >
                              <div className="px-5 pb-[18px]">{faq.respuesta}</div>
                            </motion.div>
                          </Accordion.Content>
                        )}
                      </AnimatePresence>
                    </Accordion.Item>
                  </Reveal>
                )
              })}
            </Accordion.Root>
          </div>
        </section>

        {/* CTA FINAL */}
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
      </main>

      <footer className="mt-6 border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <img src="/logo_simulaedu.png" alt="SimulaEdu" className="h-8 w-auto object-contain" />
              <p className="mt-2.5 text-[13px] text-slate-700">
                Plataforma de simulacros de examen de admision para universidades peruanas.
              </p>
            </div>
            <div>
              <h4 className="mb-2.5 text-sm font-semibold">Producto</h4>
              <ul className="flex flex-col gap-2 text-[13px] text-slate-700">
                <li>Simulacros cronometrados</li>
                <li>Banco de preguntas por curso</li>
                <li>Ranking nacional</li>
                <li>Reportes descargables</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2.5 text-sm font-semibold">Universidades</h4>
              <ul className="flex flex-col gap-2 text-[13px] text-slate-700">
                {UNIVERSIDADES.slice(0, 4).map((u) => (
                  <li key={u.sigla}>{u.sigla}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-2.5 text-sm font-semibold">Contacto</h4>
              <ul className="flex flex-col gap-2 text-[13px] text-slate-700">
                <li>soporte@simulaedu.pe</li>
                <li>Lima, Peru</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
            <p>&copy; 2026 SimulaEdu Peru.</p>
            <p>Preparacion con estructura y disciplina.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
