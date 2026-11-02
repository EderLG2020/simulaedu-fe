/**
 * Claves de TanStack Query, en un solo lugar: la pantalla que lee y la operacion que invalida
 * usan la misma. Invalidar un prefijo (ej. claves.examenes.todos) invalida todo lo que cuelga
 * de el. Van aparte de los modulos de api/ para que los tests puedan mockear esos modulos.
 */
export const claves = {
  universidades: ['universidades'] as const,
  cursos: ['cursos'] as const,
  perfil: ['perfil'] as const,
  noLeidas: ['notificaciones', 'no-leidas'] as const,
  notificaciones: (pagina: number) => ['notificaciones', 'lista', pagina] as const,
  examenes: {
    todos: ['examenes'] as const,
    publicados: ['examenes', 'publicados'] as const,
    deUniversidad: (universidadId: string) => ['examenes', 'universidad', universidadId] as const,
    deAutor: (autorId: string) => ['examenes', 'autor', autorId] as const,
    gestion: (universidadId: string | undefined) => ['examenes', 'gestion', universidadId ?? 'todas'] as const,
    estadisticas: (examenId: string) => ['examenes', 'estadisticas', examenId] as const,
  },
  historialTodo: ['historial'] as const,
  revisionSimulacro: (simulacroId: string) => ['simulacros', simulacroId, 'revision'] as const,
  historial: (pagina: number, limite: number) => ['historial', pagina, limite] as const,
  ranking: (ambito: string, periodo: string, referenciaId: string | null) => ['ranking', ambito, periodo, referenciaId] as const,
  preguntasTodo: ['preguntas'] as const,
  preguntas: (filtros: object) => ['preguntas', filtros] as const,
  moderacion: (filtros: object) => ['preguntas', 'moderacion', filtros] as const,
  usuarios: (filtros: object) => ['usuarios', filtros] as const,
  grupos: {
    todos: ['grupos'] as const,
    detalle: (grupoId: string) => ['grupos', grupoId] as const,
    alumnos: (grupoId: string) => ['grupos', grupoId, 'alumnos'] as const,
    asignaciones: (grupoId: string) => ['grupos', grupoId, 'asignaciones'] as const,
    estadisticas: (grupoId: string) => ['grupos', grupoId, 'estadisticas'] as const,
  },
  revisiones: ['revisiones'] as const,
  reporte: (reporteId: string) => ['reportes', reporteId] as const,
  coordinador: ['coordinador'] as const,
  admin: {
    cursos: ['admin', 'cursos'] as const,
    universidades: ['admin', 'universidades'] as const,
    planes: ['admin', 'planes'] as const,
    instituciones: ['admin', 'instituciones'] as const,
    reporteGlobal: (desde: string, hasta: string) => ['admin', 'reporte-global', desde, hasta] as const,
  },
}
