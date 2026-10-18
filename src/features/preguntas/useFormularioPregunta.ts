import { useState } from 'react'
import { mensajeDeError } from '../../api/client'
import { actualizarPregunta, crearPregunta, subirArchivoPregunta, subirImagenPregunta, type Pregunta } from '../../api/preguntasApi'
import {
  envolverSeleccion,
  escaparCodigo,
  formularioARequest,
  FORMULARIO_VACIO,
  preguntaAFormulario,
  type AlternativaForm,
  type FormularioPregunta,
} from './formularioPregunta'

/** Estado del modal de crear/editar pregunta: formulario, subidas de imagen/audio, formato del enunciado y
 * guardado. Vive en la pagina (no en el modal) para que la vista previa se recuerde entre aperturas. */
export function useFormularioPregunta(onGuardado: () => void) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [preguntaEnEdicion, setPreguntaEnEdicion] = useState<Pregunta | null>(null)
  const [formulario, setFormulario] = useState<FormularioPregunta>(FORMULARIO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState<string | null>(null)
  const [subiendoAudio, setSubiendoAudio] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState(false)

  function abrirCrear() {
    setPreguntaEnEdicion(null)
    setFormulario(FORMULARIO_VACIO)
    setErrorFormulario(null)
    setModalAbierto(true)
  }

  function abrirEditar(pregunta: Pregunta) {
    setPreguntaEnEdicion(pregunta)
    setFormulario(preguntaAFormulario(pregunta))
    setErrorFormulario(null)
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setPreguntaEnEdicion(null)
  }

  async function handleGuardar() {
    setErrorFormulario(null)
    if (!formulario.temaId) {
      setErrorFormulario('Selecciona un tema.')
      return
    }
    setGuardando(true)
    try {
      const request = formularioARequest(formulario)
      if (preguntaEnEdicion) {
        await actualizarPregunta(preguntaEnEdicion.id, request)
      } else {
        await crearPregunta(request)
      }
      cerrarModal()
      onGuardado()
    } catch (err) {
      setErrorFormulario(mensajeDeError(err, 'No se pudo guardar la pregunta.'))
    } finally {
      setGuardando(false)
    }
  }

  async function handleInsertarImagenEnunciado(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    setSubiendoImagen('enunciado')
    try {
      const url = await subirImagenPregunta(archivo)
      setFormulario((f) => ({ ...f, enunciadoHtml: `${f.enunciadoHtml}\n<img src="${url}" alt="" />` }))
    } catch {
      setErrorFormulario('No se pudo subir la imagen.')
    } finally {
      setSubiendoImagen(null)
    }
  }

  /** Listening: el audio se sube a Cloudinary y queda como reproductor en el enunciado. */
  async function handleInsertarAudioEnunciado(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    setSubiendoAudio(true)
    try {
      const url = await subirArchivoPregunta(archivo)
      setFormulario((f) => ({ ...f, enunciadoHtml: `${f.enunciadoHtml}
<p><audio controls preload="none" src="${url}"></audio></p>` }))
    } catch (err) {
      setErrorFormulario(mensajeDeError(err, 'No se pudo subir el audio.'))
    } finally {
      setSubiendoAudio(false)
    }
  }

  /** Envuelve la seleccion en un bloque de codigo, escapada para que `<`, `>` y `&` se vean tal cual. */
  function insertarCodigo() {
    const textarea = document.getElementById('enunciado-textarea') as HTMLTextAreaElement | null
    if (!textarea) return
    const { selectionStart: inicio, selectionEnd: fin } = textarea
    const codigo = escaparCodigo(formulario.enunciadoHtml.slice(inicio, fin)) || '// tu codigo aqui'
    const bloque = `<pre><code>${codigo}</code></pre>`
    setFormulario((f) => ({ ...f, enunciadoHtml: f.enunciadoHtml.slice(0, inicio) + bloque + f.enunciadoHtml.slice(fin) }))
  }

  function aplicarFormato(tagAbre: string, tagCierra: string) {
    const textarea = document.getElementById('enunciado-textarea') as HTMLTextAreaElement | null
    if (!textarea) return
    const { texto } = envolverSeleccion(formulario.enunciadoHtml, textarea.selectionStart, textarea.selectionEnd, tagAbre, tagCierra)
    setFormulario((f) => ({ ...f, enunciadoHtml: texto }))
  }

  function actualizarAlternativa(indice: number, cambios: Partial<AlternativaForm>) {
    setFormulario((f) => {
      const alternativas = f.alternativas.map((a, i) => {
        if (i !== indice) {
          // opcion_unica: marcar una correcta desmarca las demas
          return f.tipoPregunta === 'OPCION_UNICA' && cambios.esCorrecta ? { ...a, esCorrecta: false } : a
        }
        return { ...a, ...cambios }
      })
      return { ...f, alternativas }
    })
  }

  async function handleImagenAlternativa(indice: number, evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    setSubiendoImagen(`alternativa-${indice}`)
    try {
      const url = await subirImagenPregunta(archivo)
      actualizarAlternativa(indice, { imagenUrl: url })
    } catch {
      setErrorFormulario('No se pudo subir la imagen.')
    } finally {
      setSubiendoImagen(null)
    }
  }

  const esOpciones = formulario.tipoPregunta === 'OPCION_UNICA' || formulario.tipoPregunta === 'OPCION_MULTIPLE'

  return {
    modalAbierto,
    preguntaEnEdicion,
    formulario,
    setFormulario,
    errorFormulario,
    guardando,
    subiendoImagen,
    subiendoAudio,
    vistaPrevia,
    setVistaPrevia,
    esOpciones,
    abrirCrear,
    abrirEditar,
    cerrarModal,
    handleGuardar,
    handleInsertarImagenEnunciado,
    handleInsertarAudioEnunciado,
    insertarCodigo,
    aplicarFormato,
    actualizarAlternativa,
    handleImagenAlternativa,
  }
}

export type EstadoFormularioPregunta = ReturnType<typeof useFormularioPregunta>
