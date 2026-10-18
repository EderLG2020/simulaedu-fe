import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { claves } from '../../api/claves'
import { listarExamenes, type EstadoExamen, type ExamenResumen } from '../../api/examenesApi'
import { Alert, Badge, Button, Card, cn, EmptyState, Icon, Input, PageHeader, SegmentedControl, Select, StatCard } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useUniversidades } from '../../hooks/useCatalogos'
import { formatearDuracion } from '../../lib/formato'
import { useGestionExamenes } from './gestion'
import { ETIQUETA_TIPO } from './resumenExamenes'

/** Lista de examenes (admin y docente). Crear/editar/publicar vive en EditorExamenPage, a
 * pantalla completa: la composicion necesita mas espacio que un panel lateral. Sin "Eliminar"
 * ni "Despublicar": el backend no expone esos endpoints. */

const LIMITE = 100

type FiltroEstado = '' | EstadoExamen

const OPCIONES_ESTADO: { value: FiltroEstado; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'BORRADOR', label: 'Borradores' },
  { value: 'PUBLICADO', label: 'Publicados' },
]

function composicionDe(examen: ExamenResumen): string {
  if (examen.tipoSeleccion === 'FIJA') {
    const n = examen.preguntas.length
    return `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`
  }
  const n = examen.areas.length
  return `${n} ${n === 1 ? 'área' : 'áreas'}`
}

export default function GestionExamenesPage() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMIN'
  const navigate = useNavigate()
  const { rutaEditor, rutaNuevo, contenedor } = useGestionExamenes()

  const universidades = useUniversidades().data ?? null
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>('')
  const [universidadFiltro, setUniversidadFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // El estado se filtra en el cliente: asi las tarjetas de resumen cuentan todos los examenes.
  const universidadId = esAdmin ? universidadFiltro || undefined : undefined
  const consulta = useQuery({
    queryKey: claves.examenes.gestion(universidadId),
    queryFn: () => listarExamenes({ universidadId, page: 1, limit: LIMITE }).then((r) => r.data),
  })
  const examenes: ExamenResumen[] | null = consulta.data ?? null
  const error = consulta.isError ? 'No se pudieron cargar los exámenes.' : null

  const filtrados = useMemo(() => {
    if (!examenes) return null
    const q = busqueda.trim().toLowerCase()
    return examenes.filter((e) => (!estadoFiltro || e.estado === estadoFiltro) && (!q || e.nombre.toLowerCase().includes(q)))
  }, [examenes, estadoFiltro, busqueda])

  const publicados = examenes?.filter((e) => e.estado === 'PUBLICADO') ?? []
  const noDisponibles = publicados.filter((e) => !e.disponible).length
  const borradores = (examenes?.length ?? 0) - publicados.length

  return (
    <div className={contenedor}>
      <PageHeader
        title="Exámenes"
        description="Arma los simulacros en 3 pasos: datos básicos, composición y publicación."
        actions={
          <Button icon="add" onClick={() => navigate(rutaNuevo)}>
            Nuevo examen
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {examenes && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Exámenes" icon="assignment" value={examenes.length} hint={esAdmin ? 'De todos los autores' : 'Tus borradores y los publicados'} />
          <StatCard
            label="Publicados"
            icon="public"
            tone="success"
            value={publicados.length}
            hint={noDisponibles > 0 ? `${noDisponibles} sin preguntas suficientes` : 'Visibles para los estudiantes'}
          />
          <StatCard label="Borradores" icon="edit_note" tone="warning" value={borradores} hint="Aún no los ven los estudiantes" />
        </div>
      )}

      <Card className="flex flex-col overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input aria-label="Buscar examen por nombre" placeholder="Buscar por nombre..." className="pl-9" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <SegmentedControl className="lg:w-80" options={OPCIONES_ESTADO} value={estadoFiltro} onChange={setEstadoFiltro} />
          {esAdmin && (
            <Select aria-label="Filtrar por programa" className="lg:w-64" value={universidadFiltro} onChange={(e) => setUniversidadFiltro(e.target.value)}>
              <option value="">Todos los programas</option>
              {universidades?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </Select>
          )}
        </div>

        {filtrados === null && !error && <EmptyState icon="hourglass_empty" title="Cargando exámenes..." />}
        {filtrados !== null && filtrados.length === 0 && (
          <EmptyState icon="search_off" title={examenes?.length ? 'Ningún examen coincide con los filtros.' : 'Aún no hay exámenes. Crea el primero con "Nuevo examen".'} />
        )}

        {filtrados !== null && filtrados.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {filtrados.map((examen) => {
              const publicado = examen.estado === 'PUBLICADO'
              const fijo = examen.tipoSeleccion === 'FIJA'
              return (
                <li key={examen.id}>
                  <Link to={rutaEditor(examen.id)} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50/80">
                    <span
                      className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', fijo ? 'bg-primary-50 text-primary-600' : 'bg-accent-50 text-accent-600')}
                      title={fijo ? 'Preguntas fijas' : 'Aleatorio por área'}
                    >
                      <Icon name={fijo ? 'format_list_numbered' : 'autorenew'} size={20} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-900 group-hover:text-primary-600">{examen.nombre}</div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {examen.universidadNombre} · <span className="font-semibold text-slate-700">{ETIQUETA_TIPO[examen.tipo].texto}</span> ·{' '}
                        {fijo ? 'Fijo' : 'Aleatorio por área'}
                      </div>
                    </div>

                    <div className="hidden shrink-0 items-center gap-5 text-xs text-slate-600 md:flex">
                      <span className="inline-flex w-24 items-center gap-1.5">
                        <Icon name="schedule" size={16} className="text-slate-400" />
                        {formatearDuracion(examen.duracionSeg)}
                      </span>
                      <span className="inline-flex w-28 items-center gap-1.5">
                        <Icon name="quiz" size={16} className="text-slate-400" />
                        {composicionDe(examen)}
                      </span>
                      <span className="inline-flex w-20 items-center gap-1.5">
                        <Icon name="star" size={16} className="text-slate-400" />
                        {examen.puntajeTotal} pts
                      </span>
                    </div>

                    <div className="flex w-32 shrink-0 justify-end">
                      {publicado && !examen.disponible ? (
                        <Badge tone="warning">Sin preguntas</Badge>
                      ) : (
                        <Badge tone={publicado ? 'success' : 'neutral'}>{publicado ? 'Publicado' : 'Borrador'}</Badge>
                      )}
                    </div>
                    <Icon name="chevron_right" className="shrink-0 text-slate-300 group-hover:text-primary-600" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
