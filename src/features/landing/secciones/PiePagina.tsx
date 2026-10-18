import { UNIVERSIDADES } from '../datosLanding'

/** Pie de pagina con columnas de producto, universidades y contacto. */
export default function PiePagina() {
  return (
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
  )
}
