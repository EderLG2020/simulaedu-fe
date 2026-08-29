import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
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
import './simulacro.css'

const INTERVALO_SINCRONIZACION_MS = 10_000
const DEBOUNCE_NUMERICA_MS = 500

function formatearTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(segundos % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

interface EstadoUbicacion {
  simulacro?: SimulacroActual
}

export default function SimulacroPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const simulacroInicial = (location.state as EstadoUbicacion | null)?.simulacro

  const [simulacro, setSimulacro] = useState<SimulacroActual | null>(simulacroInicial ?? null)
  const [indiceActual, setIndiceActual] = useState(0)
  const [indiceMaximoVisitado, setIndiceMaximoVisitado] = useState(0)
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null)
  const [cargando, setCargando] = useState(!simulacroInicial)
  const [error, setError] = useState<string | null>(null)
  const [pausando, setPausando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

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

  const finalizar = useCallback(async () => {
    if (!id) return
    setFinalizando(true)
    try {
      const resumen = await finalizarSimulacro(id)
      navigate(`/simulacros/${id}/resumen`, { state: { resumen } })
    } catch {
      setError('No se pudo finalizar el simulacro.')
      setFinalizando(false)
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

  const actualizarRespuestaLocal = (respuestaSimulacroId: string, respuestaDada: Record<string, unknown>) => {
    setSimulacro((actual) => {
      if (!actual) return actual
      return {
        ...actual,
        preguntas: actual.preguntas.map((p) =>
          p.respuestaSimulacroId === respuestaSimulacroId ? { ...p, respuestaDada } : p,
        ),
      }
    })
  }

  function guardarRespuesta(respuestaSimulacroId: string, respuestaDada: Record<string, unknown>) {
    if (!id) return
    actualizarRespuestaLocal(respuestaSimulacroId, respuestaDada)
    autoguardarRespuesta(id, respuestaSimulacroId, respuestaDada).catch(() => {
      setError('No se pudo guardar tu respuesta, revisa tu conexion.')
    })
  }

  function guardarRespuestaConDebounce(respuestaSimulacroId: string, respuestaDada: Record<string, unknown>) {
    actualizarRespuestaLocal(respuestaSimulacroId, respuestaDada)
    const pendientes = debounceRef.current
    const anterior = pendientes.get(respuestaSimulacroId)
    if (anterior) clearTimeout(anterior)
    pendientes.set(
      respuestaSimulacroId,
      setTimeout(() => {
        if (!id) return
        autoguardarRespuesta(id, respuestaSimulacroId, respuestaDada).catch(() => {
          setError('No se pudo guardar tu respuesta, revisa tu conexion.')
        })
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
      setError('No se pudo actualizar la marca de revision.')
    })
  }

  function irAPregunta(indice: number) {
    if (simulacro?.navegacion === 'SECUENCIAL' && indice > indiceMaximoVisitado) return
    setIndiceActual(indice)
    setIndiceMaximoVisitado((max) => Math.max(max, indice))
  }

  async function pausar() {
    if (!id) return
    setPausando(true)
    try {
      const actualizado = await pausarSimulacro(id)
      setSimulacro(actualizado)
    } catch {
      setError('No se pudo pausar el simulacro.')
    } finally {
      setPausando(false)
    }
  }

  async function reanudar() {
    if (!id) return
    setPausando(true)
    try {
      const actualizado = await reanudarSimulacro(id)
      setSimulacro(actualizado)
    } catch {
      setError('No se pudo reanudar el simulacro.')
    } finally {
      setPausando(false)
    }
  }

  const totalMarcadas = useMemo(
    () => simulacro?.preguntas.filter((p) => p.marcadaParaRevision).length ?? 0,
    [simulacro],
  )

  if (cargando) return <div className="simulacro-page">Cargando simulacro...</div>
  if (!simulacro) return <div className="simulacro-page">{error ?? 'Simulacro no encontrado.'}</div>

  return (
    <div className="simulacro-page">
      <header className="simulacro-header">
        <div className="simulacro-timer">
          {simulacro.estado === 'PAUSADO'
            ? 'En pausa'
            : segundosRestantes !== null
              ? formatearTiempo(segundosRestantes)
              : '--:--'}
        </div>
        <div className="simulacro-acciones-header">
          {simulacro.permitePausa && simulacro.estado === 'EN_CURSO' && (
            <button type="button" disabled={pausando} onClick={pausar}>
              Pausar
            </button>
          )}
          {simulacro.estado === 'PAUSADO' && (
            <button type="button" disabled={pausando} onClick={reanudar}>
              Reanudar
            </button>
          )}
          <button type="button" className="simulacro-finalizar" disabled={finalizando} onClick={finalizar}>
            {finalizando ? 'Finalizando...' : 'Finalizar simulacro'}
          </button>
        </div>
      </header>

      {error && <p className="simulacro-error">{error}</p>}

      <nav className="simulacro-navegacion" aria-label="Preguntas">
        {simulacro.preguntas.map((p, indice) => {
          const bloqueada = simulacro.navegacion === 'SECUENCIAL' && indice > indiceMaximoVisitado
          return (
            <button
              key={p.respuestaSimulacroId}
              type="button"
              disabled={bloqueada}
              className={
                'simulacro-nav-item' +
                (indice === indiceActual ? ' activa' : '') +
                (p.marcadaParaRevision ? ' marcada' : '') +
                (tieneRespuesta(p) ? ' respondida' : '')
              }
              onClick={() => irAPregunta(indice)}
            >
              {indice + 1}
            </button>
          )
        })}
      </nav>

      {totalMarcadas > 0 && <p className="simulacro-marcadas">{totalMarcadas} pregunta(s) marcada(s) para revision</p>}

      {preguntaActual && (
        <section className="simulacro-pregunta">
          <div className="simulacro-pregunta-header">
            <span>
              Pregunta {indiceActual + 1} de {simulacro.preguntas.length}
            </span>
            <button type="button" onClick={() => alternarMarcaRevision(preguntaActual)}>
              {preguntaActual.marcadaParaRevision ? 'Quitar marca' : 'Marcar para revisar'}
            </button>
          </div>

          <div className="simulacro-enunciado" dangerouslySetInnerHTML={{ __html: preguntaActual.enunciadoHtml }} />

          <RespuestaPregunta
            pregunta={preguntaActual}
            onCambiar={(respuestaDada) => guardarRespuesta(preguntaActual.respuestaSimulacroId, respuestaDada)}
            onCambiarConDebounce={(respuestaDada) =>
              guardarRespuestaConDebounce(preguntaActual.respuestaSimulacroId, respuestaDada)
            }
          />

          <div className="simulacro-pregunta-nav">
            <button type="button" disabled={indiceActual === 0} onClick={() => irAPregunta(indiceActual - 1)}>
              Anterior
            </button>
            <button
              type="button"
              disabled={indiceActual === simulacro.preguntas.length - 1}
              onClick={() => irAPregunta(indiceActual + 1)}
            >
              Siguiente
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function tieneRespuesta(pregunta: PreguntaSimulacro): boolean {
  const valores = Object.values(pregunta.respuestaDada)
  return valores.length > 0 && valores.some((v) => v !== null && !(Array.isArray(v) && v.length === 0))
}

function RespuestaPregunta({
  pregunta,
  onCambiar,
  onCambiarConDebounce,
}: {
  pregunta: PreguntaSimulacro
  onCambiar: (respuestaDada: Record<string, unknown>) => void
  onCambiarConDebounce: (respuestaDada: Record<string, unknown>) => void
}) {
  switch (pregunta.tipoPregunta) {
    case 'OPCION_UNICA': {
      const seleccionada = pregunta.respuestaDada.alternativaId as string | undefined
      return (
        <div className="simulacro-alternativas">
          {pregunta.alternativas.map((alt) => (
            <label key={alt.id} className="simulacro-alternativa">
              <input
                type="radio"
                name={pregunta.respuestaSimulacroId}
                checked={seleccionada === alt.id}
                onChange={() => onCambiar({ alternativaId: alt.id })}
              />
              <span dangerouslySetInnerHTML={{ __html: alt.textoHtml }} />
            </label>
          ))}
        </div>
      )
    }

    case 'OPCION_MULTIPLE': {
      const seleccionadas = (pregunta.respuestaDada.alternativaIds as string[] | undefined) ?? []
      return (
        <div className="simulacro-alternativas">
          {pregunta.alternativas.map((alt) => (
            <label key={alt.id} className="simulacro-alternativa">
              <input
                type="checkbox"
                checked={seleccionadas.includes(alt.id)}
                onChange={(e) => {
                  const nuevas = e.target.checked
                    ? [...seleccionadas, alt.id]
                    : seleccionadas.filter((id) => id !== alt.id)
                  onCambiar({ alternativaIds: nuevas })
                }}
              />
              <span dangerouslySetInnerHTML={{ __html: alt.textoHtml }} />
            </label>
          ))}
        </div>
      )
    }

    case 'NUMERICA': {
      const valor = (pregunta.respuestaDada.valor as number | undefined) ?? ''
      return (
        <input
          type="number"
          className="simulacro-input-numerico"
          value={valor}
          onChange={(e) => {
            const num = e.target.value === '' ? null : Number(e.target.value)
            onCambiarConDebounce({ valor: num })
          }}
        />
      )
    }

    default:
      return <p className="simulacro-no-soportado">Este tipo de pregunta todavia no se puede responder desde aqui.</p>
  }
}
