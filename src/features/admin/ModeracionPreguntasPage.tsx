import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { claves } from '../../api/claves'
import { mensajeDeError } from '../../api/client'
import { aprobarPregunta, listarPreguntas, publicarPregunta, type Pregunta } from '../../api/preguntasApi'
import { Alert, Badge, Button, Card, cn, EmptyState, PageHeader, SegmentedControl, Select } from '../../components/ui'
import { CLASE_CODIGO_Y_AUDIO } from '../simulacro/estilosSimulacro'
import { useCursos, useDocentes } from '../../hooks/useCatalogos'
import { htmlSeguro } from '../../lib/html'

/** Migracion 1:1 del mockup de Stitch (antes en public/, ya eliminado). Cola de preguntas
 * en Borrador o Aprobada (aun no Publicada) - sin esto ninguna pregunta que cree un docente
 * llega a "publicada", y el examen aleatorio solo toma preguntas publicadas. */

const LIMITE_POR_PAGINA = 20

type Pestana = 'BORRADOR' | 'APROBADA'

const PESTANAS: { value: Pestana; label: string }[] = [
  { value: 'BORRADOR', label: 'Por aprobar' },
  { value: 'APROBADA', label: 'Por publicar' },
]

export default function ModeracionPreguntasPage() {
  const cursos = useCursos().data ?? null
  const docentes = useDocentes().data ?? null
  const [temaFiltro, setTemaFiltro] = useState('')
  const [autorFiltro, setAutorFiltro] = useState('')
  const [pestana, setPestana] = useState<Pestana>('BORRADOR')

  const queryClient = useQueryClient()
  const filtros = { estado: pestana, temaId: temaFiltro || undefined, autorDocenteId: autorFiltro || undefined }
  const consulta = useQuery({
    queryKey: claves.moderacion(filtros),
    queryFn: () => listarPreguntas({ ...filtros, page: 1, limit: LIMITE_POR_PAGINA }).then((r) => r.data),
  })
  const preguntas = consulta.data ?? null
  const [errorAccion, setError] = useState<string | null>(null)
  const error = errorAccion ?? (consulta.isError ? 'No se pudieron cargar las preguntas pendientes.' : null)
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)

  /** Aprobar/publicar cambia esta lista y tambien la del banco de preguntas: se invalidan ambas. */
  function cargar() {
    void queryClient.invalidateQueries({ queryKey: claves.preguntasTodo })
  }

  const temaANombre = useMemo(() => {
    const mapa = new Map<string, string>()
    cursos?.forEach((c) => c.temas.forEach((t) => mapa.set(t.id, `${c.nombre} • ${t.nombre}`)))
    return mapa
  }, [cursos])

  const docenteANombre = useMemo(() => {
    const mapa = new Map<string, string>()
    docentes?.forEach((d) => mapa.set(d.id, d.nombre))
    return mapa
  }, [docentes])

  async function handleAprobar(pregunta: Pregunta) {
    setError(null)
    setAccionEnProceso(pregunta.id)
    try {
      await aprobarPregunta(pregunta.id)
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo aprobar la pregunta.'))
    } finally {
      setAccionEnProceso(null)
    }
  }

  async function handlePublicar(pregunta: Pregunta) {
    setError(null)
    setAccionEnProceso(pregunta.id)
    try {
      await publicarPregunta(pregunta.id)
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo publicar la pregunta.'))
    } finally {
      setAccionEnProceso(null)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Moderación de Preguntas"
        description="Aprueba y publica el contenido creado por los docentes antes de que llegue a los simulacros."
        actions={preguntas && <Badge tone="warning">{preguntas.length} pendientes</Badge>}
      />

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SegmentedControl className="self-start sm:w-72" options={PESTANAS} value={pestana} onChange={setPestana} />
        <Card className="grid flex-1 grid-cols-1 gap-3 p-3 sm:grid-cols-2">
          <Select aria-label="Filtrar por tema" value={temaFiltro} onChange={(e) => setTemaFiltro(e.target.value)}>
            <option value="">Todos los cursos / temas</option>
            {cursos?.map((c) => (
              <optgroup key={c.id} label={c.nombre}>
                {c.temas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <Select aria-label="Filtrar por docente" value={autorFiltro} onChange={(e) => setAutorFiltro(e.target.value)}>
            <option value="">Todos los docentes</option>
            {docentes?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </Select>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {preguntas === null && !error && (
          <Card>
            <EmptyState icon="hourglass_empty" title="Cargando..." />
          </Card>
        )}
        {preguntas !== null && preguntas.length === 0 && (
          <Card>
            <EmptyState icon="task_alt" title={`No hay preguntas ${pestana === 'BORRADOR' ? 'pendientes de aprobar' : 'aprobadas pendientes de publicar'}.`} />
          </Card>
        )}
        {preguntas?.map((pregunta) => {
          const ocupada = accionEnProceso === pregunta.id
          return (
            <Card key={pregunta.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-xs">
                  <span className="truncate font-semibold text-primary-600">{temaANombre.get(pregunta.temaId) ?? '—'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="truncate text-slate-500">{docenteANombre.get(pregunta.autorDocenteId ?? '') ?? 'Autor desconocido'}</span>
                </div>
                <Badge>{pregunta.dificultad}</Badge>
              </div>
              <div className={`text-sm text-slate-800 [&_img]:max-w-xs [&_img]:rounded-lg ${CLASE_CODIGO_Y_AUDIO}`} dangerouslySetInnerHTML={{ __html: htmlSeguro(pregunta.enunciadoHtml) }} />
              {pregunta.alternativas.length > 0 && (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {pregunta.alternativas.map((a) => (
                    <li
                      key={a.id}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-lg border px-3 py-2',
                        a.esCorrecta ? 'border-emerald-200 bg-emerald-50 font-medium text-emerald-800' : 'border-slate-200 text-slate-600',
                      )}
                    >
                      <span>{a.textoHtml}</span>
                      {a.esCorrecta && <Badge tone="success">Correcta</Badge>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                {pregunta.estado === 'BORRADOR' && (
                  <Button size="sm" icon="check" disabled={ocupada} onClick={() => handleAprobar(pregunta)}>
                    Aprobar
                  </Button>
                )}
                {pregunta.estado === 'APROBADA' && (
                  <Button size="sm" icon="publish" disabled={ocupada} onClick={() => handlePublicar(pregunta)}>
                    Publicar
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
