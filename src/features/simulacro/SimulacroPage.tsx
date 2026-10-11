import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
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
import ConfirmarFinalizarModal from './ConfirmarFinalizarModal'
import { CLASE_HTML_ENRIQUECIDO } from './estilosSimulacro'
import { alternativasOrdenadas, formatearTiempo, tieneRespuesta } from './formatoSimulacro'
import NavegadorPreguntas from './NavegadorPreguntas'
import RespuestaPregunta from './RespuestaPregunta'
import { htmlSeguro } from '../../lib/html'

/** Migracion del mockup de Stitch "rendir simulacro". Se omitieron los datos que el mockup inventaba
 * (area/codigo del examen, "modelo DECO", formula de referencia, ritmo vs promedio): no existen en el backend. */

const INTERVALO_SINCRONIZACION_MS = 10_000
const DEBOUNCE_NUMERICA_MS = 500

const DIFICULTAD: Record<PreguntaSimulacro['dificultad'], { etiqueta: string; clase: string }> = {
  BAJA: { etiqueta: 'Dificultad baja', clase: 'bg-emerald-50 text-emerald-700' },
  MEDIA: { etiqueta: 'Dificultad media', clase: 'bg-amber-50 text-amber-700' },
  ALTA: { etiqueta: 'Dificultad alta', clase: 'bg-rose-50 text-rose-700' },
}

type EstadoGuardado = 'inactivo' | 'guardando' | 'guardado' | 'error'

interface EstadoUbicacion {
  simulacro?: SimulacroActual
}

export default function SimulacroPage() {
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

  // Atajos: A-E eligen alternativa, flechas navegan. Se ignoran al escribir en un campo, en pausa o con el modal abierto.
  // El oyente global lee siempre la version mas reciente via ref (se reasigna tras cada render, no durante).
  const manejarTecla = useRef<(e: KeyboardEvent) => void>(() => {})
  const manejarTeclaActual = (e: KeyboardEvent) => {
    if (!preguntaActual || pausado || confirmandoFinalizar || e.ctrlKey || e.metaKey || e.altKey) return
    const destino = e.target as HTMLElement | null
    if (destino && (destino.tagName === 'INPUT' || destino.tagName === 'TEXTAREA' || destino.isContentEditable)) return

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

  const cerrarConfirmacion = useCallback(() => setConfirmandoFinalizar(false), [])

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-body text-slate-700">
        <span className="material-symbols-outlined mr-2 animate-spin text-primary-600">progress_activity</span>
        Cargando simulacro...
      </div>
    )
  }

  if (!simulacro || simulacro.preguntas.length === 0) {
    // Sin preguntas: intentos creados antes de que el backend rechazara sorteos vacios - sin esto solo se veia el cronometro.
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-body text-slate-900">
        <div className="flex max-w-md flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <span className="material-symbols-outlined text-3xl">{simulacro ? 'inventory_2' : 'error'}</span>
          </div>
          <p className="text-sm text-slate-700">
            {simulacro
              ? 'Este simulacro no tiene preguntas: el examen no tenía preguntas disponibles cuando lo iniciaste. Avisa a tu docente o elige otro examen.'
              : (error ?? 'Simulacro no encontrado.')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/examenes')}
            className="mt-5 h-11 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800"
          >
            Volver a exámenes
          </button>
        </div>
      </div>
    )
  }

  const colorTiempo =
    segundosRestantes === null || pausado
      ? 'text-slate-900'
      : segundosRestantes < 60
        ? 'text-rose-600'
        : segundosRestantes < 300
          ? 'text-accent-600'
          : 'text-slate-900'
  const porcentaje = conteo.total > 0 ? Math.round((conteo.respondidas / conteo.total) * 100) : 0
  const valorPregunta = examen?.preguntas.find((p) => p.preguntaId === preguntaActual?.preguntaId)?.puntajeAsignado
  const esUltima = indiceActual === simulacro.preguntas.length - 1

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-body text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-2 sm:gap-3 sm:px-6">
          <Link
            to="/examenes"
            title="Tu tiempo sigue corriendo mientras estás fuera"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-700 transition hover:text-primary-600"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            <span className="hidden sm:inline">Salir</span>
          </Link>
          <span className="hidden h-6 w-px bg-slate-200 sm:block" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-sm font-bold text-slate-900 sm:text-base">{examen?.nombre ?? 'Simulacro'}</h1>
            {examen && <p className="truncate text-[11px] text-slate-500 sm:text-xs">{examen.universidadNombre}</p>}
          </div>

          <div
            role="timer"
            aria-label="Tiempo restante"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 ring-1 ring-slate-200 sm:px-3"
          >
            <span className={`material-symbols-outlined text-lg ${colorTiempo === 'text-slate-900' ? 'text-accent-500' : colorTiempo}`}>timer</span>
            <span className={`font-display text-base font-bold tabular-nums sm:text-xl ${colorTiempo}`}>
              {pausado ? 'En pausa' : segundosRestantes !== null ? formatearTiempo(segundosRestantes) : '--:--'}
            </span>
          </div>

          <span className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 lg:flex" aria-live="polite">
            {estadoGuardado === 'guardando' && (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span> Guardando…
              </>
            )}
            {estadoGuardado === 'guardado' && (
              <>
                <span className="material-symbols-outlined text-base text-emerald-600">cloud_done</span> Guardado
              </>
            )}
            {estadoGuardado === 'error' && (
              <>
                <span className="material-symbols-outlined text-base text-rose-600">cloud_off</span> Sin guardar
              </>
            )}
          </span>

          {simulacro.permitePausa && (
            <button
              type="button"
              disabled={pausando}
              onClick={() => cambiarPausa(pausado ? 'reanudar' : 'pausar')}
              aria-label={pausado ? 'Reanudar' : 'Pausar'}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary-50 px-2.5 text-sm font-semibold text-primary-600 transition hover:bg-primary-100 disabled:opacity-60 sm:px-3.5"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">{pausado ? 'play_arrow' : 'pause'}</span>
              <span className="hidden sm:inline">{pausado ? 'Reanudar' : 'Pausar'}</span>
            </button>
          )}
          <button
            type="button"
            disabled={finalizando}
            onClick={() => setConfirmandoFinalizar(true)}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-accent-500 px-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-60 sm:px-4"
          >
            <span className="inline-flex sm:hidden" aria-hidden="true">
              <span className="material-symbols-outlined text-lg">flag</span>
            </span>
            <span className="sr-only sm:not-sr-only">Finalizar simulacro</span>
          </button>
        </div>

        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 pb-2 sm:px-6">
          <span className="shrink-0 text-[11px] font-semibold text-slate-700 sm:text-xs">
            {conteo.respondidas} de {conteo.total} respondidas
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-50" aria-hidden="true">
            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${porcentaje}%` }} />
          </div>
          <span className="shrink-0 text-xs font-bold text-primary-600">{porcentaje}%</span>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 content-start items-start gap-4 px-4 py-4 sm:px-6 lg:grid-cols-12 lg:gap-5 lg:py-5">
        <button
          type="button"
          onClick={() => setNavegadorAbierto((v) => !v)}
          aria-expanded={navegadorAbierto}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm lg:hidden"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-600">grid_view</span>
            Ver preguntas ({indiceActual + 1}/{conteo.total})
          </span>
          <span className="material-symbols-outlined">{navegadorAbierto ? 'expand_less' : 'expand_more'}</span>
        </button>

        <aside
          className={`${navegadorAbierto ? 'block' : 'hidden'} rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-28 lg:col-span-4 lg:block xl:col-span-3`}
        >
          <NavegadorPreguntas
            preguntas={simulacro.preguntas}
            indiceActual={indiceActual}
            indiceMaximoPermitido={indiceMaximoPermitido}
            onIr={irAPregunta}
          />
        </aside>

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-8 xl:col-span-9">
          {error && (
            <div role="alert" className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700">
              <span className="material-symbols-outlined text-lg">error</span>
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Cerrar aviso" className="text-rose-400 hover:text-rose-700">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          )}

          {pausado ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <span className="material-symbols-outlined text-4xl">pause</span>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900">Simulacro en pausa</h2>
              <p className="max-w-sm text-sm text-slate-700">Tu tiempo está congelado. Las preguntas se ocultan mientras dure la pausa.</p>
              <button
                type="button"
                disabled={pausando}
                onClick={() => cambiarPausa('reanudar')}
                className="mt-2 flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Reanudar
              </button>
            </div>
          ) : (
            preguntaActual && (
              <>
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">
                        Pregunta {indiceActual + 1} de {conteo.total}
                      </h2>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${DIFICULTAD[preguntaActual.dificultad].clase}`}>
                        {DIFICULTAD[preguntaActual.dificultad].etiqueta}
                      </span>
                    </div>
                    {(preguntaActual.tiempoSugeridoSeg || valorPregunta !== undefined) && (
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {preguntaActual.tiempoSugeridoSeg && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Tiempo sugerido: {preguntaActual.tiempoSugeridoSeg} s
                          </span>
                        )}
                        {valorPregunta !== undefined && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">star</span>
                            Valor: {valorPregunta} pts
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-pressed={preguntaActual.marcadaParaRevision}
                    onClick={() => alternarMarcaRevision(preguntaActual)}
                    className={`flex h-9 shrink-0 items-center gap-1.5 self-start rounded-xl px-3 text-xs font-semibold transition sm:self-auto ${
                      preguntaActual.marcadaParaRevision
                        ? 'bg-accent-100 text-accent-800 hover:bg-accent-200'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-accent-300 hover:text-accent-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{preguntaActual.marcadaParaRevision ? 'bookmark_added' : 'bookmark'}</span>
                    {preguntaActual.marcadaParaRevision ? 'Marcada para revisar' : 'Marcar para revisar'}
                  </button>
                </div>

                <div className="flex flex-col gap-5 px-4 py-5 sm:px-6">
                  <div
                    className={`text-[15px] leading-7 text-slate-900 sm:text-base ${CLASE_HTML_ENRIQUECIDO}`}
                    dangerouslySetInnerHTML={{ __html: htmlSeguro(preguntaActual.enunciadoHtml) }}
                  />

                  <RespuestaPregunta
                    pregunta={preguntaActual}
                    onCambiar={(respuestaDada) => guardarRespuesta(preguntaActual.respuestaSimulacroId, respuestaDada)}
                    onCambiarConDebounce={(respuestaDada) => guardarRespuestaConDebounce(preguntaActual.respuestaSimulacroId, respuestaDada)}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-6">
                  <button
                    type="button"
                    disabled={indiceActual === 0}
                    onClick={() => irAPregunta(indiceActual - 1)}
                    aria-label="Anterior"
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-40 sm:px-4"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <div className="flex min-w-0 items-center gap-2">
                    {tieneRespuesta(preguntaActual.respuestaDada) && (
                      <button
                        type="button"
                        onClick={() => guardarRespuesta(preguntaActual.respuestaSimulacroId, {})}
                        aria-label="Borrar respuesta"
                        className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-600 sm:px-4"
                      >
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">backspace</span>
                        <span className="hidden sm:inline">Borrar respuesta</span>
                      </button>
                    )}
                    {esUltima ? (
                      <button
                        type="button"
                        onClick={() => setConfirmandoFinalizar(true)}
                        className="flex h-10 items-center gap-1.5 rounded-xl bg-accent-500 px-4 text-sm font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-accent-600"
                      >
                        Revisar y finalizar
                        <span className="material-symbols-outlined text-lg">flag</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => irAPregunta(indiceActual + 1)}
                        className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800"
                      >
                        Siguiente
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )
          )}
        </section>
      </main>

      <footer className="hidden border-t border-slate-200 bg-white px-6 py-2 text-[11px] text-slate-500 md:block">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary-600" />
            Modo concentración activo
          </span>
          <span>
            Atajos: <kbd className="font-semibold text-slate-700">A–E</kbd> elegir alternativa ·{' '}
            <kbd className="font-semibold text-slate-700">← →</kbd> navegar
          </span>
        </div>
      </footer>

      {confirmandoFinalizar && (
        <ConfirmarFinalizarModal
          respondidas={conteo.respondidas}
          sinResponder={conteo.total - conteo.respondidas}
          marcadas={conteo.marcadas}
          finalizando={finalizando}
          onCancelar={cerrarConfirmacion}
          onConfirmar={finalizar}
        />
      )}
    </div>
  )
}
