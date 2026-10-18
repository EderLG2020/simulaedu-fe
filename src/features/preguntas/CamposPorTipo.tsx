import { Button, buttonClasses, cn, Field, FieldGroup, Icon, Input, Select, Textarea } from '../../components/ui'
import { letra } from './etiquetasPregunta'
import type { ParForm } from './formularioPregunta'
import type { EstadoFormularioPregunta } from './useFormularioPregunta'

/** Lista editable de textos (columnas de emparejamiento). */
function ListaEditable({ titulo, valores, onChange }: { titulo: string; valores: string[]; onChange: (valores: string[]) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-500">{titulo}</span>
      {valores.map((valor, i) => (
        <Input
          key={i}
          aria-label={`${titulo} ${i + 1}`}
          value={valor}
          placeholder={`Item ${i + 1}`}
          onChange={(e) => onChange(valores.map((v, idx) => (idx === i ? e.target.value : v)))}
        />
      ))}
      <Button variant="ghost" size="sm" icon="add" className="self-start" onClick={() => onChange([...valores, ''])}>
        Agregar item
      </Button>
    </div>
  )
}

/** Campos que dependen del tipo de pregunta: alternativas, emparejamiento, desarrollo o numerica. */
export default function CamposPorTipo({ form }: { form: EstadoFormularioPregunta }) {
  const { formulario, setFormulario, esOpciones, subiendoImagen, actualizarAlternativa, handleImagenAlternativa } = form

  return (
    <>
      {esOpciones && (
        <FieldGroup label={formulario.tipoPregunta === 'OPCION_UNICA' ? 'Alternativas · marca la correcta' : 'Alternativas · marca todas las correctas'}>
          <div className="flex flex-col gap-2">
            {formulario.alternativas.map((alt, i) => {
              const subiendo = subiendoImagen === `alternativa-${i}`
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border p-2 transition-colors',
                    alt.esCorrecta ? 'border-primary-600/40 bg-primary-50' : 'border-slate-200 bg-white',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      alt.esCorrecta ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {letra(i)}
                  </span>
                  <input
                    type={formulario.tipoPregunta === 'OPCION_UNICA' ? 'radio' : 'checkbox'}
                    name="alternativa-correcta"
                    aria-label={`Marcar ${letra(i)} como correcta`}
                    checked={alt.esCorrecta}
                    onChange={(e) => actualizarAlternativa(i, { esCorrecta: e.target.checked })}
                    className="h-4 w-4 shrink-0 accent-primary-600"
                  />
                  <Input
                    aria-label={`Texto de la alternativa ${letra(i)}`}
                    className="h-9"
                    value={alt.textoHtml}
                    onChange={(e) => actualizarAlternativa(i, { textoHtml: e.target.value })}
                    placeholder={`Alternativa ${letra(i)}`}
                  />
                  {alt.imagenUrl && (
                    <span className="relative shrink-0">
                      <img src={alt.imagenUrl} alt="" className="h-9 w-9 rounded-md border border-slate-200 object-cover" />
                      <button
                        type="button"
                        aria-label={`Quitar imagen de la alternativa ${letra(i)}`}
                        onClick={() => actualizarAlternativa(i, { imagenUrl: null })}
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-white"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </span>
                  )}
                  <label title="Adjuntar imagen" className={buttonClasses('ghost', 'icon', 'focus-within:outline-2 focus-within:outline-primary-600')}>
                    <Icon name={subiendo ? 'progress_activity' : 'image'} className={subiendo ? 'animate-spin' : undefined} />
                    <span className="sr-only">Adjuntar imagen a la alternativa {letra(i)}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleImagenAlternativa(i, e)} />
                  </label>
                  {formulario.alternativas.length > 2 && (
                    <Button
                      variant="danger"
                      size="icon"
                      aria-label={`Eliminar alternativa ${letra(i)}`}
                      onClick={() => setFormulario({ ...formulario, alternativas: formulario.alternativas.filter((_, idx) => idx !== i) })}
                    >
                      <Icon name="close" />
                    </Button>
                  )}
                </div>
              )
            })}
            <Button
              variant="ghost"
              size="sm"
              icon="add"
              className="self-start text-primary-600"
              onClick={() => setFormulario({ ...formulario, alternativas: [...formulario.alternativas, { textoHtml: '', imagenUrl: null, esCorrecta: false }] })}
            >
              Agregar alternativa
            </Button>
          </div>
        </FieldGroup>
      )}

      {formulario.tipoPregunta === 'EMPAREJAMIENTO' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <ListaEditable titulo="Columna izquierda" valores={formulario.columnaIzquierda} onChange={(columnaIzquierda) => setFormulario({ ...formulario, columnaIzquierda })} />
            <ListaEditable titulo="Columna derecha" valores={formulario.columnaDerecha} onChange={(columnaDerecha) => setFormulario({ ...formulario, columnaDerecha })} />
          </div>
          <FieldGroup label="Pares correctos">
            {formulario.paresCorrectos.map((par, i) => {
              const actualizarPar = (cambios: Partial<ParForm>) =>
                setFormulario({ ...formulario, paresCorrectos: formulario.paresCorrectos.map((p, idx) => (idx === i ? { ...p, ...cambios } : p)) })
              return (
                <div key={i} className="flex items-center gap-2">
                  <Select aria-label={`Par ${i + 1}, izquierda`} className="h-9" value={par.izquierda} onChange={(e) => actualizarPar({ izquierda: Number(e.target.value) })}>
                    {formulario.columnaIzquierda.map((v, idx) => (
                      <option key={idx} value={idx}>
                        {v || `Item ${idx + 1}`}
                      </option>
                    ))}
                  </Select>
                  <Icon name="arrow_right_alt" className="text-slate-500" />
                  <Select aria-label={`Par ${i + 1}, derecha`} className="h-9" value={par.derecha} onChange={(e) => actualizarPar({ derecha: Number(e.target.value) })}>
                    {formulario.columnaDerecha.map((v, idx) => (
                      <option key={idx} value={idx}>
                        {v || `Item ${idx + 1}`}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="danger"
                    size="icon"
                    aria-label={`Eliminar par ${i + 1}`}
                    onClick={() => setFormulario({ ...formulario, paresCorrectos: formulario.paresCorrectos.filter((_, idx) => idx !== i) })}
                  >
                    <Icon name="close" />
                  </Button>
                </div>
              )
            })}
            <Button
              variant="ghost"
              size="sm"
              icon="add"
              className="self-start"
              onClick={() => setFormulario({ ...formulario, paresCorrectos: [...formulario.paresCorrectos, { izquierda: 0, derecha: 0 }] })}
            >
              Agregar par
            </Button>
          </FieldGroup>
        </div>
      )}

      {formulario.tipoPregunta === 'DESARROLLO' && (
        <div className="flex flex-col gap-4">
          <Field label="Límite de caracteres" className="max-w-[12rem]">
            <Input type="number" min="1" value={formulario.limiteCaracteres} onChange={(e) => setFormulario({ ...formulario, limiteCaracteres: e.target.value })} />
          </Field>
          <Field label="Rúbrica de evaluación">
            <Textarea
              rows={3}
              value={formulario.rubricaEvaluacion}
              onChange={(e) => setFormulario({ ...formulario, rubricaEvaluacion: e.target.value })}
              placeholder="Ej: 2 pts por justificación teórica, 2 pts por resolución..."
            />
          </Field>
        </div>
      )}

      {formulario.tipoPregunta === 'NUMERICA' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Formato de respuesta">
            <Select value={formulario.formatoRespuesta} onChange={(e) => setFormulario({ ...formulario, formatoRespuesta: e.target.value })}>
              <option value="entero">Entero</option>
              <option value="decimal">Decimal</option>
            </Select>
          </Field>
          <Field label="Valor correcto">
            <Input type="number" step="any" value={formulario.valorCorrecto} onChange={(e) => setFormulario({ ...formulario, valorCorrecto: e.target.value })} />
          </Field>
        </div>
      )}
    </>
  )
}
