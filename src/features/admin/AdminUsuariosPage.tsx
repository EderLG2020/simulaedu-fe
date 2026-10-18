import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  eliminarUsuario,
  listarUsuarios,
  reactivarUsuario,
  suspenderUsuario,
  type EstadoUsuario,
  type RolUsuario,
  type UsuarioAdmin,
} from '../../api/adminUsuariosApi'
import { claves } from '../../api/claves'
import { mensajeDeError } from '../../api/client'
import {
  Alert,
  Badge,
  Button,
  Card,
  cn,
  EmptyState,
  Icon,
  PageHeader,
  Pagination,
  Select,
  Table,
  TableHead,
  Td,
  Th,
  type TonoBadge,
} from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

/** Migracion 1:1 del mockup de Stitch (antes en public/, ya eliminado) - mismo sistema de
 * colores/tipografia que AdminDashboardPage, sin repetir el sidebar (esta pagina no lo tiene
 * todavia, ver nota en AdminDashboardPage). Toda la data es real: nada de filas de ejemplo. */

/** 'violet' es decorativo y exclusivo del rol Docente (no existe como tono del kit). */
const ROL_BADGE: Record<RolUsuario, { icono: string; tono: TonoBadge | 'violet'; label: string }> = {
  ADMIN: { icono: 'shield_person', tono: 'primary', label: 'Admin' },
  DOCENTE: { icono: 'menu_book', tono: 'violet', label: 'Docente' },
  COORDINADOR: { icono: 'corporate_fare', tono: 'neutral', label: 'Coordinador' },
  ESTUDIANTE: { icono: 'school', tono: 'neutral', label: 'Estudiante' },
}

const ESTADO_BADGE: Record<EstadoUsuario, { tono: TonoBadge; punto: string; label: string }> = {
  ACTIVO: { tono: 'success', punto: 'bg-emerald-500', label: 'Activo' },
  SUSPENDIDO: { tono: 'warning', punto: 'bg-amber-500', label: 'Suspendido' },
  ELIMINADO: { tono: 'neutral', punto: 'bg-slate-400', label: 'Eliminado' },
}

/** Badge del rol: usa el Badge del kit salvo para el tono violeta (Docente), que el kit no trae. */
function RolBadge({ rol }: { rol: RolUsuario }) {
  const info = ROL_BADGE[rol]
  const contenido = (
    <>
      <Icon name={info.icono} size={14} />
      {info.label}
    </>
  )
  if (info.tono === 'violet') {
    return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">{contenido}</span>
  }
  return <Badge tone={info.tono}>{contenido}</Badge>
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase()
}

function formatearFecha(fecha: string | null): string {
  return fecha === null ? '—' : new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const LIMITE_POR_PAGINA = 20

export default function AdminUsuariosPage() {
  const { usuario: propioUsuario } = useAuth()
  const [rolFiltro, setRolFiltro] = useState<RolUsuario | ''>('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoUsuario | ''>('')
  const [pagina, setPagina] = useState(1)
  const filtros = { rol: rolFiltro || undefined, estado: estadoFiltro || undefined, page: pagina, limit: LIMITE_POR_PAGINA }
  const consulta = useQuery({ queryKey: claves.usuarios(filtros), queryFn: () => listarUsuarios(filtros), placeholderData: keepPreviousData })
  const usuarios = consulta.data?.data ?? null
  const meta = consulta.data?.meta ?? null
  const [errorAccion, setError] = useState<string | null>(null)
  const error = errorAccion ?? (consulta.isError ? 'No se pudieron cargar los usuarios.' : null)
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)

  function cargar() {
    void consulta.refetch()
  }

  function handleCambiarRolFiltro(valor: RolUsuario | '') {
    setRolFiltro(valor)
    setPagina(1)
  }

  function handleCambiarEstadoFiltro(valor: EstadoUsuario | '') {
    setEstadoFiltro(valor)
    setPagina(1)
  }

  function motivoBloqueo(usuarioObjetivo: UsuarioAdmin): string | undefined {
    if (usuarioObjetivo.id === propioUsuario?.id) return 'No puedes modificar tu propia cuenta'
    if (usuarioObjetivo.rol === 'ADMIN') return 'Cuenta con privilegios de administrador protegida'
    return undefined
  }

  async function handleSuspender(usuarioObjetivo: UsuarioAdmin) {
    setError(null)
    setAccionEnProceso(usuarioObjetivo.id)
    try {
      await suspenderUsuario(usuarioObjetivo.id)
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo suspender al usuario.'))
    } finally {
      setAccionEnProceso(null)
    }
  }

  async function handleReactivar(usuarioObjetivo: UsuarioAdmin) {
    setError(null)
    setAccionEnProceso(usuarioObjetivo.id)
    try {
      await reactivarUsuario(usuarioObjetivo.id)
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo reactivar al usuario.'))
    } finally {
      setAccionEnProceso(null)
    }
  }

  async function handleEliminar(usuarioObjetivo: UsuarioAdmin) {
    if (!window.confirm(`¿Eliminar la cuenta de ${usuarioObjetivo.nombre}? Esta accion no se puede deshacer.`)) return

    setError(null)
    setAccionEnProceso(usuarioObjetivo.id)
    try {
      await eliminarUsuario(usuarioObjetivo.id)
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar al usuario.'))
    } finally {
      setAccionEnProceso(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-primary-600">Módulo Administrativo</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">SimulaEdu Perú</span>
        </div>
        <PageHeader
          title="Gestión de Usuarios"
          description="Directorio general de estudiantes, docentes y administradores de la plataforma."
          actions={
            <Badge>
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Auto-registro activo
            </Badge>
          }
        />
      </div>

      {error && <Alert>{error}</Alert>}

      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <Select aria-label="Filtrar por rol" value={rolFiltro} onChange={(evento) => handleCambiarRolFiltro(evento.target.value as RolUsuario | '')}>
            <option value="">Todos los roles</option>
            <option value="ESTUDIANTE">Estudiante</option>
            <option value="DOCENTE">Docente</option>
            <option value="COORDINADOR">Coordinador</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Select aria-label="Filtrar por estado" value={estadoFiltro} onChange={(evento) => handleCambiarEstadoFiltro(evento.target.value as EstadoUsuario | '')}>
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="SUSPENDIDO">Suspendido</option>
            <option value="ELIMINADO">Eliminado</option>
          </Select>
        </div>
        {meta && (
          <span className="whitespace-nowrap px-1 text-xs text-slate-500">
            Mostrando <strong className="font-semibold text-slate-900">{usuarios?.length ?? 0}</strong> de{' '}
            <strong className="font-semibold text-slate-900">{meta.total}</strong> usuarios
          </span>
        )}
      </Card>

      <Card className="overflow-hidden">
        {usuarios === null && !error && <EmptyState icon="hourglass_empty" title="Cargando usuarios..." />}
        {usuarios !== null && usuarios.length === 0 && <EmptyState icon="group" title="No hay usuarios que coincidan con estos filtros." />}

        {usuarios !== null && usuarios.length > 0 && (
          <Table>
            <TableHead>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th>Institución</Th>
              <Th>Creado</Th>
              <Th className="text-right">Acciones</Th>
            </TableHead>
            <tbody>
              {usuarios.map((usuarioFila) => {
                const esYo = usuarioFila.id === propioUsuario?.id
                const estadoInfo = ESTADO_BADGE[usuarioFila.estado]
                const bloqueado = motivoBloqueo(usuarioFila)
                const eliminado = usuarioFila.estado === 'ELIMINADO'
                const ocupado = accionEnProceso === usuarioFila.id
                return (
                  <tr key={usuarioFila.id} className={eliminado ? 'opacity-70' : undefined}>
                    <Td className="whitespace-nowrap align-middle">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold',
                            esYo ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {iniciales(usuarioFila.nombre)}
                        </div>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className={cn('truncate font-semibold', eliminado ? 'text-slate-500 line-through' : 'text-slate-900')}>{usuarioFila.nombre}</span>
                          {esYo && <Badge tone="primary">Tú</Badge>}
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5">
                        <span className={eliminado ? 'text-slate-400' : 'text-slate-700'}>{usuarioFila.email}</span>
                        {usuarioFila.emailVerificado ? (
                          <span title="Correo verificado" className="inline-flex text-primary-600">
                            <Icon name="verified" size={16} />
                          </span>
                        ) : (
                          <Badge tone="warning">
                            <Icon name="warning" size={14} />
                            Sin verificar
                          </Badge>
                        )}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap align-middle">
                      <RolBadge rol={usuarioFila.rol} />
                    </Td>
                    <Td className="whitespace-nowrap align-middle">
                      <Badge tone={estadoInfo.tono}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', estadoInfo.punto)} />
                        {estadoInfo.label}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap align-middle text-slate-500">
                      {usuarioFila.institucionId ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Icon name="domain" size={16} className="text-slate-400" />
                          Vinculada
                        </span>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td className="whitespace-nowrap align-middle text-xs text-slate-500">{formatearFecha(usuarioFila.creadoEn)}</Td>
                    <Td className="whitespace-nowrap py-2.5 text-right align-middle">
                      {bloqueado ? (
                        <div className="inline-flex cursor-not-allowed select-none items-center gap-1.5 text-slate-400" title={bloqueado}>
                          {usuarioFila.estado === 'ACTIVO' && <span className="px-3 text-xs font-semibold">Suspender</span>}
                          <span className="flex h-8 w-8 items-center justify-center">
                            <Icon name="lock" />
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          {usuarioFila.estado === 'ACTIVO' && (
                            <Button variant="secondary" size="sm" disabled={ocupado} onClick={() => handleSuspender(usuarioFila)}>
                              Suspender
                            </Button>
                          )}
                          {usuarioFila.estado === 'SUSPENDIDO' && (
                            <Button variant="secondary" size="sm" disabled={ocupado} onClick={() => handleReactivar(usuarioFila)}>
                              Reactivar
                            </Button>
                          )}
                          {!eliminado && (
                            <Button
                              variant="danger"
                              size="icon"
                              title="Eliminar registro"
                              aria-label="Eliminar registro"
                              disabled={ocupado}
                              onClick={() => handleEliminar(usuarioFila)}
                            >
                              <Icon name="delete" />
                            </Button>
                          )}
                        </div>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}

        {meta !== null && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} itemLabel="usuarios" onChange={setPagina} />}
      </Card>

      <Card className="flex items-start gap-4 p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon name="how_to_reg" size={20} />
        </span>
        <div className="flex flex-col">
          <h4 className="font-display text-base font-bold text-slate-900">Auto-registro de Postulantes</h4>
          <p className="mt-1 text-sm text-slate-600">
            En SimulaEdu no existe botón para crear usuarios manualmente desde el panel de control. Los estudiantes y postulantes completan su registro
            directamente desde la landing pública.
          </p>
        </div>
      </Card>
    </div>
  )
}
