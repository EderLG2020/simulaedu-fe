import Reveal from '../Reveal'

/** Encabezado comun de seccion (etiqueta, titulo y bajada) con animacion de entrada. */
export default function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
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
