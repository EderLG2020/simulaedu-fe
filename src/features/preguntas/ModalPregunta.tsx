import type { CursoConTemas } from '../../api/cursosApi'
import type { UniversidadResumen } from '../../api/universidadesApi'
import { Alert, Badge, Button, Field, FieldGroup, Icon, Input, Modal, SegmentedControl, Select, Textarea } from '../../components/ui'
import CamposPorTipo from './CamposPorTipo'
import EditorEnunciado from './EditorEnunciado'
import { OPCIONES_DIFICULTAD, OPCIONES_TIPO } from './etiquetasPregunta'
import OpcionesTemas from './OpcionesTemas'
import type { EstadoFormularioPregunta } from './useFormularioPregunta'

interface Props {
  form: EstadoFormularioPregunta
  cursos: CursoConTemas[] | null
  universidades: UniversidadResumen[] | null
  universidadANombre: Map<string, string>
}

/** Modal de crear/editar pregunta. El estado vive en useFormularioPregunta (lo instancia la pagina). */
export default function ModalPregunta({ form, cursos, universidades, universidadANombre }: Props) {
  const { preguntaEnEdicion, formulario, setFormulario, errorFormulario, guardando, cerrarModal, handleGuardar } = form

  return (
    <Modal
      title={preguntaEnEdicion ? 'Editar pregunta' : 'Nueva pregunta'}
      icon="quiz"
      onClose={cerrarModal}
      closeDisabled={guardando}
      footer={
        <>
          <Button variant="ghost" onClick={cerrarModal} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} loading={guardando}>
            {guardando ? 'Guardando...' : 'Guardar pregunta'}
          </Button>
        </>
      }
    >
      {errorFormulario && <Alert>{errorFormulario}</Alert>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Tema" required>
          <Select value={formulario.temaId} onChange={(e) => setFormulario({ ...formulario, temaId: e.target.value })}>
            <option value="">Selecciona un tema...</option>
            <OpcionesTemas cursos={cursos} />
          </Select>
        </Field>
        <FieldGroup label="Dificultad">
          <SegmentedControl options={OPCIONES_DIFICULTAD} value={formulario.dificultad} onChange={(dificultad) => setFormulario({ ...formulario, dificultad })} />
        </FieldGroup>
      </div>

      <FieldGroup label="Tipo de pregunta">
        <SegmentedControl options={OPCIONES_TIPO} value={formulario.tipoPregunta} onChange={(tipoPregunta) => setFormulario({ ...formulario, tipoPregunta })} />
      </FieldGroup>

      <FieldGroup label="Enunciado" required>
        <EditorEnunciado form={form} />
      </FieldGroup>

      <CamposPorTipo form={form} />

      <Field
        label="Explicación de la respuesta"
        hint="Opcional. Explica por qué la respuesta correcta lo es; el alumno la ve al revisar su simulacro (planes Premium e Institución). Admite HTML."
      >
        <Textarea
          rows={3}
          value={formulario.explicacionHtml}
          onChange={(e) => setFormulario({ ...formulario, explicacionHtml: e.target.value })}
          placeholder="Ej.: Se divide 27 entre 3, así que x = 9."
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Tiempo sugerido (segundos)">
          <Input type="number" min="0" value={formulario.tiempoSugeridoSeg} onChange={(e) => setFormulario({ ...formulario, tiempoSugeridoSeg: e.target.value })} />
        </Field>
        <FieldGroup label="Universidades objetivo" hint="Vacío = genérica: aparece en exámenes de cualquier universidad.">
          <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5">
            {formulario.universidadesObjetivoIds.map((id) => (
              <Badge key={id} tone="primary">
                {universidadANombre.get(id) ?? '?'}
                <button
                  type="button"
                  aria-label={`Quitar ${universidadANombre.get(id) ?? 'universidad'}`}
                  className="-mr-0.5 flex hover:text-primary-800"
                  onClick={() => setFormulario({ ...formulario, universidadesObjetivoIds: formulario.universidadesObjetivoIds.filter((u) => u !== id) })}
                >
                  <Icon name="close" size={14} />
                </button>
              </Badge>
            ))}
            <select
              aria-label="Agregar universidad"
              className="bg-transparent px-1 text-xs text-slate-500 focus:outline-none"
              value=""
              onChange={(e) => {
                if (!e.target.value) return
                setFormulario({ ...formulario, universidadesObjetivoIds: [...formulario.universidadesObjetivoIds, e.target.value] })
              }}
            >
              <option value="">+ Agregar universidad...</option>
              {universidades
                ?.filter((u) => !formulario.universidadesObjetivoIds.includes(u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.siglas}
                  </option>
                ))}
            </select>
          </div>
        </FieldGroup>
      </div>
    </Modal>
  )
}
