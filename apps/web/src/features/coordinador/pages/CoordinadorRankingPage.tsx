import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { claves } from '../../../shared/api/claves'
import { mensajeDeError } from '../../../shared/api/client'
import { obtenerInstitucion, obtenerRankingInstitucion, type PeriodoRanking } from '../api/coordinadorApi'
import Avatar from '../../../shared/components/Avatar'
import { Alert, Card, EmptyState, Icon, PageHeader, Pagination, PanelVacio, SegmentedControl } from '../../../shared/components/ui'
import { formatearPuntaje } from '../lib/formato'

const OPCIONES_PERIODO: { value: PeriodoRanking; label: string }[] = [
  { value: 'SEMANAL', label: 'Semana' },
  { value: 'MENSUAL', label: 'Mes' },
  { value: 'HISTORICO', label: 'Histórico' },
]

const POR_PAGINA = 25

/** Medalla de los tres primeros puestos. */
const MEDALLAS = ['bg-amber-400 text-amber-950', 'bg-slate-300 text-slate-800', 'bg-orange-300 text-orange-950']

export default function CoordinadorRankingPage() {
  const [periodo, setPeriodo] = useState<PeriodoRanking>('HISTORICO')
  const [pagina, setPagina] = useState(1)
  const consultaInstitucion = useQuery({ queryKey: claves.coordinador.institucion, queryFn: obtenerInstitucion })
  const institucionId = consultaInstitucion.data?.id ?? null
  const consulta = useQuery({
    queryKey: claves.ranking('INSTITUCION', periodo, institucionId),
    queryFn: () => obtenerRankingInstitucion(institucionId!, periodo),
    enabled: institucionId !== null,
  })
  const entradas = consulta.data?.entradas ?? null
  const totalPaginas = Math.max(1, Math.ceil((entradas?.length ?? 0) / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = entradas?.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA) ?? []
  const cargando = consultaInstitucion.isPending || (institucionId !== null && consulta.isPending)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Ranking interno"
        description="Posición de tus alumnos según el promedio de sus simulacros completos."
        actions={
          <SegmentedControl
            options={OPCIONES_PERIODO}
            value={periodo}
            onChange={(v) => {
              setPeriodo(v)
              setPagina(1)
            }}
            ariaLabel="Periodo"
            className="flex-nowrap"
          />
        }
      />

      {consultaInstitucion.isError && <Alert>No se pudo cargar la información de tu institución.</Alert>}
      {consulta.isError && <Alert>{mensajeDeError(consulta.error, 'No se pudo cargar el ranking.')}</Alert>}

      {cargando && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando ranking..." />
        </Card>
      )}

      {entradas !== null && entradas.length === 0 && (
        <PanelVacio
          icon="leaderboard"
          title="El ranking aún está vacío"
          description="Se recalcula una vez al día con los simulacros completos de tus alumnos. Si rindieron hoy, aparecerán mañana."
          action={
            <Link to="/coordinador/alumnos" className="text-sm font-semibold text-primary-600 hover:underline">
              Ver la actividad de los alumnos
            </Link>
          }
        />
      )}

      {entradas !== null && entradas.length > 0 && (
        <Card className="overflow-hidden">
          <ol aria-label="Ranking de la institución" className="divide-y divide-slate-100">
            {visibles.map((e) => (
              <li key={e.usuarioId}>
                <Link to={`/coordinador/alumnos/${e.usuarioId}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50/60 sm:px-5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                      e.posicion <= 3 ? MEDALLAS[e.posicion - 1] : 'text-slate-500'
                    }`}
                  >
                    {e.posicion}
                  </span>
                  <Avatar nombre={e.nombre} className="h-9 w-9 text-xs" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{e.nombre}</span>
                  <span className="shrink-0 text-sm font-bold text-slate-900">
                    {formatearPuntaje(e.puntajeReferencia)} <span className="text-xs font-medium text-slate-500">pts</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <Pagination page={paginaActual} totalPages={totalPaginas} total={entradas.length} itemLabel="alumnos" onChange={setPagina} />
          <p className="flex items-center gap-1.5 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <Icon name="schedule" size={16} />
            El ranking se recalcula una vez al día.
          </p>
        </Card>
      )}
    </div>
  )
}
