import type { LandingEstadisticas } from '../../../api/landingApi'
import Reveal from '../Reveal'
import RollingNumber from '../RollingNumber'

/** Cifras reales de la plataforma; mientras `estadisticas` es null se muestran placeholders animados. */
export default function Cifras({ estadisticas }: { estadisticas: LandingEstadisticas | null }) {
  return (
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
  )
}
