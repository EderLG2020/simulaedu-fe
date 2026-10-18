import type { DificultadObjetivo } from '../../api/examenesApi'
import { Button, EmptyState, Field, Input, Select } from '../../components/ui'
import { SeccionCard } from './ComponentesEditor'
import type { EditorExamen } from './useEditorExamen'

/** Composicion aleatoria por area: cada area define curso/tema, cantidad, dificultad y puntaje. */
export default function ComposicionAreas({ editor }: { editor: EditorExamen }) {
  const { cursos, areas, agregarArea, cambiarAreas, actualizarArea } = editor

  return (
    <SeccionCard
      titulo="Áreas"
      descripcion="Cada área sortea preguntas de un curso (o de un tema) para cada estudiante."
      className="lg:col-span-8"
      acciones={
        <Button variant="secondary" size="sm" icon="add" onClick={agregarArea}>
          Agregar área
        </Button>
      }
    >
      <div className="flex flex-col gap-3 p-5">
        {areas.length === 0 && <EmptyState icon="grid_view" title='Aún no hay áreas. Usa "Agregar área" para indicar de qué curso salen las preguntas.' />}
        {areas.map((area, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Área {i + 1}</span>
              <Button variant="danger" size="icon" icon="delete" aria-label={`Quitar área ${i + 1}`} onClick={() => cambiarAreas((prev) => prev.filter((_, j) => j !== i))} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Curso">
                <Select value={area.cursoId} onChange={(e) => actualizarArea(i, { cursoId: e.target.value, temaId: null })}>
                  {cursos?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tema">
                <Select value={area.temaId ?? ''} onChange={(e) => actualizarArea(i, { temaId: e.target.value || null })}>
                  <option value="">Todos los temas del curso</option>
                  {cursos
                    ?.find((c) => c.id === area.cursoId)
                    ?.temas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Preguntas">
                <Input type="number" min="1" value={area.cantidadPreguntas} onChange={(e) => actualizarArea(i, { cantidadPreguntas: Number(e.target.value) })} />
              </Field>
              <Field label="Dificultad" hint={area.dificultadObjetivo === 'MIXTA' ? 'Sin filtro de dificultad' : undefined}>
                <Select value={area.dificultadObjetivo} onChange={(e) => actualizarArea(i, { dificultadObjetivo: e.target.value as DificultadObjetivo })}>
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="MIXTA">Mixta</option>
                </Select>
              </Field>
              <Field label="Puntaje del área">
                <Input type="number" min="0" value={area.puntajeAsignado} onChange={(e) => actualizarArea(i, { puntajeAsignado: Number(e.target.value) })} />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </SeccionCard>
  )
}
