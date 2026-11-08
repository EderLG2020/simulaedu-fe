import * as Accordion from '@radix-ui/react-accordion'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import Reveal from '../../../../shared/components/Reveal'
import { FAQS } from '../../lib/datosLanding'
import SectionHead from './SectionHead'


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
