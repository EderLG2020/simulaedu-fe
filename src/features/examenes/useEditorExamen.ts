import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { mensajeDeError } from '../../api/client'
import {
  actualizarExamen,
  componerExamenAreas,
  componerExamenFijo,
  crearExamen,
  obtenerExamen,
  publicarExamen,
  type ExamenAreaItem,
  type ExamenPreguntaItem,
  type ExamenRequest,
  type ExamenResumen,
} from '../../api/examenesApi'
import { listarPreguntas, obtenerPregunta, type Dificultad, type Pregunta } from '../../api/preguntasApi'
import { useCursos, useUniversidades } from '../../hooks/useCatalogos'
import { textoPlanoDe } from '../../lib/html'
import { repartirEquitativamente } from './composicion'
import { FORMULARIO_VACIO, formularioDesde, mismoFormulario, type FormularioBasico } from './formularioExamen'
import { useGestionExamenes } from './gestion'
import type { EstadoPaso, Paso } from './StepperEditor'

export interface InfoPregunta {
  texto: string
  dificultad: Dificultad
  tipoPregunta: Pregunta['tipoPregunta']
}

export function infoDe(pregunta: Pregunta): InfoPregunta {
  return { texto: textoPlanoDe(pregunta.enunciadoHtml, 140), dificultad: pregunta.dificultad, tipoPregunta: pregunta.tipoPregunta }
}

/** Estado y acciones del editor de examenes: carga del examen, formulario basico, composicion (fija o por
 * areas), guardado y publicacion. Los pasos reciben el objeto completo (ver EditorExamen). */
export function useEditorExamen() {
  const { examenId } = useParams()
  const esNuevo = !examenId || examenId === 'nuevo'
  const navigate = useNavigate()
  const { base, rutaEditor, contenedor } = useGestionExamenes()

  const universidades = useUniversidades().data ?? null
  const cursos = useCursos().data ?? null

  const [examen, setExamen] = useState<ExamenResumen | null>(null)
  const [cargando, setCargando] = useState(!esNuevo)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [paso, setPaso] = useState<Paso>(1)

  const [formulario, setFormulario] = useState<FormularioBasico>(FORMULARIO_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [composicionSucia, setComposicionSucia] = useState(false)
  const [confirmandoPublicar, setConfirmandoPublicar] = useState(false)

  // Composicion FIJA
  const [temaBusqueda, setTemaBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Pregunta[] | null>(null)
  const [preguntasElegidas, setPreguntasElegidas] = useState<ExamenPreguntaItem[]>([])
  const [infoPreguntas, setInfoPreguntas] = useState<Record<string, InfoPregunta>>({})

  // Composicion ALEATORIA_POR_AREA
  const [areas, setAreas] = useState<ExamenAreaItem[]>([])

  /** Trae el enunciado de las preguntas elegidas que aun no conocemos, para que la lista no sea solo "#1, #2...". */
  function completarInfoPreguntas(ids: string[]) {
    if (ids.length === 0) return
    Promise.allSettled(ids.map((id) => obtenerPregunta(id))).then((resultados) => {
      const nuevas: Record<string, InfoPregunta> = {}
      resultados.forEach((r) => {
        if (r.status === 'fulfilled') nuevas[r.value.id] = infoDe(r.value)
      })
      setInfoPreguntas((prev) => ({ ...prev, ...nuevas }))
    })
  }

  function aplicarExamen(completo: ExamenResumen) {
    setExamen(completo)
    setFormulario(formularioDesde(completo))
    setPreguntasElegidas(completo.preguntas.map((p) => ({ preguntaId: p.preguntaId, orden: p.orden, puntajeAsignado: p.puntajeAsignado })))
    setAreas(
      completo.areas.map((a) => ({
        cursoId: a.cursoId,
        temaId: a.temaId,
        cantidadPreguntas: a.cantidadPreguntas,
        dificultadObjetivo: a.dificultadObjetivo,
        puntajeAsignado: a.puntajeAsignado,
      })),
    )
    setComposicionSucia(false)
  }

  useEffect(() => {
    if (esNuevo) return
    obtenerExamen(examenId)
      .then((completo) => {
        aplicarExamen(completo)
        completarInfoPreguntas(completo.preguntas.map((p) => p.preguntaId))
      })
      .catch(() => setErrorCarga('No se pudo cargar el examen.'))
      .finally(() => setCargando(false))
    // Solo al abrir: tras crear, la navegacion a /:id reutiliza este componente ya cargado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const basicoSucio = examen !== null && !mismoFormulario(formulario, formularioDesde(examen))

  function limpiarMensajes() {
    setError(null)
    setMensajeExito(null)
  }

  function construirRequest(): ExamenRequest | null {
    if (!formulario.universidadId || !formulario.nombre.trim()) {
      setError('Universidad y nombre son obligatorios.')
      return null
    }
    if (Number(formulario.duracionMinutos) <= 0 || Number(formulario.puntajeTotal) <= 0) {
      setError('La duración y el puntaje total deben ser mayores a 0.')
      return null
    }
    return {
      universidadId: formulario.universidadId,
      nombre: formulario.nombre.trim(),
      duracionSeg: Number(formulario.duracionMinutos) * 60,
      puntajeTotal: Number(formulario.puntajeTotal),
      tipoSeleccion: formulario.tipoSeleccion,
      navegacion: formulario.navegacion,
      permitePausa: formulario.permitePausa,
      tipo: formulario.tipo,
      descripcion: formulario.descripcion.trim() || null,
    }
  }

  async function handleGuardarBasico() {
    limpiarMensajes()
    const request = construirRequest()
    if (!request) return
    setGuardando(true)
    try {
      if (examen) {
        const actualizado = await actualizarExamen(examen.id, request)
        setExamen(actualizado)
        setFormulario(formularioDesde(actualizado))
        setMensajeExito('Datos básicos guardados.')
      } else {
        const creado = await crearExamen(request)
        aplicarExamen(creado)
        navigate(rutaEditor(creado.id), { replace: true })
        setPaso(2)
        setMensajeExito('Examen creado. Ahora arma su composición.')
      }
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el examen.'))
    } finally {
      setGuardando(false)
    }
  }

  async function buscarPreguntas(temaId: string) {
    setTemaBusqueda(temaId)
    if (!temaId) {
      setResultadosBusqueda(null)
      return
    }
    try {
      const r = await listarPreguntas({ temaId, estado: 'PUBLICADA', page: 1, limit: 50 })
      setResultadosBusqueda(r.data)
      setInfoPreguntas((prev) => ({ ...prev, ...Object.fromEntries(r.data.map((p) => [p.id, infoDe(p)])) }))
    } catch {
      setResultadosBusqueda([])
    }
  }

  function cambiarPreguntas(actualizar: (prev: ExamenPreguntaItem[]) => ExamenPreguntaItem[]) {
    setPreguntasElegidas((prev) => actualizar(prev).map((p, i) => ({ ...p, orden: i + 1 })))
    setComposicionSucia(true)
    setConfirmandoPublicar(false)
  }

  function cambiarAreas(actualizar: (prev: ExamenAreaItem[]) => ExamenAreaItem[]) {
    setAreas(actualizar)
    setComposicionSucia(true)
    setConfirmandoPublicar(false)
  }

  function agregarPregunta(pregunta: Pregunta) {
    if (preguntasElegidas.some((p) => p.preguntaId === pregunta.id)) return
    setInfoPreguntas((prev) => ({ ...prev, [pregunta.id]: infoDe(pregunta) }))
    cambiarPreguntas((prev) => [...prev, { preguntaId: pregunta.id, orden: prev.length + 1, puntajeAsignado: 0 }])
  }

  function agregarArea() {
    if (!cursos || cursos.length === 0) return
    cambiarAreas((prev) => [...prev, { cursoId: cursos[0].id, temaId: null, cantidadPreguntas: 5, dificultadObjetivo: 'MEDIA', puntajeAsignado: 0 }])
  }

  function actualizarArea(indice: number, cambios: Partial<ExamenAreaItem>) {
    cambiarAreas((prev) => prev.map((a, i) => (i === indice ? { ...a, ...cambios } : a)))
  }

  const esFija = formulario.tipoSeleccion === 'FIJA'
  const tieneDesarrollo = preguntasElegidas.some((p) => infoPreguntas[p.preguntaId]?.tipoPregunta === 'DESARROLLO')
  const puntajeTotal = Number(formulario.puntajeTotal)
  const cantidadItems = esFija ? preguntasElegidas.length : areas.length
  const puntajeAsignado = esFija ? preguntasElegidas.reduce((acc, p) => acc + p.puntajeAsignado, 0) : areas.reduce((acc, a) => acc + a.puntajeAsignado, 0)
  const puntajeCuadra = puntajeTotal - puntajeAsignado === 0
  const puedePublicar = cantidadItems > 0 && puntajeCuadra
  const publicado = examen?.estado === 'PUBLICADO'

  function repartirPuntaje() {
    const reparto = repartirEquitativamente(puntajeTotal, cantidadItems)
    if (esFija) cambiarPreguntas((prev) => prev.map((p, i) => ({ ...p, puntajeAsignado: reparto[i] })))
    else cambiarAreas((prev) => prev.map((a, i) => ({ ...a, puntajeAsignado: reparto[i] })))
  }

  async function guardarComposicion(id: string): Promise<ExamenResumen> {
    const actualizado = esFija ? await componerExamenFijo(id, preguntasElegidas) : await componerExamenAreas(id, areas)
    setComposicionSucia(false)
    return actualizado
  }

  async function handleGuardarComposicion() {
    if (!examen) return
    limpiarMensajes()
    setGuardando(true)
    try {
      setExamen(await guardarComposicion(examen.id))
      setMensajeExito('Composición guardada.')
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar la composición.'))
    } finally {
      setGuardando(false)
    }
  }

  /** El backend valida lo guardado, no lo que se ve en pantalla: se guardan primero los cambios pendientes. */
  async function handlePublicar() {
    if (!examen) return
    limpiarMensajes()
    setGuardando(true)
    try {
      if (basicoSucio) {
        const request = construirRequest()
        if (!request) return
        await actualizarExamen(examen.id, request)
      }
      if (composicionSucia) await guardarComposicion(examen.id)
      const resultado = await publicarExamen(examen.id)
      setExamen(resultado)
      setFormulario(formularioDesde(resultado))
      setMensajeExito('¡Examen publicado! Los estudiantes ya pueden rendirlo.')
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo publicar el examen.'))
    } finally {
      setGuardando(false)
      setConfirmandoPublicar(false)
    }
  }

  const estados: Record<Paso, EstadoPaso> = {
    1: examen && !basicoSucio ? 'listo' : 'actual',
    2: !examen ? 'bloqueado' : puedePublicar && !composicionSucia ? 'listo' : 'pendiente',
    3: !examen ? 'bloqueado' : publicado ? 'listo' : 'pendiente',
  }

  function irAPaso(p: Paso) {
    limpiarMensajes()
    setConfirmandoPublicar(false)
    setPaso(p)
  }

  const universidadNombre = universidades?.find((u) => u.id === formulario.universidadId)?.nombre ?? examen?.universidadNombre
  const haySinGuardar = basicoSucio || composicionSucia

  return {
    base,
    contenedor,
    universidades,
    cursos,
    examen,
    cargando,
    errorCarga,
    paso,
    formulario,
    setFormulario,
    error,
    mensajeExito,
    guardando,
    composicionSucia,
    confirmandoPublicar,
    setConfirmandoPublicar,
    temaBusqueda,
    resultadosBusqueda,
    preguntasElegidas,
    infoPreguntas,
    areas,
    basicoSucio,
    handleGuardarBasico,
    buscarPreguntas,
    cambiarPreguntas,
    cambiarAreas,
    agregarPregunta,
    agregarArea,
    actualizarArea,
    esFija,
    tieneDesarrollo,
    puntajeTotal,
    cantidadItems,
    puntajeAsignado,
    puntajeCuadra,
    puedePublicar,
    publicado,
    repartirPuntaje,
    handleGuardarComposicion,
    handlePublicar,
    estados,
    irAPaso,
    universidadNombre,
    haySinGuardar,
  }
}

export type EditorExamen = ReturnType<typeof useEditorExamen>
