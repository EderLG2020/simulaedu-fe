import Reveal from '../Reveal'
import SectionHead from './SectionHead'

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

/** Casos de uso ilustrativos; usa la foto si existe y si no un avatar con iniciales. */
export default function Testimonios() {
  return (
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
  )
}
