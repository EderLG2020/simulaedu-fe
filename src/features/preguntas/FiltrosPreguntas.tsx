import type { UsuarioAdmin } from '../../api/adminUsuariosApi'
import type { CursoConTemas } from '../../api/cursosApi'
import type { Dificultad, EstadoPregunta } from '../../api/preguntasApi'
import { Card, Select } from '../../components/ui'
import { ESTADO_INFO, OPCIONES_DIFICULTAD } from './etiquetasPregunta'
import OpcionesTemas from './OpcionesTemas'

interface Props {
  cursos: CursoConTemas[] | null
  docentes: UsuarioAdmin[] | null
  /** El filtro por docente solo lo ve el admin. */
  esAdmin: boolean
  temaFiltro: string
  dificultadFiltro: Dificultad | ''
  estadoFiltro: EstadoPregunta | ''
  autorFiltro: string
  onTema: (temaId: string) => void
  onDificultad: (dificultad: Dificultad | '') => void
  onEstado: (estado: EstadoPregunta | '') => void
  onAutor: (docenteId: string) => void
}

/** Barra de filtros del banco de preguntas (tema, dificultad, estado y, para admin, docente autor). */
export default function FiltrosPreguntas({
  cursos,
  docentes,
  esAdmin,
  temaFiltro,
  dificultadFiltro,
  estadoFiltro,
  autorFiltro,
  onTema,
  onDificultad,
  onEstado,
  onAutor,
}: Props) {
  return (
    <Card className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
      <Select aria-label="Filtrar por tema" value={temaFiltro} onChange={(e) => onTema(e.target.value)}>
        <option value="">Todos los cursos y temas</option>
        <OpcionesTemas cursos={cursos} />
      </Select>
      <Select aria-label="Filtrar por dificultad" value={dificultadFiltro} onChange={(e) => onDificultad(e.target.value as Dificultad | '')}>
        <option value="">Todas las dificultades</option>
        {OPCIONES_DIFICULTAD.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Select aria-label="Filtrar por estado" value={estadoFiltro} onChange={(e) => onEstado(e.target.value as EstadoPregunta | '')}>
        <option value="">Todos los estados</option>
        {(Object.keys(ESTADO_INFO) as EstadoPregunta[]).map((e) => (
          <option key={e} value={e}>
            {ESTADO_INFO[e].label}
          </option>
        ))}
      </Select>
      {esAdmin && (
        <Select aria-label="Filtrar por docente" value={autorFiltro} onChange={(e) => onAutor(e.target.value)}>
          <option value="">Todos los docentes</option>
          {docentes?.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </Select>
      )}
    </Card>
  )
}
