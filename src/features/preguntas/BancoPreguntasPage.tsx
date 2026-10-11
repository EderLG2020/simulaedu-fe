import { useEffect, useMemo, useState } from 'react'
import { listarUsuarios, type UsuarioAdmin } from '../../api/adminUsuariosApi'
import { listarCursos, type CursoConTemas } from '../../api/cursosApi'
import { ApiError } from '../../api/client'
import {
  actualizarPregunta,
  crearPregunta,
  duplicarPregunta,
  eliminarPregunta,
  listarPreguntas,
  subirArchivoPregunta,
  subirImagenPregunta,
  type AlternativaRequest,
  type Dificultad,
  type EstadoPregunta,
  type Pregunta,
  type PreguntaRequest,
  type TipoPregunta,
} from '../../api/preguntasApi'
import { listarUniversidades, type UniversidadResumen } from '../../api/universidadesApi'
import {
  Alert,
  Badge,
  Button,
  buttonClasses,
  Card,
  cn,
  EmptyState,
  Field,
  FieldGroup,
  Icon,
  Input,
  Modal,
  PageHeader,
  Pagination,
  SegmentedControl,
  Select,
  Table,
  TableHead,
  Td,
  Textarea,
  Th,
  type TonoBadge,
} from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { textoPlanoDe, htmlSeguro } from '../../lib/html'
import ImportarPreguntasModal from './ImportarPreguntasModal'
import { CLASE_HTML_ENRIQUECIDO } from '../simulacro/estilosSimulacro'
import type { PageMeta } from '../../api/client'

/** Usada tanto por Docente como Admin (mismo RBAC de backend) - ver router.tsx (/docente/preguntas y
 * /admin/preguntas montan este mismo componente). El editor de enunciado es un textarea
 * con formato basico (negrita/cursiva/lista via envoltura de tags) e insercion de imagen
 * real (sube a Cloudinary via preguntasApi.subirImagenPregunta) - no es un WYSIWYG/LaTeX
 * completo (TipTap+KaTeX), eso queda para un paso aparte, ya avisado. */

const LIMITE_POR_PAGINA = 20

const TIPO_INFO: Record<TipoPregunta, { icono: string; label: string }> = {
  OPCION_UNICA: { icono: 'radio_button_checked', label: 'Opción única' },
  OPCION_MULTIPLE: { icono: 'check_box', label: 'Opción múltiple' },
  EMPAREJAMIENTO: { icono: 'join_inner', label: 'Emparejamiento' },
  DESARROLLO: { icono: 'article', label: 'Desarrollo' },
  NUMERICA: { icono: 'pin', label: 'Numérica' },
}

const DIFICULTAD_INFO: Record<Dificultad, { punto: string; label: string }> = {
  BAJA: { punto: 'bg-emerald-500', label: 'Baja' },
  MEDIA: { punto: 'bg-amber-500', label: 'Media' },
  ALTA: { punto: 'bg-rose-500', label: 'Alta' },
}

const ESTADO_INFO: Record<EstadoPregunta, { tono: TonoBadge; label: string }> = {
  BORRADOR: { tono: 'neutral', label: 'Borrador' },
  APROBADA: { tono: 'info', label: 'Aprobada' },
  PUBLICADA: { tono: 'success', label: 'Publicada' },
}

const OPCIONES_TIPO = (Object.keys(TIPO_INFO) as TipoPregunta[]).map((t) => ({ value: t, label: TIPO_INFO[t].label, icon: TIPO_INFO[t].icono }))
const OPCIONES_DIFICULTAD = (Object.keys(DIFICULTAD_INFO) as Dificultad[]).map((d) => ({ value: d, label: DIFICULTAD_INFO[d].label }))

const letra = (i: number) => String.fromCharCode(65 + i)

/** Selector agrupado curso -> temas, usado en el filtro y en el formulario. */
function OpcionesTemas({ cursos }: { cursos: CursoConTemas[] | null }) {
  return cursos?.map((c) => (
    <optgroup key={c.id} label={c.nombre}>
      {c.temas.map((t) => (
        <option key={t.id} value={t.id}>
          {t.nombre}
        </option>
      ))}
    </optgroup>
  ))
}

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

interface AlternativaForm {
  textoHtml: string
  imagenUrl: string | null
  esCorrecta: boolean
}

interface ParForm {
  izquierda: number
  derecha: number
}

interface FormularioPregunta {
  temaId: string
  tipoPregunta: TipoPregunta
  dificultad: Dificultad
  enunciadoHtml: string
  tiempoSugeridoSeg: string
  universidadesObjetivoIds: string[]
  alternativas: AlternativaForm[]
  columnaIzquierda: string[]
  columnaDerecha: string[]
  paresCorrectos: ParForm[]
  limiteCaracteres: string
  rubricaEvaluacion: string
  formatoRespuesta: string
  valorCorrecto: string
}

const FORMULARIO_VACIO: FormularioPregunta = {
  temaId: '',
  tipoPregunta: 'OPCION_UNICA',
  dificultad: 'MEDIA',
  enunciadoHtml: '',
  tiempoSugeridoSeg: '',
  universidadesObjetivoIds: [],
  alternativas: [
    { textoHtml: '', imagenUrl: null, esCorrecta: true },
    { textoHtml: '', imagenUrl: null, esCorrecta: false },
  ],
  columnaIzquierda: ['', ''],
  columnaDerecha: ['', ''],
  paresCorrectos: [{ izquierda: 0, derecha: 0 }],
  limiteCaracteres: '800',
  rubricaEvaluacion: '',
  formatoRespuesta: 'entero',
  valorCorrecto: '',
}


function preguntaAFormulario(pregunta: Pregunta): FormularioPregunta {
  const meta = pregunta.metadataTipo
  return {
    temaId: pregunta.temaId,
    tipoPregunta: pregunta.tipoPregunta,
    dificultad: pregunta.dificultad,
    enunciadoHtml: pregunta.enunciadoHtml,
    tiempoSugeridoSeg: pregunta.tiempoSugeridoSeg === null ? '' : String(pregunta.tiempoSugeridoSeg),
    universidadesObjetivoIds: pregunta.universidadesObjetivoIds,
    alternativas:
      pregunta.alternativas.length > 0
        ? pregunta.alternativas
            .slice()
            .sort((a, b) => a.orden - b.orden)
            .map((a) => ({ textoHtml: a.textoHtml, imagenUrl: a.imagenUrl, esCorrecta: a.esCorrecta }))
        : FORMULARIO_VACIO.alternativas,
    columnaIzquierda: (meta.columnaIzquierda as string[] | undefined) ?? FORMULARIO_VACIO.columnaIzquierda,
    columnaDerecha: (meta.columnaDerecha as string[] | undefined) ?? FORMULARIO_VACIO.columnaDerecha,
    paresCorrectos: (meta.paresCorrectos as ParForm[] | undefined) ?? FORMULARIO_VACIO.paresCorrectos,
    limiteCaracteres: meta.limiteCaracteres !== undefined ? String(meta.limiteCaracteres) : FORMULARIO_VACIO.limiteCaracteres,
    rubricaEvaluacion: (meta.rubricaEvaluacion as string | undefined) ?? '',
    formatoRespuesta: (meta.formatoRespuesta as string | undefined) ?? 'entero',
    valorCorrecto: meta.valorCorrecto !== undefined ? String(meta.valorCorrecto) : '',
  }
}

function formularioARequest(formulario: FormularioPregunta): PreguntaRequest {
  const base: PreguntaRequest = {
    temaId: formulario.temaId,
    tipoPregunta: formulario.tipoPregunta,
    dificultad: formulario.dificultad,
    enunciadoHtml: formulario.enunciadoHtml,
    tiempoSugeridoSeg: formulario.tiempoSugeridoSeg.trim() === '' ? null : Number(formulario.tiempoSugeridoSeg),
    universidadesObjetivoIds: formulario.universidadesObjetivoIds,
  }

  if (formulario.tipoPregunta === 'OPCION_UNICA' || formulario.tipoPregunta === 'OPCION_MULTIPLE') {
    const alternativas: AlternativaRequest[] = formulario.alternativas.map((a, i) => ({
      textoHtml: a.textoHtml,
      imagenUrl: a.imagenUrl,
      esCorrecta: a.esCorrecta,
      orden: i + 1,
    }))
    return { ...base, alternativas }
  }

  if (formulario.tipoPregunta === 'EMPAREJAMIENTO') {
    return {
      ...base,
      metadataTipo: {
        columnaIzquierda: formulario.columnaIzquierda,
        columnaDerecha: formulario.columnaDerecha,
        paresCorrectos: formulario.paresCorrectos,
      },
    }
  }

  if (formulario.tipoPregunta === 'DESARROLLO') {
    return {
      ...base,
      metadataTipo: {
        limiteCaracteres: Number(formulario.limiteCaracteres || 0),
        rubricaEvaluacion: formulario.rubricaEvaluacion,
      },
    }
  }

  // NUMERICA
  return {
    ...base,
    metadataTipo: {
      formatoRespuesta: formulario.formatoRespuesta,
      valorCorrecto: Number(formulario.valorCorrecto || 0),
    },
  }
}

function envolverSeleccion(valor: string, inicio: number, fin: number, tagAbre: string, tagCierra: string): { texto: string; cursor: number } {
  const seleccion = valor.slice(inicio, fin) || 'texto'
  const nuevo = valor.slice(0, inicio) + tagAbre + seleccion + tagCierra + valor.slice(fin)
  return { texto: nuevo, cursor: inicio + tagAbre.length + seleccion.length + tagCierra.length }
}

/** Escapa `&`, `<` y `>` para que el codigo de un `<pre><code>` se muestre literal en vez de interpretarse como HTML. */
function escaparCodigo(codigo: string): string {
  return codigo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function BancoPreguntasPage() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMIN'

  const [cursos, setCursos] = useState<CursoConTemas[] | null>(null)
  const [universidades, setUniversidades] = useState<UniversidadResumen[] | null>(null)
  const [docentes, setDocentes] = useState<UsuarioAdmin[] | null>(null)

  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null)
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [temaFiltro, setTemaFiltro] = useState('')
  const [dificultadFiltro, setDificultadFiltro] = useState<Dificultad | ''>('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoPregunta | ''>('')
  const [autorFiltro, setAutorFiltro] = useState('')
  const [pagina, setPagina] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [preguntaEnEdicion, setPreguntaEnEdicion] = useState<Pregunta | null>(null)
  const [formulario, setFormulario] = useState<FormularioPregunta>(FORMULARIO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState<string | null>(null)
  const [subiendoAudio, setSubiendoAudio] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const [importarAbierto, setImportarAbierto] = useState(false)

  useEffect(() => {
    listarCursos().then(setCursos).catch(() => setError('No se pudieron cargar los cursos/temas.'))
    listarUniversidades().then(setUniversidades).catch(() => {})
    if (esAdmin) {
      listarUsuarios({ rol: 'DOCENTE', page: 1, limit: 100 })
        .then((r) => setDocentes(r.data))
        .catch(() => {})
    }
  }, [esAdmin])

  function cargar() {
    listarPreguntas({
      temaId: temaFiltro || undefined,
      dificultad: dificultadFiltro || undefined,
      estado: estadoFiltro || undefined,
      autorDocenteId: esAdmin ? autorFiltro || undefined : undefined,
      page: pagina,
      limit: LIMITE_POR_PAGINA,
    })
      .then((r) => {
        setPreguntas(r.data)
        setMeta(r.meta)
      })
      .catch(() => setError('No se pudieron cargar las preguntas.'))
  }

  useEffect(cargar, [temaFiltro, dificultadFiltro, estadoFiltro, autorFiltro, pagina, esAdmin])

  const temaANombre = useMemo(() => {
    const mapa = new Map<string, string>()
    cursos?.forEach((c) => c.temas.forEach((t) => mapa.set(t.id, `${c.nombre} • ${t.nombre}`)))
    return mapa
  }, [cursos])

  const universidadANombre = useMemo(() => {
    const mapa = new Map<string, string>()
    universidades?.forEach((u) => mapa.set(u.id, u.siglas))
    return mapa
  }, [universidades])

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
      cargar()
    } catch (err) {
      setErrorFormulario(err instanceof ApiError ? err.message : 'No se pudo guardar la pregunta.')
    } finally {
      setGuardando(false)
    }
  }

  async function handleDuplicar(pregunta: Pregunta) {
    setError(null)
    setAccionEnProceso(pregunta.id)
    try {
      await duplicarPregunta(pregunta.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo duplicar la pregunta.')
    } finally {
      setAccionEnProceso(null)
    }
  }

  async function handleEliminar(pregunta: Pregunta) {
    if (!window.confirm('¿Eliminar esta pregunta? Esta acción no se puede deshacer.')) return
    setError(null)
    setAccionEnProceso(pregunta.id)
    try {
      await eliminarPregunta(pregunta.id)
      cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar la pregunta.')
    } finally {
      setAccionEnProceso(null)
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
      setErrorFormulario(err instanceof ApiError ? err.message : 'No se pudo subir el audio.')
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

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHeader
          title="Banco de preguntas"
          description="Reactivos para los simulacros de admisión universitaria."
          actions={
            <>
              <Button variant="secondary" icon="upload_file" onClick={() => setImportarAbierto(true)}>
                Importar
              </Button>
              <Button icon="add" onClick={abrirCrear}>
                Nueva pregunta
              </Button>
            </>
          }
        />

        {error && <Alert>{error}</Alert>}

        <Card className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            aria-label="Filtrar por tema"
            value={temaFiltro}
            onChange={(e) => {
              setTemaFiltro(e.target.value)
              setPagina(1)
            }}
          >
            <option value="">Todos los cursos y temas</option>
            <OpcionesTemas cursos={cursos} />
          </Select>
          <Select
            aria-label="Filtrar por dificultad"
            value={dificultadFiltro}
            onChange={(e) => {
              setDificultadFiltro(e.target.value as Dificultad | '')
              setPagina(1)
            }}
          >
            <option value="">Todas las dificultades</option>
            {OPCIONES_DIFICULTAD.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filtrar por estado"
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value as EstadoPregunta | '')
              setPagina(1)
            }}
          >
            <option value="">Todos los estados</option>
            {(Object.keys(ESTADO_INFO) as EstadoPregunta[]).map((e) => (
              <option key={e} value={e}>
                {ESTADO_INFO[e].label}
              </option>
            ))}
          </Select>
          {esAdmin && (
            <Select
              aria-label="Filtrar por docente"
              value={autorFiltro}
              onChange={(e) => {
                setAutorFiltro(e.target.value)
                setPagina(1)
              }}
            >
              <option value="">Todos los docentes</option>
              {docentes?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </Select>
          )}
        </Card>

        <Card className="overflow-hidden">
          {preguntas === null && !error && <EmptyState icon="hourglass_empty" title="Cargando preguntas..." />}
          {preguntas !== null && preguntas.length === 0 && <EmptyState icon="quiz" title="No hay preguntas que coincidan con estos filtros." />}

          {preguntas !== null && preguntas.length > 0 && (
            <Table>
              <TableHead>
                <Th className="min-w-[300px]">Enunciado</Th>
                <Th>Tipo</Th>
                <Th>Dificultad</Th>
                <Th>Estado</Th>
                <Th>Universidades</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </TableHead>
              <tbody>
                  {preguntas.map((pregunta) => {
                    const ocupada = accionEnProceso === pregunta.id
                    return (
                      <tr key={pregunta.id}>
                        <Td>
                          <p className="text-xs text-slate-500">{temaANombre.get(pregunta.temaId) ?? '—'}</p>
                          <p className="mt-0.5 line-clamp-2 max-w-xl font-medium text-slate-900">{textoPlanoDe(pregunta.enunciadoHtml)}</p>
                        </Td>
                        <Td className="whitespace-nowrap text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name={TIPO_INFO[pregunta.tipoPregunta].icono} size={16} className="text-slate-500" />
                            {TIPO_INFO[pregunta.tipoPregunta].label}
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap text-slate-700">
                          <span className="inline-flex items-center gap-2">
                            <span className={cn('h-2 w-2 rounded-full', DIFICULTAD_INFO[pregunta.dificultad].punto)} />
                            {DIFICULTAD_INFO[pregunta.dificultad].label}
                          </span>
                        </Td>
                        <Td>
                          <Badge tone={ESTADO_INFO[pregunta.estado].tono}>{ESTADO_INFO[pregunta.estado].label}</Badge>
                        </Td>
                        <Td>
                          {pregunta.universidadesObjetivoIds.length === 0 ? (
                            <span className="text-xs text-slate-500">Genérica</span>
                          ) : (
                            <div className="flex max-w-[160px] flex-wrap gap-1">
                              {pregunta.universidadesObjetivoIds.map((id) => (
                                <Badge key={id}>{universidadANombre.get(id) ?? '?'}</Badge>
                              ))}
                            </div>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap py-2.5 text-right">
                          <div className="inline-flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" title="Editar" aria-label="Editar" disabled={ocupada} onClick={() => abrirEditar(pregunta)}>
                              <Icon name="edit" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Duplicar" aria-label="Duplicar" disabled={ocupada} onClick={() => handleDuplicar(pregunta)}>
                              <Icon name="content_copy" />
                            </Button>
                            <Button variant="danger" size="icon" title="Eliminar" aria-label="Eliminar" disabled={ocupada} onClick={() => handleEliminar(pregunta)}>
                              <Icon name="delete" />
                            </Button>
                          </div>
                        </Td>
                      </tr>
                    )
                  })}
              </tbody>
            </Table>
          )}

          {meta !== null && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} itemLabel="preguntas" onChange={setPagina} />}
        </Card>
      </div>

      {importarAbierto && <ImportarPreguntasModal onCerrar={() => setImportarAbierto(false)} onImportado={cargar} />}

      {modalAbierto && (
        <Modal
          title={preguntaEnEdicion ? 'Editar pregunta' : 'Nueva pregunta'}
          icon="quiz"
          onClose={cerrarModal}
          closeDisabled={guardando}
          footer={
            <>
              <Button variant="ghost" onClick={cerrarModal} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={handleGuardar} loading={guardando}>
                {guardando ? 'Guardando...' : 'Guardar pregunta'}
              </Button>
            </>
          }
        >
          {errorFormulario && <Alert>{errorFormulario}</Alert>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tema" required>
              <Select value={formulario.temaId} onChange={(e) => setFormulario({ ...formulario, temaId: e.target.value })}>
                <option value="">Selecciona un tema...</option>
                <OpcionesTemas cursos={cursos} />
              </Select>
            </Field>
            <FieldGroup label="Dificultad">
              <SegmentedControl options={OPCIONES_DIFICULTAD} value={formulario.dificultad} onChange={(dificultad) => setFormulario({ ...formulario, dificultad })} />
            </FieldGroup>
          </div>

          <FieldGroup label="Tipo de pregunta">
            <SegmentedControl options={OPCIONES_TIPO} value={formulario.tipoPregunta} onChange={(tipoPregunta) => setFormulario({ ...formulario, tipoPregunta })} />
          </FieldGroup>

          <FieldGroup label="Enunciado" required>
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
          </FieldGroup>

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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tiempo sugerido (segundos)">
              <Input type="number" min="0" value={formulario.tiempoSugeridoSeg} onChange={(e) => setFormulario({ ...formulario, tiempoSugeridoSeg: e.target.value })} />
            </Field>
            <FieldGroup label="Universidades objetivo" hint="Vacío = genérica: aparece en exámenes de cualquier universidad.">
              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5">
                {formulario.universidadesObjetivoIds.map((id) => (
                  <Badge key={id} tone="primary">
                    {universidadANombre.get(id) ?? '?'}
                    <button
                      type="button"
                      aria-label={`Quitar ${universidadANombre.get(id) ?? 'universidad'}`}
                      className="-mr-0.5 flex hover:text-primary-800"
                      onClick={() => setFormulario({ ...formulario, universidadesObjetivoIds: formulario.universidadesObjetivoIds.filter((u) => u !== id) })}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </Badge>
                ))}
                <select
                  aria-label="Agregar universidad"
                  className="bg-transparent px-1 text-xs text-slate-500 focus:outline-none"
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return
                    setFormulario({ ...formulario, universidadesObjetivoIds: [...formulario.universidadesObjetivoIds, e.target.value] })
                  }}
                >
                  <option value="">+ Agregar universidad...</option>
                  {universidades
                    ?.filter((u) => !formulario.universidadesObjetivoIds.includes(u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.siglas}
                      </option>
                    ))}
                </select>
              </div>
            </FieldGroup>
          </div>
        </Modal>
      )}
    </>
  )
}
