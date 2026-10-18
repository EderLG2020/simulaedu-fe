import type { NavegacionExamen } from '../../api/examenesApi'
import { Button, cn, Field, Icon, Input, SegmentedControl, Select, Textarea } from '../../components/ui'
import { EtiquetaConInfo, SeccionCard } from './ComponentesEditor'
import { MAX_DESCRIPCION, TIPOS_EXAMEN } from './formularioExamen'
import { ETIQUETA_TIPO } from './resumenExamenes'
import type { EditorExamen } from './useEditorExamen'

/** Paso 1: universidad, nombre, tipo, reglas de tiempo/navegacion. Crear el examen habilita los pasos siguientes. */
export default function PasoDatosBasicos({ editor }: { editor: EditorExamen }) {
  const { formulario, setFormulario, universidades, examen, basicoSucio, irAPaso, handleGuardarBasico, guardando } = editor

  return (
    <SeccionCard titulo="Datos básicos" descripcion="El programa y el tipo de selección no se pueden cambiar después de crear el examen.">
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
        <Field label="Universidad o programa" hint="Solo podrás usar preguntas generales o etiquetadas para este programa.">
          <Select value={formulario.universidadId} onChange={(e) => setFormulario({ ...formulario, universidadId: e.target.value })} disabled={!!examen}>
            <option value="">Selecciona...</option>
            {universidades?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Nombre">
          <Input placeholder="Ej. Simulacro UNMSM - Área A" value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} />
        </Field>

        <div className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Tipo de examen</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TIPOS_EXAMEN.map((t) => {
              const elegido = formulario.tipo === t.valor
              return (
                <button
                  key={t.valor}
                  type="button"
                  aria-pressed={elegido}
                  onClick={() => setFormulario({ ...formulario, tipo: t.valor })}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
                    elegido ? 'border-primary-600 bg-primary-50/70 ring-1 ring-primary-600' : 'border-slate-200 bg-white hover:bg-slate-50',
                  )}
                >
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', elegido ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500')}>
                    <Icon name={ETIQUETA_TIPO[t.valor].icono} size={20} />
                  </span>
                  <span>
                    <span className={cn('block text-sm font-semibold', elegido ? 'text-primary-700' : 'text-slate-900')}>{ETIQUETA_TIPO[t.valor].texto}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{t.ayuda}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <Field label="Descripción (opcional)" hint="Cuéntale al alumno qué va a practicar." className="md:col-span-2">
          <Textarea
            rows={2}
            maxLength={MAX_DESCRIPCION}
            placeholder="Ej. Practica am/is/are en oraciones afirmativas, negativas y preguntas."
            value={formulario.descripcion}
            onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
          />
          <span className="self-end text-xs text-slate-500">
            {formulario.descripcion.length} / {MAX_DESCRIPCION}
          </span>
        </Field>

        <Field label="Duración (minutos)" hint="Al acabarse el tiempo, el simulacro se entrega automáticamente.">
          <Input type="number" min="1" value={formulario.duracionMinutos} onChange={(e) => setFormulario({ ...formulario, duracionMinutos: e.target.value })} />
        </Field>

        <Field label="Puntaje total" hint="Para publicar, la suma de puntajes de la composición debe ser exactamente este número.">
          <Input type="number" min="1" value={formulario.puntajeTotal} onChange={(e) => setFormulario({ ...formulario, puntajeTotal: e.target.value })} />
        </Field>

        <div className="flex flex-col gap-2 md:col-span-2">
          <EtiquetaConInfo
            texto="Tipo de selección"
            info={
              <>
                <b>Fijo:</b> todos los estudiantes reciben las mismas preguntas que tú eliges. <b>Aleatorio por área:</b> defines cuántas preguntas
                de cada curso/tema y el sistema sortea preguntas distintas para cada estudiante.
              </>
            }
          />
          {/* Opciones con icono, descripcion y estado disabled: SegmentedControl no soporta las dos ultimas. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['FIJA', 'ALEATORIA_POR_AREA'] as const).map((tipo) => {
              const elegido = formulario.tipoSeleccion === tipo
              const fijo = tipo === 'FIJA'
              return (
                <button
                  key={tipo}
                  type="button"
                  disabled={!!examen}
                  aria-pressed={elegido}
                  onClick={() => setFormulario({ ...formulario, tipoSeleccion: tipo })}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
                    elegido ? 'border-primary-600 bg-primary-50/70 ring-1 ring-primary-600' : 'border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50',
                  )}
                >
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', elegido ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500')}>
                    <Icon name={fijo ? 'format_list_numbered' : 'autorenew'} size={20} />
                  </span>
                  <span>
                    <span className={cn('block text-sm font-semibold', elegido ? 'text-primary-700' : 'text-slate-900')}>{fijo ? 'Fijo' : 'Aleatorio por área'}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {fijo ? 'Tú eliges cada pregunta y su puntaje.' : 'Defines cursos/temas y cantidades; el sistema sortea las preguntas.'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <EtiquetaConInfo
            texto="Navegación"
            info={
              <>
                <b>Libre:</b> el estudiante puede saltar entre preguntas y volver a las anteriores. <b>Secuencial:</b> avanza en orden y no puede
                adelantarse a preguntas que aún no ha visto (sí puede volver a las anteriores).
              </>
            }
          />
          <SegmentedControl
            options={[
              { value: 'LIBRE', label: 'Libre', icon: 'swap_horiz' },
              { value: 'SECUENCIAL', label: 'Secuencial', icon: 'arrow_forward' },
            ]}
            value={formulario.navegacion}
            onChange={(valor) => setFormulario({ ...formulario, navegacion: valor as NavegacionExamen })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">Pausa</span>
          <label className="flex h-10 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
            <input
              type="checkbox"
              role="switch"
              checked={formulario.permitePausa}
              onChange={(e) => setFormulario({ ...formulario, permitePausa: e.target.checked })}
              className="peer sr-only"
            />
            <span className="relative h-5 w-9 shrink-0 rounded-full bg-slate-200 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-primary-600 peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-primary-600" />
            <span className="text-sm text-slate-700">{formulario.permitePausa ? 'El estudiante puede pausar (el cronómetro se detiene)' : 'Sin pausa'}</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5">
        {examen && !basicoSucio ? (
          <Button icon="arrow_forward" onClick={() => irAPaso(2)}>
            Siguiente: composición
          </Button>
        ) : (
          <Button onClick={handleGuardarBasico} loading={guardando}>
            {examen ? 'Guardar cambios' : 'Crear y continuar'}
          </Button>
        )}
      </div>
    </SeccionCard>
  )
}
