import { Link } from 'react-router-dom'
import Reveal from '../Reveal'
import SectionHead from './SectionHead'

/** Comparativa de los planes Free y Premium. */
export default function Planes() {
  return (
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
  )
}
