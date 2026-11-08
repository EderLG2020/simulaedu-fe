import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { claves } from '../../../shared/api/claves'
import { mensajeDeError } from '../../../shared/api/client'
import { crearSeccion, listarDocentes, listarSecciones, type SeccionInput } from '../api/coordinadorApi'
import { Alert, Button, Card, EmptyState, Icon, PageHeader } from '../../../shared/components/ui'
import { plural } from '../../../shared/lib/formato'
import SeccionFormModal from '../components/SeccionFormModal'
import { formatearPuntaje } from '../lib/formato'

export default function CoordinadorSeccionesPage() {
  const queryClient = useQueryClient()
  const consulta = useQuery({ queryKey: claves.coordinador.secciones, queryFn: listarSecciones })
  const consultaDocentes = useQuery({ queryKey: claves.coordinador.docentes, queryFn: listarDocentes })
  const secciones = consulta.data ?? null
  const [creando, setCreando] = useState(false)

  async function crear(datos: SeccionInput) {
    await crearSeccion(datos)
    await queryClient.invalidateQueries({ queryKey: claves.coordinador.todo })
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        title="Secciones"
        description="Agrupa a tus alumnos por aula y asigna un docente a cada sección. El docente la verá en «Mis grupos»."
        actions={
          <Button icon="add" onClick={() => setCreando(true)} disabled={!consultaDocentes.isSuccess}>
            Nueva sección
          </Button>
        }
      />

      {consulta.isError && <Alert>{mensajeDeError(consulta.error, 'No se pudieron cargar las secciones.')}</Alert>}
      {consultaDocentes.isError && <Alert>{mensajeDeError(consultaDocentes.error, 'No se pudieron cargar los docentes.')}</Alert>}

      {consulta.isPending && (
        <Card>
          <EmptyState icon="hourglass_empty" title="Cargando secciones..." />
        </Card>
      )}

      {secciones !== null && secciones.length === 0 && (
        <Card>
          <EmptyState icon="groups" title="Todavía no hay secciones.">
            Crea la primera con «Nueva sección».
          </EmptyState>
        </Card>
      )}

      {secciones !== null && secciones.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secciones.map((s) => (
            <li key={s.id}>
              <Link
                to={`/coordinador/secciones/${s.id}`}
                className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-primary-200 hover:bg-primary-50/30 focus-visible:outline-2 focus-visible:outline-primary-600"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Icon name="groups" size={20} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-semibold text-slate-900">{s.nombre}</h2>
                    <p className="truncate text-xs text-slate-500">Docente: {s.docenteNombre}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between text-sm text-slate-700">
                  <span className="flex items-center gap-1">
                    <Icon name="group" size={16} className="text-slate-400" />
                    {plural(s.totalAlumnos, 'alumno', 'alumnos')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="grade" size={16} className="text-slate-400" />
                    Promedio {formatearPuntaje(s.puntajePromedio)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creando && consultaDocentes.data && (
        <SeccionFormModal titulo="Nueva sección" docentes={consultaDocentes.data} onGuardar={crear} onCerrar={() => setCreando(false)} />
      )}
    </div>
  )
}
