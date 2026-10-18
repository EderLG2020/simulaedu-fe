import { Button, buttonClasses, Icon } from '../../components/ui'
import { htmlSeguro } from '../../lib/html'
import { CLASE_HTML_ENRIQUECIDO } from '../simulacro/estilosSimulacro'
import type { EstadoFormularioPregunta } from './useFormularioPregunta'

/** Editor del enunciado: barra de formato (tags HTML, imagen, audio, codigo, LaTeX), textarea y vista previa. */
export default function EditorEnunciado({ form }: { form: EstadoFormularioPregunta }) {
  const {
    formulario,
    setFormulario,
    subiendoImagen,
    subiendoAudio,
    vistaPrevia,
    setVistaPrevia,
    aplicarFormato,
    insertarCodigo,
    handleInsertarImagenEnunciado,
    handleInsertarAudioEnunciado,
  } = form

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 transition-colors focus-within:border-primary-600 focus-within:ring-3 focus-within:ring-primary-600/15">
      <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-1.5 py-1">
        <Button variant="ghost" size="icon" title="Negrita" aria-label="Negrita" className="font-bold" onClick={() => aplicarFormato('<strong>', '</strong>')}>
          B
        </Button>
        <Button variant="ghost" size="icon" title="Cursiva" aria-label="Cursiva" className="italic" onClick={() => aplicarFormato('<em>', '</em>')}>
          I
        </Button>
        <Button variant="ghost" size="icon" title="Subrayado" aria-label="Subrayado" className="underline" onClick={() => aplicarFormato('<u>', '</u>')}>
          U
        </Button>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <label title="Insertar imagen" className={buttonClasses('ghost', 'icon', 'focus-within:outline-2 focus-within:outline-primary-600')}>
          <Icon name={subiendoImagen === 'enunciado' ? 'progress_activity' : 'add_photo_alternate'} className={subiendoImagen === 'enunciado' ? 'animate-spin' : undefined} />
          <span className="sr-only">Insertar imagen</span>
          <input type="file" accept="image/*" className="sr-only" onChange={handleInsertarImagenEnunciado} />
        </label>
        <label title="Insertar audio (listening): mp3, wav, ogg o m4a" className={buttonClasses('ghost', 'icon', 'focus-within:outline-2 focus-within:outline-primary-600')}>
          <Icon name={subiendoAudio ? 'progress_activity' : 'play_circle'} className={subiendoAudio ? 'animate-spin' : undefined} />
          <span className="sr-only">Insertar audio</span>
          <input type="file" accept="audio/*" className="sr-only" disabled={subiendoAudio} onChange={handleInsertarAudioEnunciado} />
        </label>
        <Button variant="ghost" size="icon" icon="code" title="Bloque de código: envuelve la selección (SQL, Java...)" aria-label="Bloque de código" onClick={insertarCodigo} />
        <Button variant="ghost" size="sm" icon="function" title="Envuelve la selección en $...$ (LaTeX)" onClick={() => aplicarFormato('$', '$')}>
          LaTeX
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={vistaPrevia ? 'visibility_off' : 'visibility'}
          className="ml-auto"
          aria-pressed={vistaPrevia}
          onClick={() => setVistaPrevia((v) => !v)}
        >
          Vista previa
        </Button>
      </div>
      <textarea
        id="enunciado-textarea"
        aria-label="Enunciado"
        rows={4}
        className="w-full resize-y bg-white p-3 text-sm focus:outline-none"
        value={formulario.enunciadoHtml}
        onChange={(e) => setFormulario({ ...formulario, enunciadoHtml: e.target.value })}
        placeholder="Escribe el enunciado del problema..."
      />
      {vistaPrevia && (
        <div className="border-t border-slate-200 bg-slate-50/60 p-3">
          <span className="mb-2 block text-xs font-semibold text-slate-500">Así lo verá el estudiante</span>
          <div className={`text-[15px] leading-7 text-slate-900 ${CLASE_HTML_ENRIQUECIDO}`} dangerouslySetInnerHTML={{ __html: htmlSeguro(formulario.enunciadoHtml) }} />
        </div>
      )}
    </div>
  )
}
