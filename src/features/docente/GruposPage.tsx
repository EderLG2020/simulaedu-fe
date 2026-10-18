import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { claves } from '../../api/claves'
import { mensajeDeError } from '../../api/client'
import { crearGrupo, eliminarGrupo, listarGrupos, type Grupo } from '../../api/gruposApi'
import { Alert, Button, buttonClasses, Card, cn, EmptyState, Icon, Input, PageHeader } from '../../components/ui'
import ReporteBoton from './ReporteBoton'

export default function GruposPage() {
  const consulta = useQuery({ queryKey: claves.grupos.todos, queryFn: listarGrupos })
  const grupos = consulta.data ?? null
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [errorAccion, setError] = useState<string | null>(null)
  const error = errorAccion ?? (consulta.isError ? 'No se pudieron cargar tus grupos.' : null)
  const [creando, setCreando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  function alternarSeleccion(grupoId: string) {
    setSeleccionados((actual) =>
      actual.includes(grupoId) ? actual.filter((id) => id !== grupoId) : [...actual, grupoId],
    )
  }

  function cargar() {
    void consulta.refetch()
  }

  async function handleCrear(evento: FormEvent) {
    evento.preventDefault()
    if (!nombreNuevo.trim()) return

    setError(null)
    setCreando(true)
    try {
      await crearGrupo(nombreNuevo.trim())
      setNombreNuevo('')
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo crear el grupo.'))
    } finally {
      setCreando(false)
    }
  }

  async function handleEliminar(grupo: Grupo) {
    setError(null)
    setEliminandoId(grupo.id)
    try {
      await eliminarGrupo(grupo.id)
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar el grupo.'))
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader title="Mis grupos" description="Crea grupos, invita a tus alumnos y asígnales exámenes." />

      {error && <Alert>{error}</Alert>}

      <Card className="p-3">
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleCrear}>
          <Input
            type="text"
            placeholder="Nombre del grupo (ej. Seccion A)"
            value={nombreNuevo}
            onChange={(evento) => setNombreNuevo(evento.target.value)}
          />
          <Button type="submit" icon="add" className="shrink-0" loading={creando} disabled={!nombreNuevo.trim()}>
            {creando ? 'Creando...' : 'Crear grupo'}
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {grupos === null && !error && <EmptyState icon="hourglass_empty" title="Cargando grupos..." />}
        {grupos !== null && grupos.length === 0 && <EmptyState icon="groups" title="Todavia no tienes grupos." />}

        {grupos !== null && grupos.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {grupos.map((grupo) => {
              const seleccionado = seleccionados.includes(grupo.id)
              const eliminando = eliminandoId === grupo.id
              return (
                <li
                  key={grupo.id}
                  className={cn('flex flex-wrap items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50/60', seleccionado && 'bg-primary-50/50')}
                >
                  <input
                    type="checkbox"
                    checked={seleccionado}
                    onChange={() => alternarSeleccion(grupo.id)}
                    aria-label={`Seleccionar ${grupo.nombre} para comparar`}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-primary-600"
                  />
                  <Link to={`/docente/grupos/${grupo.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <Icon name="groups" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base font-semibold text-slate-900 group-hover:text-primary-600">{grupo.nombre}</h2>
                      <p className="text-xs text-slate-500">{grupo.totalAlumnos} alumno(s)</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1">
                    <Link to={`/docente/grupos/${grupo.id}/estadisticas`} className={buttonClasses('ghost', 'sm')}>
                      <Icon name="bar_chart" size={16} />
                      Estadisticas
                    </Link>
                    <Button variant="danger" size="sm" icon="delete" loading={eliminando} onClick={() => handleEliminar(grupo)}>
                      {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {seleccionados.length >= 2 && (
        <Card className="flex flex-wrap items-center gap-3 border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          <Icon name="compare_arrows" className="text-primary-600" />
          <span>Reporte comparativo de {seleccionados.length} grupos:</span>
          <ReporteBoton base={{ tipo: 'COMPARATIVO', grupoIds: seleccionados }} etiqueta="Generar" />
        </Card>
      )}
    </div>
  )
}
