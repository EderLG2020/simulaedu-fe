import { useEffect, useState } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import type { PageMeta } from '../../api/client'
import { contarNoLeidas, listarNotificaciones, marcarLeida, type Notificacion } from '../../api/notificacionesApi'
import StudentHeader from '../home/StudentHeader'
import type { ContextoPanel } from '../panel/PanelLayout'
import { Alert, Badge, Button, Card, cn, EmptyState, Icon, PageHeader } from '../../components/ui'

const LIMITE_POR_PAGINA = 20

function formatearFecha(fecha: string | null): string {
  return fecha === null ? '-' : new Date(fecha).toLocaleString()
}

export default function NotificacionesPage() {
  // En /admin, /docente y /coordinador se monta dentro del PanelLayout de cada rol: sin relleno propio
  // ni el StudentHeader del alumno, y avisa al layout para que actualice el contador de no leidas del sidebar.
  const enPanel = /^\/(admin|docente|coordinador)(\/|$)/.test(useLocation().pathname)
  const contextoPanel = useOutletContext<ContextoPanel | undefined>()
  const [notificaciones, setNotificaciones] = useState<Notificacion[] | null>(null)
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [pagina, setPagina] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [marcandoId, setMarcandoId] = useState<string | null>(null)
  // Fuera de los paneles se muestra el StudentHeader: se le pasa el conteo para que baje al marcar como leida.
  const [noLeidasAlumno, setNoLeidasAlumno] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (enPanel) return
    contarNoLeidas().then(setNoLeidasAlumno).catch(() => {})
  }, [enPanel])

  function cargar() {
    listarNotificaciones(pagina, LIMITE_POR_PAGINA)
      .then((resultado) => {
        setNotificaciones(resultado.data)
        setMeta(resultado.meta)
      })
      .catch(() => setError('No se pudieron cargar las notificaciones.'))
  }

  useEffect(cargar, [pagina])

  async function handleMarcarLeida(notificacion: Notificacion) {
    if (notificacion.leida) return
    setMarcandoId(notificacion.id)
    try {
      await marcarLeida(notificacion.id)
      contextoPanel?.refrescarNoLeidas()
      setNoLeidasAlumno((n) => (n === undefined ? n : Math.max(0, n - 1)))
      setNotificaciones((actual) =>
        actual === null ? actual : actual.map((n) => (n.id === notificacion.id ? { ...n, leida: true } : n)),
      )
    } catch {
      setError('No se pudo marcar la notificacion como leida.')
    } finally {
      setMarcandoId(null)
    }
  }

  const haySiguiente = notificaciones !== null && meta !== null && notificaciones.length === LIMITE_POR_PAGINA && pagina < meta.totalPages
  // Si la carga inicial fallo solo queda el Alert: no se pinta una Card vacia.
  const mostrarListado = notificaciones !== null || !error

  return (
    <div className={enPanel ? undefined : 'min-h-screen bg-slate-50 font-body text-slate-900 antialiased'}>
      {!enPanel && <StudentHeader noLeidas={noLeidasAlumno} />}
      <div className={cn('mx-auto flex flex-col gap-6', enPanel ? 'max-w-7xl' : 'max-w-[1100px] px-6 py-8')}>
        <PageHeader title="Notificaciones" />

        {error && <Alert>{error}</Alert>}

        {mostrarListado && (
          <Card className="overflow-hidden">
            {notificaciones === null && <EmptyState icon="hourglass_empty" title="Cargando notificaciones..." />}
            {notificaciones !== null && notificaciones.length === 0 && <EmptyState icon="notifications_off" title="No tienes notificaciones." />}

            {notificaciones !== null && notificaciones.length > 0 && (
              <ul className="list-none divide-y divide-slate-100">
                {notificaciones.map((notificacion) => (
                  <li key={notificacion.id} className={cn('flex items-start gap-3 px-5 py-4', !notificacion.leida && 'bg-primary-50/40')}>
                    <span
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        notificacion.leida ? 'bg-slate-100 text-slate-500' : 'bg-primary-100 text-primary-600',
                      )}
                    >
                      <Icon name={notificacion.leida ? 'drafts' : 'notifications'} size={18} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <p className={cn('text-sm', notificacion.leida ? 'text-slate-700' : 'font-medium text-slate-900')}>{notificacion.mensaje}</p>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {notificacion.leida ? <Badge>Leída</Badge> : <Badge tone="primary">No leída</Badge>}
                          <span>{formatearFecha(notificacion.creadoEn)}</span>
                        </div>
                        {!notificacion.leida && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon="done"
                            disabled={marcandoId === notificacion.id}
                            onClick={() => handleMarcarLeida(notificacion)}
                          >
                            Marcar como leida
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Paginacion a mano: el kit no cubre la regla de "haySiguiente" ni el texto propio de esta pantalla. */}
            {meta !== null && (meta.totalPages > 1 || pagina > 1) && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                <span className="text-xs text-slate-500">
                  Pagina {meta.page} de {meta.totalPages} ({meta.total} notificaciones)
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button variant="secondary" size="sm" disabled={!haySiguiente} onClick={() => setPagina((p) => p + 1)}>
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
