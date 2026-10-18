import { Link } from 'react-router-dom'
import { Alert, Badge, EmptyState, Icon } from '../../components/ui'
import PasoComposicion from './PasoComposicion'
import PasoDatosBasicos from './PasoDatosBasicos'
import PasoPublicar from './PasoPublicar'
import Stepper from './StepperEditor'
import { useEditorExamen } from './useEditorExamen'

/** Crear/editar/publicar un examen a pantalla completa, en 3 pasos (datos -> composicion ->
 * publicar). Ruta /admin/examenes/:examenId (o /docente/...); "nuevo" para crear. */
export default function EditorExamenPage() {
  const editor = useEditorExamen()
  const {
    base,
    contenedor,
    cargando,
    errorCarga,
    examen,
    publicado,
    universidadNombre,
    esFija,
    haySinGuardar,
    paso,
    estados,
    irAPaso,
    error,
    mensajeExito,
  } = editor

  if (cargando) {
    return (
      <div className={contenedor}>
        <EmptyState icon="hourglass_empty" title="Cargando examen..." />
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className={contenedor}>
        <Alert>{errorCarga}</Alert>
        <Link to={base} className="text-sm font-semibold text-primary-600 hover:underline">
          Volver a exámenes
        </Link>
      </div>
    )
  }

  return (
    <div className={contenedor}>
      <div className="flex flex-col gap-4">
        <Link to={base} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-slate-500 transition-colors hover:text-primary-600">
          <Icon name="arrow_back" size={18} />
          Exámenes
        </Link>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-slate-900">{examen?.nombre || 'Nuevo examen'}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {examen ? <Badge tone={publicado ? 'success' : 'neutral'}>{publicado ? 'Publicado' : 'Borrador'}</Badge> : <Badge tone="primary">Sin crear</Badge>}
              {universidadNombre && <span>{universidadNombre}</span>}
              {examen && <span>· {esFija ? 'Fijo' : 'Aleatorio por área'}</span>}
            </div>
          </div>
          {haySinGuardar && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Cambios sin guardar
            </span>
          )}
        </header>
      </div>

      <Stepper paso={paso} estados={estados} onCambiar={irAPaso} />

      {publicado && paso !== 3 && (
        <Alert tone="warning">Este examen ya está publicado y los estudiantes pueden rendirlo. Los cambios que guardes les afectarán directamente.</Alert>
      )}
      {error && <Alert>{error}</Alert>}
      {mensajeExito && <Alert tone="success">{mensajeExito}</Alert>}

      {paso === 1 && <PasoDatosBasicos editor={editor} />}
      {paso === 2 && examen && <PasoComposicion editor={editor} />}
      {paso === 3 && examen && <PasoPublicar editor={editor} examen={examen} />}
    </div>
  )
}
