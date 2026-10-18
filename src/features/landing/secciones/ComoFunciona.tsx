import Reveal from '../Reveal'
import SectionHead from './SectionHead'

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

/** Los 4 pasos del metodo; es el destino del ancla #como-funciona. */
export default function ComoFunciona() {
  return (
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
  )
}
