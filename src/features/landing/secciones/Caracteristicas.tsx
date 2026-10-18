import { Icon } from '../../../components/ui'
import Reveal from '../Reveal'
import SectionHead from './SectionHead'

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

/** Grilla de ventajas del producto, cada una con su icono y color de acento. */
export default function Caracteristicas() {
  return (
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
                <Icon name={c.icono} size={26} />
              </div>
              <h3 className="mb-1.5 text-base font-semibold">{c.titulo}</h3>
              <p className="text-[13px] leading-relaxed text-slate-700">{c.texto}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
