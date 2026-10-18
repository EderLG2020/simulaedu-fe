import * as Accordion from '@radix-ui/react-accordion'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import Reveal from '../Reveal'
import SectionHead from './SectionHead'

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

/** Acordeon de preguntas frecuentes: una sola abierta a la vez, la primera abierta al cargar. */
export default function PreguntasFrecuentes() {
  const [faqAbierta, setFaqAbierta] = useState<string | undefined>('faq-0')

  return (
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
  )
}
