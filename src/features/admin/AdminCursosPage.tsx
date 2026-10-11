import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  actualizarCurso,
  actualizarTema,
  crearCurso,
  crearTema,
  eliminarCurso,
  eliminarTema,
  listarCursosAdmin,
  type CategoriaCurso,
  type CursoAdmin,
  type TemaAdmin,
} from '../../api/adminCursosApi'
import { ApiError } from '../../api/client'
import { Alert, Badge, Button, Card, cn, EmptyState, Field, Icon, Input, PageHeader, SegmentedControl, Select, StatCard, type TonoBadge } from '../../components/ui'

/** Catalogo de cursos y temas: antes solo se podia ampliar por SQL. El backend solo deja
 * eliminar lo que no esta en uso (temas sin preguntas/examenes, cursos sin temas), asi que
 * aqui solo se ofrece "Eliminar" cuando aplica y el resto se renombra. */

const CATEGORIAS: { valor: CategoriaCurso; etiqueta: string; tono: TonoBadge; icono: string; fondo: string }[] = [
  { valor: 'COMUN', etiqueta: 'Común', tono: 'primary', icono: 'auto_stories', fondo: 'bg-primary-50 text-primary-600' },
  { valor: 'LETRAS', etiqueta: 'Letras', tono: 'warning', icono: 'history_edu', fondo: 'bg-amber-50 text-amber-600' },
  { valor: 'CIENCIAS', etiqueta: 'Ciencias', tono: 'info', icono: 'science', fondo: 'bg-sky-50 text-sky-600' },
  { valor: 'IDIOMAS', etiqueta: 'Idiomas', tono: 'danger', icono: 'language', fondo: 'bg-rose-50 text-rose-600' },
  { valor: 'TECNOLOGIA', etiqueta: 'Tecnología', tono: 'success', icono: 'code', fondo: 'bg-emerald-50 text-emerald-600' },
]

type FiltroCategoria = 'TODAS' | CategoriaCurso

const OPCIONES_FILTRO: { value: FiltroCategoria; label: string }[] = [
  { value: 'TODAS', label: 'Todas' },
  ...CATEGORIAS.map((c) => ({ value: c.valor, label: c.etiqueta })),
]

function categoria(valor: CategoriaCurso) {
  return CATEGORIAS.find((c) => c.valor === valor) ?? CATEGORIAS[0]
}

function preguntasDe(curso: CursoAdmin): number {
  return curso.temas.reduce((suma, t) => suma + t.cantidadPreguntas, 0)
}

function plural(n: number, singular: string, pluralTexto: string): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`
}

function mensajeError(err: unknown, porDefecto: string): string {
  return err instanceof ApiError ? err.message : porDefecto
}

interface FormularioCurso {
  nombre: string
  categoria: CategoriaCurso
}

const FORMULARIO_VACIO: FormularioCurso = { nombre: '', categoria: 'COMUN' }

export default function AdminCursosPage() {
  const [cursos, setCursos] = useState<CursoAdmin[] | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroCategoria>('TODAS')
  const [error, setError] = useState<string | null>(null)

  /** null = nada abierto, 'nuevo' = alta de curso, o el id del curso seleccionado. */
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [formulario, setFormulario] = useState<FormularioCurso>(FORMULARIO_VACIO)
  const [errorPanel, setErrorPanel] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [nuevoTema, setNuevoTema] = useState('')
  const [temaEnEdicion, setTemaEnEdicion] = useState<{ id: string; nombre: string } | null>(null)
  const [temaOcupado, setTemaOcupado] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)

  function cargar() {
    return listarCursosAdmin()
      .then(setCursos)
      .catch(() => setError('No se pudieron cargar los cursos.'))
  }

  useEffect(() => {
    cargar()
  }, [])

  const cursoSeleccionado = cursos?.find((c) => c.id === seleccion) ?? null

  const cursosFiltrados = useMemo(() => {
    if (!cursos) return null
    const q = busqueda.trim().toLowerCase()
    return cursos.filter(
      (c) =>
        (filtro === 'TODAS' || c.categoria === filtro) &&
        (!q || c.nombre.toLowerCase().includes(q) || c.temas.some((t) => t.nombre.toLowerCase().includes(q))),
    )
  }, [cursos, busqueda, filtro])

  const totalTemas = cursos?.reduce((suma, c) => suma + c.temas.length, 0) ?? 0
  const totalPreguntas = cursos?.reduce((suma, c) => suma + preguntasDe(c), 0) ?? 0
  const temasSinPreguntas = cursos?.reduce((suma, c) => suma + c.temas.filter((t) => t.cantidadPreguntas === 0).length, 0) ?? 0

  function limpiarPanel() {
    setErrorPanel(null)
    setNuevoTema('')
    setTemaEnEdicion(null)
  }

  /** En pantallas angostas el panel va debajo de la lista: se lleva a la vista al abrirlo. */
  function mostrarPanel() {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: 'start' }))
    }
  }

  function abrirNuevo() {
    limpiarPanel()
    setFormulario(FORMULARIO_VACIO)
    setSeleccion('nuevo')
    mostrarPanel()
  }

  function abrirCurso(curso: CursoAdmin) {
    limpiarPanel()
    setFormulario({ nombre: curso.nombre, categoria: curso.categoria })
    setSeleccion(curso.id)
    mostrarPanel()
  }

  async function handleGuardarCurso(evento: FormEvent) {
    evento.preventDefault()
    setErrorPanel(null)
    setGuardando(true)
    try {
      if (cursoSeleccionado) {
        await actualizarCurso(cursoSeleccionado.id, formulario)
      } else {
        const creado = await crearCurso(formulario)
        setSeleccion(creado.id)
      }
      await cargar()
    } catch (err) {
      setErrorPanel(mensajeError(err, 'No se pudo guardar el curso.'))
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminarCurso(curso: CursoAdmin) {
    if (!window.confirm(`¿Eliminar el curso "${curso.nombre}"? Esta accion no se puede deshacer.`)) return
    setErrorPanel(null)
    setGuardando(true)
    try {
      await eliminarCurso(curso.id)
      setSeleccion(null)
      await cargar()
    } catch (err) {
      setErrorPanel(mensajeError(err, 'No se pudo eliminar el curso.'))
    } finally {
      setGuardando(false)
    }
  }

  async function handleAgregarTema(evento: FormEvent) {
    evento.preventDefault()
    if (!cursoSeleccionado || !nuevoTema.trim()) return
    setErrorPanel(null)
    setTemaOcupado('nuevo')
    try {
      await crearTema(cursoSeleccionado.id, nuevoTema)
      setNuevoTema('')
      await cargar()
    } catch (err) {
      setErrorPanel(mensajeError(err, 'No se pudo agregar el tema.'))
    } finally {
      setTemaOcupado(null)
    }
  }

  async function handleRenombrarTema(evento: FormEvent) {
    evento.preventDefault()
    if (!temaEnEdicion) return
    setErrorPanel(null)
    setTemaOcupado(temaEnEdicion.id)
    try {
      await actualizarTema(temaEnEdicion.id, temaEnEdicion.nombre)
      setTemaEnEdicion(null)
      await cargar()
    } catch (err) {
      setErrorPanel(mensajeError(err, 'No se pudo renombrar el tema.'))
    } finally {
      setTemaOcupado(null)
    }
  }

  async function handleEliminarTema(tema: TemaAdmin) {
    if (!window.confirm(`¿Eliminar el tema "${tema.nombre}"?`)) return
    setErrorPanel(null)
    setTemaOcupado(tema.id)
    try {
      await eliminarTema(tema.id)
      await cargar()
    } catch (err) {
      setErrorPanel(mensajeError(err, 'No se pudo eliminar el tema.'))
    } finally {
      setTemaOcupado(null)
    }
  }

  const panelAbierto = seleccion === 'nuevo' || cursoSeleccionado !== null
  const catFormulario = categoria(formulario.categoria)

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        title="Cursos y temas"
        description="Catálogo que usan el banco de preguntas, la importación masiva y las áreas de los exámenes."
        actions={
          <Button icon="add" onClick={abrirNuevo}>
            Nuevo curso
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {cursos && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Cursos"
            icon="menu_book"
            value={cursos.length}
            hint={CATEGORIAS.map((c) => ({ c, n: cursos.filter((x) => x.categoria === c.valor).length }))
              .filter(({ n }) => n > 0)
              .map(({ c, n }) => `${n} ${c.etiqueta}`)
              .join(' · ')}
          />
          <StatCard label="Temas" icon="library_books" tone="info" value={totalTemas} hint={plural(temasSinPreguntas, 'tema sin preguntas', 'temas sin preguntas')} />
          <StatCard label="Preguntas en el banco" icon="quiz" tone="success" value={totalPreguntas} hint="En todos los estados" />
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Card className="flex flex-col overflow-hidden lg:col-span-7">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                aria-label="Buscar curso o tema"
                className="pl-9"
                placeholder="Buscar curso o tema..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Select aria-label="Filtrar por categoría" className="sm:w-48" value={filtro} onChange={(e) => setFiltro(e.target.value as FiltroCategoria)}>
              {OPCIONES_FILTRO.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value === 'TODAS' ? 'Todas las categorías' : o.label}
                </option>
              ))}
            </Select>
          </div>

          {cursosFiltrados === null && !error && <EmptyState icon="hourglass_empty" title="Cargando cursos..." />}
          {cursosFiltrados !== null && cursosFiltrados.length === 0 && <EmptyState icon="search_off" title="No hay cursos que coincidan." />}

          {cursosFiltrados !== null && cursosFiltrados.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {cursosFiltrados.map((curso) => {
                const cat = categoria(curso.categoria)
                const activo = curso.id === seleccion
                return (
                  <li key={curso.id}>
                    <button
                      type="button"
                      onClick={() => abrirCurso(curso)}
                      aria-current={activo ? 'true' : undefined}
                      className={cn(
                        'flex w-full items-center gap-4 border-l-[3px] px-4 py-3 text-left transition-colors',
                        activo ? 'border-primary-600 bg-primary-50/60' : 'border-transparent hover:bg-slate-50/80',
                      )}
                    >
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', cat.fondo)}>
                        <Icon name={cat.icono} size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={cn('truncate font-semibold', activo ? 'text-primary-700' : 'text-slate-900')}>{curso.nombre}</div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {curso.temas.length === 0 ? 'Sin temas todavía' : curso.temas.map((t) => t.nombre).join(' · ')}
                        </div>
                      </div>
                      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                        <Badge tone={cat.tono}>{cat.etiqueta}</Badge>
                        <span className="text-xs text-slate-500">
                          {plural(curso.temas.length, 'tema', 'temas')} · {plural(preguntasDe(curso), 'pregunta', 'preguntas')}
                        </span>
                      </div>
                      <Icon name="chevron_right" className={cn('shrink-0', activo ? 'text-primary-600' : 'text-slate-300')} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Sticky: al elegir un curso de abajo de la lista, el editor sigue a la vista. */}
        <div ref={panelRef} className="scroll-mt-24 lg:sticky lg:top-[92px] lg:col-span-5">
          <Card className="flex flex-col overflow-hidden lg:max-h-[calc(100vh-116px)]">
            {!panelAbierto ? (
              <EmptyState icon="menu_book" title='Selecciona un curso para editarlo y gestionar sus temas, o crea uno con "Nuevo curso".' />
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', catFormulario.fondo)}>
                    <Icon name={catFormulario.icono} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-500">{cursoSeleccionado ? 'Editar curso' : 'Nuevo curso'}</span>
                    <div className="truncate font-display text-base font-bold text-slate-900">{cursoSeleccionado ? cursoSeleccionado.nombre : formulario.nombre || 'Sin nombre'}</div>
                  </div>
                  <Button variant="ghost" size="icon" icon="close" aria-label="Cerrar editor" disabled={guardando} onClick={() => setSeleccion(null)} />
                </div>

                <div className="flex flex-col overflow-y-auto">
                  <form onSubmit={handleGuardarCurso} className="flex flex-col gap-4 p-5">
                    {errorPanel && <Alert>{errorPanel}</Alert>}

                    <Field label="Nombre del curso">
                      <Input value={formulario.nombre} maxLength={255} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} required />
                    </Field>

                    <Field label="Categoría" hint="Común, Letras y Ciencias son de admisión; Idiomas y Tecnología, de esos programas.">
                      <SegmentedControl
                        options={CATEGORIAS.map((c) => ({ value: c.valor, label: c.etiqueta, icon: c.icono }))}
                        value={formulario.categoria}
                        onChange={(valor) => setFormulario({ ...formulario, categoria: valor })}
                      />
                    </Field>

                    <div className="flex items-center justify-between gap-2">
                      {cursoSeleccionado && cursoSeleccionado.temas.length === 0 ? (
                        <Button variant="danger" icon="delete" disabled={guardando} onClick={() => handleEliminarCurso(cursoSeleccionado)}>
                          Eliminar
                        </Button>
                      ) : (
                        <span />
                      )}
                      <Button type="submit" loading={guardando}>
                        {cursoSeleccionado ? 'Guardar cambios' : 'Crear curso'}
                      </Button>
                    </div>
                  </form>

                  {cursoSeleccionado && (
                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Temas</span>
                        <Badge>{cursoSeleccionado.temas.length}</Badge>
                      </div>

                      {cursoSeleccionado.temas.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
                          Este curso todavía no tiene temas. Agrega el primero abajo.
                        </p>
                      ) : (
                        <ul className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          {cursoSeleccionado.temas.map((tema) => {
                            const ocupado = temaOcupado === tema.id
                            if (temaEnEdicion?.id === tema.id) {
                              return (
                                <li key={tema.id}>
                                  <form onSubmit={handleRenombrarTema} className="flex items-center gap-2 px-3 py-2">
                                    <Input
                                      aria-label="Nombre del tema"
                                      autoFocus
                                      maxLength={255}
                                      value={temaEnEdicion.nombre}
                                      onChange={(e) => setTemaEnEdicion({ ...temaEnEdicion, nombre: e.target.value })}
                                      required
                                    />
                                    <Button type="submit" size="sm" loading={ocupado}>
                                      Guardar
                                    </Button>
                                    <Button variant="ghost" size="sm" disabled={ocupado} onClick={() => setTemaEnEdicion(null)}>
                                      Cancelar
                                    </Button>
                                  </form>
                                </li>
                              )
                            }
                            const enUso = tema.cantidadPreguntas > 0
                            return (
                              <li key={tema.id} className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50">
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{tema.nombre}</span>
                                <Badge tone={enUso ? 'success' : 'neutral'}>{plural(tema.cantidadPreguntas, 'pregunta', 'preguntas')}</Badge>
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    icon="edit"
                                    aria-label={`Renombrar ${tema.nombre}`}
                                    disabled={temaOcupado !== null}
                                    onClick={() => setTemaEnEdicion({ id: tema.id, nombre: tema.nombre })}
                                  />
                                  <Button
                                    variant="danger"
                                    size="icon"
                                    icon="delete"
                                    aria-label={`Eliminar ${tema.nombre}`}
                                    title={enUso ? 'Tiene preguntas: no se puede eliminar' : undefined}
                                    disabled={temaOcupado !== null || enUso}
                                    loading={ocupado}
                                    onClick={() => handleEliminarTema(tema)}
                                  />
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}

                      <form onSubmit={handleAgregarTema} className="flex items-center gap-2">
                        <Input
                          aria-label="Nuevo tema"
                          placeholder="Nombre del nuevo tema"
                          maxLength={255}
                          value={nuevoTema}
                          onChange={(e) => setNuevoTema(e.target.value)}
                        />
                        <Button type="submit" variant="secondary" icon="add" loading={temaOcupado === 'nuevo'} disabled={!nuevoTema.trim()}>
                          Agregar
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
