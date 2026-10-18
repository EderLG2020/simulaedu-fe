import { cn, EmptyState, Icon, Select } from '../../components/ui'
import { textoPlanoDe } from '../../lib/html'
import { EtiquetaDificultad, SeccionCard } from './ComponentesEditor'
import type { EditorExamen } from './useEditorExamen'

/** Composicion fija: banco de preguntas publicadas de un tema, pulsar una la agrega al examen. */
export default function BuscadorPreguntas({ editor }: { editor: EditorExamen }) {
  const { cursos, temaBusqueda, buscarPreguntas, resultadosBusqueda, preguntasElegidas, agregarPregunta } = editor

  return (
    <SeccionCard titulo="Banco de preguntas" descripcion="Solo aparecen las preguntas publicadas. Pulsa una para agregarla." className="lg:col-span-7">
      <div className="flex flex-col gap-3 p-5">
        <Select aria-label="Tema" value={temaBusqueda} onChange={(e) => buscarPreguntas(e.target.value)}>
          <option value="">Elige un tema para ver sus preguntas...</option>
          {cursos?.map((c) => (
            <optgroup key={c.id} label={c.nombre}>
              {c.temas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>

        {resultadosBusqueda === null && <EmptyState icon="search" title="Elige un tema para empezar." />}
        {resultadosBusqueda?.length === 0 && <EmptyState icon="search_off" title="Sin preguntas publicadas en este tema." />}
        {resultadosBusqueda && resultadosBusqueda.length > 0 && (
          <ul className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
            {resultadosBusqueda.map((p) => {
              const yaAgregada = preguntasElegidas.some((e) => e.preguntaId === p.id)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => agregarPregunta(p)}
                    disabled={yaAgregada}
                    className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/40 focus-visible:outline-2 focus-visible:outline-primary-600 disabled:border-emerald-200 disabled:bg-emerald-50/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm text-slate-700">{textoPlanoDe(p.enunciadoHtml, 160)}</span>
                      <span className="mt-1 block">
                        <EtiquetaDificultad dificultad={p.dificultad} />
                      </span>
                    </span>
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        yaAgregada ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-50 text-primary-600',
                      )}
                    >
                      <Icon name={yaAgregada ? 'check' : 'add'} size={18} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </SeccionCard>
  )
}
