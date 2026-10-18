import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { claves } from '../../api/claves'
import { mensajeDeError } from '../../api/client'
import { duplicarPregunta, eliminarPregunta, listarPreguntas, type Dificultad, type EstadoPregunta, type Pregunta } from '../../api/preguntasApi'
import { Alert, Button, PageHeader } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useCursos, useDocentes, useUniversidades } from '../../hooks/useCatalogos'
import FiltrosPreguntas from './FiltrosPreguntas'
import ImportarPreguntasModal from './ImportarPreguntasModal'
import ModalPregunta from './ModalPregunta'
import TablaPreguntas from './TablaPreguntas'
import { useFormularioPregunta } from './useFormularioPregunta'

/** Usada tanto por Docente como Admin (mismo RBAC de backend) - ver router.tsx (/docente/preguntas y
 * /admin/preguntas montan este mismo componente). El editor de enunciado es un textarea
 * con formato basico (negrita/cursiva/lista via envoltura de tags) e insercion de imagen
 * real (sube a Cloudinary via preguntasApi.subirImagenPregunta) - no es un WYSIWYG/LaTeX
 * completo (TipTap+KaTeX), eso queda para un paso aparte, ya avisado. */

const LIMITE_POR_PAGINA = 20

export default function BancoPreguntasPage() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMIN'

  const queryClient = useQueryClient()
  const consultaCursos = useCursos()
  const cursos = consultaCursos.data ?? null
  const universidades = useUniversidades().data ?? null
  const docentes = useDocentes(esAdmin).data ?? null

  const [temaFiltro, setTemaFiltro] = useState('')
  const [dificultadFiltro, setDificultadFiltro] = useState<Dificultad | ''>('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoPregunta | ''>('')
  const [autorFiltro, setAutorFiltro] = useState('')
  const [pagina, setPagina] = useState(1)
  const filtros = {
    temaId: temaFiltro || undefined,
    dificultad: dificultadFiltro || undefined,
    estado: estadoFiltro || undefined,
    autorDocenteId: esAdmin ? autorFiltro || undefined : undefined,
    page: pagina,
    limit: LIMITE_POR_PAGINA,
  }
  const consulta = useQuery({ queryKey: claves.preguntas(filtros), queryFn: () => listarPreguntas(filtros), placeholderData: keepPreviousData })
  const preguntas: Pregunta[] | null = consulta.data?.data ?? null
  const meta = consulta.data?.meta ?? null
  const [errorAccion, setError] = useState<string | null>(null)
  const error =
    errorAccion ??
    (consultaCursos.isError ? 'No se pudieron cargar los cursos/temas.' : consulta.isError ? 'No se pudieron cargar las preguntas.' : null)
  const [accionEnProceso, setAccionEnProceso] = useState<string | null>(null)

  const [importarAbierto, setImportarAbierto] = useState(false)

  /** Crear/editar/duplicar/eliminar cambia esta lista y la de moderacion: se invalidan ambas. */
  function cargar() {
    void queryClient.invalidateQueries({ queryKey: claves.preguntasTodo })
  }

  const temaANombre = useMemo(() => {
    const mapa = new Map<string, string>()
    cursos?.forEach((c) => c.temas.forEach((t) => mapa.set(t.id, `${c.nombre} • ${t.nombre}`)))
    return mapa
  }, [cursos])

  const universidadANombre = useMemo(() => {
    const mapa = new Map<string, string>()
    universidades?.forEach((u) => mapa.set(u.id, u.siglas))
    return mapa
  }, [universidades])

  const form = useFormularioPregunta(cargar)

  /** Al cambiar un filtro se vuelve a la primera pagina. */
  function filtrarPor<T>(fijar: (valor: T) => void) {
    return (valor: T) => {
      fijar(valor)
      setPagina(1)
    }
  }

  async function handleDuplicar(pregunta: Pregunta) {
    setError(null)
    setAccionEnProceso(pregunta.id)
    try {
      await duplicarPregunta(pregunta.id)
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo duplicar la pregunta.'))
    } finally {
      setAccionEnProceso(null)
    }
  }

  async function handleEliminar(pregunta: Pregunta) {
    if (!window.confirm('¿Eliminar esta pregunta? Esta acción no se puede deshacer.')) return
    setError(null)
    setAccionEnProceso(pregunta.id)
    try {
      await eliminarPregunta(pregunta.id)
      cargar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo eliminar la pregunta.'))
    } finally {
      setAccionEnProceso(null)
    }
  }

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHeader
          title="Banco de preguntas"
          description="Reactivos para los simulacros de admisión universitaria."
          actions={
            <>
              <Button variant="secondary" icon="upload_file" onClick={() => setImportarAbierto(true)}>
                Importar
              </Button>
              <Button icon="add" onClick={form.abrirCrear}>
                Nueva pregunta
              </Button>
            </>
          }
        />

        {error && <Alert>{error}</Alert>}

        <FiltrosPreguntas
          cursos={cursos}
          docentes={docentes}
          esAdmin={esAdmin}
          temaFiltro={temaFiltro}
          dificultadFiltro={dificultadFiltro}
          estadoFiltro={estadoFiltro}
          autorFiltro={autorFiltro}
          onTema={filtrarPor(setTemaFiltro)}
          onDificultad={filtrarPor(setDificultadFiltro)}
          onEstado={filtrarPor(setEstadoFiltro)}
          onAutor={filtrarPor(setAutorFiltro)}
        />

        <TablaPreguntas
          preguntas={preguntas}
          error={error}
          meta={meta}
          temaANombre={temaANombre}
          universidadANombre={universidadANombre}
          accionEnProceso={accionEnProceso}
          onEditar={form.abrirEditar}
          onDuplicar={handleDuplicar}
          onEliminar={handleEliminar}
          onCambiarPagina={setPagina}
        />
      </div>

      {importarAbierto && <ImportarPreguntasModal onCerrar={() => setImportarAbierto(false)} onImportado={cargar} />}

      {form.modalAbierto && <ModalPregunta form={form} cursos={cursos} universidades={universidades} universidadANombre={universidadANombre} />}
    </>
  )
}
