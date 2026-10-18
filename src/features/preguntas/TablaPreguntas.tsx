import type { PageMeta } from '../../api/client'
import type { Pregunta } from '../../api/preguntasApi'
import { Badge, Button, Card, cn, EmptyState, Icon, Pagination, Table, TableHead, Td, Th } from '../../components/ui'
import { textoPlanoDe } from '../../lib/html'
import { DIFICULTAD_INFO, ESTADO_INFO, TIPO_INFO } from './etiquetasPregunta'

interface Props {
  /** null mientras carga la primera pagina. */
  preguntas: Pregunta[] | null
  error: string | null
  meta: PageMeta | null
  temaANombre: Map<string, string>
  universidadANombre: Map<string, string>
  /** Id de la pregunta con una accion (duplicar/eliminar) en curso: deshabilita sus botones. */
  accionEnProceso: string | null
  onEditar: (pregunta: Pregunta) => void
  onDuplicar: (pregunta: Pregunta) => void
  onEliminar: (pregunta: Pregunta) => void
  onCambiarPagina: (pagina: number) => void
}

/** Tabla paginada del banco de preguntas con las acciones por fila. */
export default function TablaPreguntas({
  preguntas,
  error,
  meta,
  temaANombre,
  universidadANombre,
  accionEnProceso,
  onEditar,
  onDuplicar,
  onEliminar,
  onCambiarPagina,
}: Props) {
  return (
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
                        <Button variant="ghost" size="icon" title="Editar" aria-label="Editar" disabled={ocupada} onClick={() => onEditar(pregunta)}>
                          <Icon name="edit" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Duplicar" aria-label="Duplicar" disabled={ocupada} onClick={() => onDuplicar(pregunta)}>
                          <Icon name="content_copy" />
                        </Button>
                        <Button variant="danger" size="icon" title="Eliminar" aria-label="Eliminar" disabled={ocupada} onClick={() => onEliminar(pregunta)}>
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

      {meta !== null && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} itemLabel="preguntas" onChange={onCambiarPagina} />}
    </Card>
  )
}
