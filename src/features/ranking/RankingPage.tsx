import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { claves } from '../../api/claves'
import { ApiError, mensajeDeError } from '../../api/client'
import { ERROR_RANKING_SIN_ACCESO, obtenerRanking, type PeriodoRanking, type Ranking, type RankingEntrada } from '../../api/rankingApi'
import Avatar from '../../components/Avatar'
import { Alert, Icon, Pagination, PanelVacio, SegmentedControl } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useUniversidades } from '../../hooks/useCatalogos'
import PaginaAlumno, { CLASE_CTA } from '../home/PaginaAlumno'

type Alcance = 'GLOBAL' | 'UNIVERSIDAD'

const OPCIONES_PERIODO: { value: PeriodoRanking; label: string }[] = [
  { value: 'SEMANAL', label: 'Semana' },
  { value: 'MENSUAL', label: 'Mes' },
  { value: 'HISTORICO', label: 'Histórico' },
]

/** Filas de la tabla por pagina (el podio no cuenta: siempre son los 3 primeros). */
const POR_PAGINA = 20

const formatoPuntaje = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 })

/** Estado de la consulta: cargando, sin acceso por plan (RN-03), error, o el ranking. */
type Resultado = { tipo: 'cargando' } | { tipo: 'sin-acceso' } | { tipo: 'error'; mensaje: string } | { tipo: 'ok'; ranking: Ranking }

const ESTILO_PODIO = [
  { medalla: 'bg-amber-400 text-amber-950', alto: 'sm:pt-0', icono: 'workspace_premium', etiqueta: '1.er lugar' },
  { medalla: 'bg-slate-300 text-slate-800', alto: 'sm:pt-8', icono: 'military_tech', etiqueta: '2.º lugar' },
  { medalla: 'bg-orange-300 text-orange-950', alto: 'sm:pt-12', icono: 'military_tech', etiqueta: '3.er lugar' },
]

function Podio({ entradas }: { entradas: RankingEntrada[] }) {
  // Orden visual 2-1-3 en escritorio (el primero al centro y mas alto); en celular, 1-2-3 apilados.
  const orden = [1, 0, 2].filter((i) => entradas[i])
  return (
    <ol aria-label="Podio" className="entrada-escalonada grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-start">
      {orden.map((i) => {
        const e = entradas[i]
        const estilo = ESTILO_PODIO[i]
        return (
          <li key={e.usuarioId} className={`${i === 0 ? 'order-first sm:order-none' : ''} ${estilo.alto}`}>
            <div
              className={`flex flex-col items-center rounded-2xl border bg-white px-4 py-5 text-center shadow-sm ${
                e.esUsuarioActual ? 'border-primary-600 ring-2 ring-primary-600/20' : 'border-slate-200'
              }`}
            >
              <div className="relative">
                <Avatar nombre={e.nombre} className="h-14 w-14 text-lg" />
                <span
                  className={`absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2 ring-white ${estilo.medalla}`}
                  aria-label={estilo.etiqueta}
                >
                  {e.posicion}
                </span>
              </div>
              <p className="mt-3 line-clamp-1 font-display text-sm font-bold text-slate-900">
                {e.nombre}
                {e.esUsuarioActual && <span className="ml-1 text-primary-600">(tú)</span>}
              </p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold text-primary-600">
                <Icon name={estilo.icono} size={18} className="text-amber-500" />
                {formatoPuntaje.format(e.puntajeReferencia)}
                <span className="text-xs font-medium text-slate-500">pts</span>
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function TablaRanking({ entradas }: { entradas: RankingEntrada[] }) {
  return (
    <ol aria-label="Resto del ranking" className="divide-y divide-slate-200">
      {entradas.map((e) => (
        <li
          key={e.usuarioId}
          aria-current={e.esUsuarioActual ? 'true' : undefined}
          className={`flex items-center gap-4 px-4 py-3 sm:px-5 ${e.esUsuarioActual ? 'bg-primary-50' : ''}`}
        >
          <span className="w-8 shrink-0 text-right font-display text-sm font-bold text-slate-500">{e.posicion}</span>
          <Avatar nombre={e.nombre} className="h-9 w-9 text-xs" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
            {e.nombre}
            {e.esUsuarioActual && <span className="ml-1 text-primary-600">(tú)</span>}
          </span>
          <span className="shrink-0 text-sm font-bold text-slate-900">
            {formatoPuntaje.format(e.puntajeReferencia)} <span className="text-xs font-medium text-slate-500">pts</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

function SinAcceso() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-accent-100/70 blur-3xl" />
      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm">
          <Icon name="leaderboard" size={30} />
        </div>
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent-50 px-3 py-1 text-[11px] font-bold tracking-wide text-accent-700 uppercase">
          <Icon name="workspace_premium" size={14} />
          Premium
        </span>
        <h2 className="font-display text-xl font-bold text-slate-900">Compárate con otros postulantes</h2>
        <p className="mt-2 text-sm text-slate-700">
          El ranking muestra tu puesto frente a otros alumnos que postulan a tu misma universidad, por semana, por mes o desde
          siempre. Está incluido en el plan Premium.
        </p>
        <ul className="mt-5 flex flex-col gap-2 text-left text-sm text-slate-700">
          {['Tu posición en el ranking global y en tu universidad meta', 'Rankings semanales y mensuales', 'Mira cuánto te falta para el top 10'].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Icon name="check_circle" size={18} className="text-primary-600" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function RankingPage() {
  const { usuario } = useAuth()
  const universidadMetaId = usuario?.universidadObjetivoId ?? null

  const [alcance, setAlcance] = useState<Alcance>(universidadMetaId ? 'UNIVERSIDAD' : 'GLOBAL')
  const [periodo, setPeriodo] = useState<PeriodoRanking>('HISTORICO')
  const [pagina, setPagina] = useState(1)
  const universidadMeta = useUniversidades().data?.find((u) => u.id === universidadMetaId) ?? null

  // Sin universidad meta, el unico alcance posible es el global.
  const alcanceEfectivo: Alcance = universidadMetaId ? alcance : 'GLOBAL'
  const referenciaId = alcanceEfectivo === 'UNIVERSIDAD' ? universidadMetaId : null
  const consulta = useQuery({
    queryKey: claves.ranking(alcanceEfectivo, periodo, referenciaId),
    queryFn: () => obtenerRanking(alcanceEfectivo, periodo, referenciaId),
  })
  const resultado: Resultado = consulta.isPending
    ? { tipo: 'cargando' }
    : consulta.isError
      ? consulta.error instanceof ApiError && consulta.error.code === ERROR_RANKING_SIN_ACCESO
        ? { tipo: 'sin-acceso' }
        : { tipo: 'error', mensaje: mensajeDeError(consulta.error, 'No se pudo cargar el ranking.') }
      : { tipo: 'ok', ranking: consulta.data }

  function cambiarFiltro(cambio: () => void) {
    cambio()
    setPagina(1)
  }

  const opcionesAlcance: { value: Alcance; label: string; icon: string }[] = [
    ...(universidadMetaId ? [{ value: 'UNIVERSIDAD' as const, label: universidadMeta?.siglas ?? 'Mi universidad', icon: 'school' }] : []),
    { value: 'GLOBAL', label: 'Global', icon: 'public' },
  ]

  const ranking = resultado.tipo === 'ok' ? resultado.ranking : null
  const podio = ranking?.entradas.slice(0, 3) ?? []
  const resto = ranking?.entradas.slice(3) ?? []
  const totalPaginas = Math.max(1, Math.ceil(resto.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const restoVisible = resto.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)
  const miEntrada = ranking?.entradas.find((e) => e.esUsuarioActual) ?? null

  return (
    <PaginaAlumno
      migas={[{ label: 'Inicio', to: '/' }, { label: 'Ranking' }]}
      titulo="Ranking"
      descripcion="Tu puesto según el promedio de tus simulacros completos."
    >
      {resultado.tipo === 'sin-acceso' ? (
        <SinAcceso />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedControl
              options={opcionesAlcance}
              value={alcanceEfectivo}
              onChange={(v) => cambiarFiltro(() => setAlcance(v))}
              ariaLabel="Ranking de"
              className="w-full flex-nowrap sm:w-auto"
            />
            <SegmentedControl
              options={OPCIONES_PERIODO}
              value={periodo}
              onChange={(v) => cambiarFiltro(() => setPeriodo(v))}
              ariaLabel="Periodo"
              className="w-full flex-nowrap sm:w-auto"
            />
          </div>

          {resultado.tipo === 'error' && <Alert>{resultado.mensaje}</Alert>}

          {resultado.tipo === 'cargando' && (
            <div aria-busy="true" aria-label="Cargando ranking" className="flex flex-col gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
              <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
            </div>
          )}

          {ranking && (
            <>
              <section
                aria-label="Tu posición"
                className="flex items-center gap-4 rounded-2xl border border-primary-600/20 bg-gradient-to-r from-primary-600 to-primary-800 p-5 text-white shadow-sm"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <Icon name="emoji_events" size={30} />
                </div>
                {miEntrada ? (
                  <div className="min-w-0">
                    <p className="text-sm text-white/80">Tu posición</p>
                    <p className="font-display text-2xl font-bold">
                      #{miEntrada.posicion}{' '}
                      <span className="text-base font-medium text-white/80">de {ranking.entradas.length}</span>
                    </p>
                    <p className="text-sm text-white/80">{formatoPuntaje.format(miEntrada.puntajeReferencia)} pts de promedio</p>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold">Todavía no apareces en este ranking</p>
                    <p className="text-sm text-white/80">
                      Rinde un simulacro completo para entrar. El ranking se actualiza una vez al día.
                    </p>
                  </div>
                )}
              </section>

              {ranking.entradas.length === 0 ? (
                <PanelVacio
                  icon="leaderboard"
                  title="Aún no hay nadie en este ranking"
                  description="Sé el primero: rinde un simulacro completo y aparecerás aquí cuando se actualice."
                  action={
                    <Link to={universidadMetaId ? `/examenes/${universidadMetaId}` : '/examenes'} className={CLASE_CTA}>
                      Rendir un simulacro
                      <Icon name="arrow_forward" size={16} />
                    </Link>
                  }
                />
              ) : (
                <>
                  <Podio entradas={podio} />
                  {resto.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <TablaRanking entradas={restoVisible} />
                      <Pagination page={paginaActual} totalPages={totalPaginas} total={resto.length} itemLabel="alumnos" onChange={setPagina} />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </PaginaAlumno>
  )
}
