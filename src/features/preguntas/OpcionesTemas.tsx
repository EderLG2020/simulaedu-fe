import type { CursoConTemas } from '../../api/cursosApi'

/** Selector agrupado curso -> temas, usado en el filtro y en el formulario. */
export default function OpcionesTemas({ cursos }: { cursos: CursoConTemas[] | null }) {
  return cursos?.map((c) => (
    <optgroup key={c.id} label={c.nombre}>
      {c.temas.map((t) => (
        <option key={t.id} value={t.id}>
          {t.nombre}
        </option>
      ))}
    </optgroup>
  ))
}
