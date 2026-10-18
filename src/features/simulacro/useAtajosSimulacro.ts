import { useEffect, useRef } from 'react'
import type { PreguntaSimulacro } from '../../api/simulacrosApi'
import { alternativasOrdenadas } from './formatoSimulacro'

interface OpcionesAtajos {
  preguntaActual: PreguntaSimulacro | undefined
  /** En pausa o con el modal de finalizar abierto los atajos no hacen nada. */
  inactivo: boolean
  indiceActual: number
  irAPregunta: (indice: number) => void
  guardarRespuesta: (respuestaSimulacroId: string, respuestaDada: Record<string, unknown>) => void
}

/** Atajos: A-E eligen alternativa, flechas navegan. Se ignoran al escribir en un campo, en pausa o con el modal abierto.
 * El oyente global lee siempre la version mas reciente via ref (se reasigna tras cada render, no durante). */
export function useAtajosSimulacro({ preguntaActual, inactivo, indiceActual, irAPregunta, guardarRespuesta }: OpcionesAtajos) {
  const manejarTecla = useRef<(e: KeyboardEvent) => void>(() => {})
  const manejarTeclaActual = (e: KeyboardEvent) => {
    if (!preguntaActual || inactivo || e.ctrlKey || e.metaKey || e.altKey) return
    const destino = e.target as HTMLElement | null
    // SELECT: en emparejamiento las flechas cambian la opcion elegida, no de pregunta.
    if (destino && (['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName) || destino.isContentEditable)) return

    if (e.key === 'ArrowRight') return irAPregunta(indiceActual + 1)
    if (e.key === 'ArrowLeft') return irAPregunta(indiceActual - 1)

    const indiceLetra = 'abcdefgh'.indexOf(e.key.toLowerCase())
    const alternativas = alternativasOrdenadas(preguntaActual)
    if (e.key.length !== 1 || indiceLetra < 0 || indiceLetra >= alternativas.length) return
    const alternativa = alternativas[indiceLetra]
    if (preguntaActual.tipoPregunta === 'OPCION_UNICA') {
      guardarRespuesta(preguntaActual.respuestaSimulacroId, { alternativaId: alternativa.id })
    } else if (preguntaActual.tipoPregunta === 'OPCION_MULTIPLE') {
      const actuales = (preguntaActual.respuestaDada.alternativaIds as string[] | undefined) ?? []
      const nuevas = actuales.includes(alternativa.id) ? actuales.filter((x) => x !== alternativa.id) : [...actuales, alternativa.id]
      guardarRespuesta(preguntaActual.respuestaSimulacroId, { alternativaIds: nuevas })
    }
  }
  useEffect(() => {
    manejarTecla.current = manejarTeclaActual
  })
  useEffect(() => {
    const oyente = (e: KeyboardEvent) => manejarTecla.current(e)
    window.addEventListener('keydown', oyente)
    return () => window.removeEventListener('keydown', oyente)
  }, [])
}
