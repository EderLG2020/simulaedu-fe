import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { obtenerExamen, type ExamenResumen } from '../../api/examenesApi'
import {
  autoguardarRespuesta,
  finalizarSimulacro,
  marcarParaRevision,
  obtenerTiempoRestante,
  pausarSimulacro,
  reanudarSimulacro,
  type PreguntaSimulacro,
  type SimulacroActual,
} from '../../api/simulacrosApi'
import { tieneRespuesta } from './formatoSimulacro'
import { useAtajosSimulacro } from './useAtajosSimulacro'

const INTERVALO_SINCRONIZACION_MS = 10_000
const DEBOUNCE_NUMERICA_MS = 500

export type EstadoGuardado = 'inactivo' | 'guardando' | 'guardado' | 'error'

interface EstadoUbicacion {
  simulacro?: SimulacroActual
}

/** Estado de un simulacro en curso: carga/reanudacion, cronometro sincronizado con el servidor, autoguardado
 * de respuestas, pausa, navegacion entre preguntas y finalizacion. La pantalla solo pinta lo que devuelve. */
export function useSimulacro() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const simulacroInicial = (location.state as EstadoUbicacion | null)?.simulacro

  const [simulacro, setSimulacro] = useState<SimulacroActual | null>(simulacroInicial ?? null)
  const [examen, setExamen] = useState<ExamenResumen | null>(null)
  const [indiceActual, setIndiceActual] = useState(0)
  const [indiceMaximoVisitado, setIndiceMaximoVisitado] = useState(0)
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null)
  const [cargando, setCargando] = useState(!simulacroInicial)
  const [error, setError] = useState<string | null>(null)
  const [pausando, setPausando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [confirmandoFinalizar, setConfirmandoFinalizar] = useState(false)
  const [navegadorAbierto, setNavegadorAbierto] = useState(false)
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('inactivo')
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const guardadosPendientesRef = useRef(0)
  const examenRef = useRef<ExamenResumen | null>(null)

  // Siempre se pide el estado fresco al montar, incluso si location.state ya
  // trae uno (ese `history.state` sobrevive a una recarga F5 - no sirve como
  // señal de "ya tengo datos actuales"). El valor de location.state solo se
  // usa para pintar de inmediato sin parpadeo; reanudar() lo corrige enseguida
  // con las respuestas/tiempo reales (RF-07) - si ya esta finalizado, cae al
  // catch y se pide el resumen en su lugar.
  useEffect(() => {
    if (!id) return
    reanudarSimulacro(id)
      .then((actual) => {
        setSimulacro(actual)
        setCargando(false)
      })
      .catch(async (err) => {
        if (err instanceof ApiError && err.code === 'SIMULACRO_NO_EDITABLE') {
          const resumen = await finalizarSimulacro(id)
          navigate(`/simulacros/${id}/resumen`, { replace: true, state: { resumen } })
          return
        }
        setError('No se pudo cargar el simulacro.')
        setCargando(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo una vez al montar (por id), no en cada cambio de simulacro
  }, [id])

  // Nombre, universidad y puntajes del examen: el simulacro solo trae examenId. Es decorativo, un fallo no bloquea.
  const examenId = simulacro?.examenId
  useEffect(() => {
    if (!examenId) return
    obtenerExamen(examenId)
      .then((e) => {
        examenRef.current = e
        setExamen(e)
      })
      .catch(() => {})
  }, [examenId])

  const finalizar = useCallback(async () => {
    if (!id) return
    setFinalizando(true)
    try {
      const resumen = await finalizarSimulacro(id)
      navigate(`/simulacros/${id}/resumen`, { state: { resumen, examen: examenRef.current } })
    } catch {
      setError('No se pudo finalizar el simulacro.')
      setFinalizando(false)
      setConfirmandoFinalizar(false)
    }
  }, [id, navigate])

  // RF-02: countdown local, resincronizado contra el servidor cada 10s
  // (docs/02-arquitectura.md secc. 6.9 - polling ligero, alternativa al WS).
  const simulacroId = simulacro?.id
  const simulacroEstado = simulacro?.estado
  useEffect(() => {
    if (!simulacroId || simulacroEstado !== 'EN_CURSO') return
    let cancelado = false

    async function sincronizar() {
      try {
        const tiempo = await obtenerTiempoRestante(simulacroId!)
        if (cancelado) return
        setSegundosRestantes(tiempo.segundosRestantes)
        if (tiempo.expirado) {
          await finalizar()
        }
      } catch {
        // fallo transitorio de red: se reintenta en el siguiente tick
      }
    }

    sincronizar()
    const intervalo = setInterval(sincronizar, INTERVALO_SINCRONIZACION_MS)
    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [simulacroId, simulacroEstado, finalizar])

  // countdown visual entre sincronizaciones, contra el reloj local
  useEffect(() => {
    if (simulacroEstado !== 'EN_CURSO') return
    const intervalo = setInterval(() => {
      setSegundosRestantes((actual) => (actual !== null ? Math.max(0, actual - 1) : actual))
    }, 1000)
    return () => clearInterval(intervalo)
  }, [simulacroEstado])

  const preguntaActual: PreguntaSimulacro | undefined = simulacro?.preguntas[indiceActual]
  const indiceMaximoPermitido = simulacro?.navegacion === 'SECUENCIAL' ? indiceMaximoVisitado : (simulacro?.preguntas.length ?? 1) - 1

  const actualizarRespuestaLocal = (respuestaSimulacroId: string, respuestaDada: Record<string, unknown>) => {
    setSimulacro((actual) => {
      if (!actual) return actual
      return {
        ...actual,
        preguntas: actual.preguntas.map((p) => (p.respuestaSimulacroId === respuestaSimulacroId ? { ...p, respuestaDada } : p)),
      }
    })
  }

  /** Envia al servidor y refleja el estado en el indicador "Guardando... / Guardado". */
  function enviarRespuesta(respuestaSimulacroId: string, respuestaDada: Record<string, unknown>) {
    if (!id) return
    guardadosPendientesRef.current += 1
    setEstadoGuardado('guardando')
    autoguardarRespuesta(id, respuestaSimulacroId, respuestaDada)
      .then(() => {
        guardadosPendientesRef.current -= 1
        if (guardadosPendientesRef.current === 0) setEstadoGuardado('guardado')
      })
      .catch(() => {
        guardadosPendientesRef.current -= 1
        setEstadoGuardado('error')
        setError('No se pudo guardar tu respuesta, revisa tu conexión.')
      })
  }

  function guardarRespuesta(respuestaSimulacroId: string, respuestaDada: Record<string, unknown>) {
    actualizarRespuestaLocal(respuestaSimulacroId, respuestaDada)
    enviarRespuesta(respuestaSimulacroId, respuestaDada)
  }

  function guardarRespuestaConDebounce(respuestaSimulacroId: string, respuestaDada: Record<string, unknown>) {
    actualizarRespuestaLocal(respuestaSimulacroId, respuestaDada)
    const pendientes = debounceRef.current
    const anterior = pendientes.get(respuestaSimulacroId)
    if (anterior) clearTimeout(anterior)
    pendientes.set(
      respuestaSimulacroId,
      setTimeout(() => {
        enviarRespuesta(respuestaSimulacroId, respuestaDada)
        pendientes.delete(respuestaSimulacroId)
      }, DEBOUNCE_NUMERICA_MS),
    )
  }

  function alternarMarcaRevision(pregunta: PreguntaSimulacro) {
    if (!id) return
    const nuevaMarca = !pregunta.marcadaParaRevision
    setSimulacro((actual) => {
      if (!actual) return actual
      return {
        ...actual,
        preguntas: actual.preguntas.map((p) =>
          p.respuestaSimulacroId === pregunta.respuestaSimulacroId ? { ...p, marcadaParaRevision: nuevaMarca } : p,
        ),
      }
    })
    marcarParaRevision(id, pregunta.respuestaSimulacroId, nuevaMarca).catch(() => {
      setError('No se pudo actualizar la marca de revisión.')
    })
  }

  function irAPregunta(indice: number) {
    if (!simulacro || indice < 0 || indice >= simulacro.preguntas.length) return
    if (simulacro.navegacion === 'SECUENCIAL' && indice > indiceMaximoVisitado + 1) return
    setIndiceActual(indice)
    setIndiceMaximoVisitado((max) => Math.max(max, indice))
    setNavegadorAbierto(false)
  }

  async function cambiarPausa(accion: 'pausar' | 'reanudar') {
    if (!id) return
    setPausando(true)
    try {
      setSimulacro(accion === 'pausar' ? await pausarSimulacro(id) : await reanudarSimulacro(id))
    } catch {
      setError(accion === 'pausar' ? 'No se pudo pausar el simulacro.' : 'No se pudo reanudar el simulacro.')
    } finally {
      setPausando(false)
    }
  }

  const conteo = useMemo(() => {
    const preguntas = simulacro?.preguntas ?? []
    const respondidas = preguntas.filter((p) => tieneRespuesta(p.respuestaDada)).length
    return { total: preguntas.length, respondidas, marcadas: preguntas.filter((p) => p.marcadaParaRevision).length }
  }, [simulacro])

  const pausado = simulacro?.estado === 'PAUSADO'

  useAtajosSimulacro({ preguntaActual, inactivo: pausado || confirmandoFinalizar, indiceActual, irAPregunta, guardarRespuesta })

  const cerrarConfirmacion = useCallback(() => setConfirmandoFinalizar(false), [])

  return {
    simulacro,
    examen,
    cargando,
    error,
    setError,
    indiceActual,
    indiceMaximoPermitido,
    preguntaActual,
    segundosRestantes,
    pausado,
    pausando,
    finalizando,
    confirmandoFinalizar,
    setConfirmandoFinalizar,
    cerrarConfirmacion,
    navegadorAbierto,
    setNavegadorAbierto,
    estadoGuardado,
    conteo,
    finalizar,
    guardarRespuesta,
    guardarRespuestaConDebounce,
    alternarMarcaRevision,
    irAPregunta,
    cambiarPausa,
  }
}
