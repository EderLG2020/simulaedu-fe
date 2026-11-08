import { useState } from 'react'
import { mensajeDeError } from '../../../shared/api/client'
import { traducirTextos } from '../../../shared/api/traduccionApi'
import type { Idioma } from '../../../shared/lib/tipos/idioma'

/**
 * Boton «Traducir» de un campo de texto suelto (nombre de curso o de tema). Solo cambia el valor del
 * campo: quien edita lo revisa y guarda con el boton de siempre. Un campo a la vez.
 */
export function useTraducirCampo(onError: (mensaje: string) => void) {
  const [enCurso, setEnCurso] = useState<{ campo: string; idioma: Idioma } | null>(null)

  async function traducir(campo: string, texto: string, destino: Idioma, aplicar: (traducido: string) => void) {
    if (!texto.trim()) return
    setEnCurso({ campo, idioma: destino })
    try {
      const [traducido] = await traducirTextos([texto], destino)
      aplicar(traducido)
    } catch (err) {
      onError(mensajeDeError(err, 'No se pudo traducir el texto.'))
    } finally {
      setEnCurso(null)
    }
  }

  /** Idioma al que se traduce [campo] ahora, para el spinner de su boton. */
  const traduciendo = (campo: string): Idioma | null => (enCurso?.campo === campo ? enCurso.idioma : null)

  return { traducir, traduciendo, ocupado: enCurso !== null }
}
