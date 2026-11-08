import { apiFetch, apiFetchArchivo, todasLasPaginas } from '../../../shared/api/client'

export interface InstitucionCoordinador {
  id: string
  nombre: string
  tipo: 'ACADEMIA' | 'COLEGIO'
  licenciasTotales: number
  licenciasUsadas: number
  licenciasDisponibles: number
  /** Codigo de 8 caracteres con el que alumnos y docentes se unen a la institucion. */
  codigoInvitacion: string
}

export interface AlumnoCoordinador {
  id: string
  nombre: string
  email: string
  licenciaAsignada: boolean
  /** Fecha ISO del ultimo simulacro finalizado; null si nunca rindio uno. */
  ultimaActividad: string | null
  /** Sin simulacros finalizados en los ultimos 7 dias (o nunca). */
  inactivo: boolean
  totalSimulacros: number
  puntajePromedio: number | null
}

export interface TemaDebil {
  temaId: string
  temaNombre: string
  /** Proporcion de aciertos, de 0 a 1. */
  tasaAcierto: number
  totalRespuestas: number
}

export interface PuntoSemanal {
  /** Lunes de la semana (YYYY-MM-DD). */
  semana: string
  simulacros: number
  puntajePromedio: number | null
}

export interface DashboardCoordinador {
  totalAlumnos: number
  alumnosConLicencia: number
  totalDocentes: number
  totalSecciones: number
  simulacrosUltimos7Dias: number
  simulacrosTotales: number
  puntajePromedio: number | null
  alumnosInactivos: number
  evolucionSemanal: PuntoSemanal[]
  temasDebiles: TemaDebil[]
  /** Hasta 5 alumnos inactivos. */
  inactivos: AlumnoCoordinador[]
}

interface SimulacroHistorial {
  simulacroId: string
  examenNombre: string
  puntajeTotal: number | null
  correctas: number
  incorrectas: number
  enBlanco: number
  fecha: string
}

export interface AlumnoDetalle {
  alumno: AlumnoCoordinador
  secciones: { id: string; nombre: string }[]
  temasDebiles: TemaDebil[]
  historial: SimulacroHistorial[]
}

export interface ResultadoLicenciasLote {
  asignadas: number
  yaTenian: number
  sinLicenciaDisponible: number
}

export interface ResultadoImportacion {
  creados: { nombre: string; email: string }[]
  yaRegistrados: string[]
  invalidas: { linea: number; motivo: string }[]
}

export interface DocenteCoordinador {
  id: string
  nombre: string
  email: string
  totalSecciones: number
}

export interface Seccion {
  id: string
  nombre: string
  docenteId: string
  docenteNombre: string
  totalAlumnos: number
  puntajePromedio: number | null
}

interface AlumnoDeSeccion {
  id: string
  nombre: string
  email: string
  totalSimulacros: number
  puntajePromedio: number | null
  inactivo: boolean
}

export interface SeccionDetalle {
  seccion: Seccion
  alumnos: AlumnoDeSeccion[]
}

export interface SeccionInput {
  nombre: string
  docenteId: string
}

export type FormatoReporte = 'PDF' | 'EXCEL'
export type PeriodoRanking = 'SEMANAL' | 'MENSUAL' | 'HISTORICO'

interface RankingEntrada {
  usuarioId: string
  nombre: string
  posicion: number
  puntajeReferencia: number
  esUsuarioActual: boolean
}

export interface RankingInstitucion {
  periodo: PeriodoRanking
  fechaPeriodo: string
  entradas: RankingEntrada[]
}

// --- Institucion y codigo de invitacion ---

export function obtenerInstitucion(): Promise<InstitucionCoordinador> {
  return apiFetch<InstitucionCoordinador>('/coordinador/institucion')
}

/** Invalida el codigo anterior: quien lo tenga ya no podra unirse con el. */
export function regenerarCodigoInvitacion(): Promise<InstitucionCoordinador> {
  return apiFetch<InstitucionCoordinador>('/coordinador/institucion/codigo', { method: 'POST' })
}

export function obtenerDashboard(): Promise<DashboardCoordinador> {
  return apiFetch<DashboardCoordinador>('/coordinador/dashboard')
}

// --- Alumnos y licencias ---

/** Todos los alumnos de la institucion (pagina a pagina): la pantalla filtra y selecciona en el navegador. */
export function listarAlumnos(): Promise<AlumnoCoordinador[]> {
  return todasLasPaginas<AlumnoCoordinador>('/coordinador/alumnos')
}

export function obtenerAlumno(alumnoId: string): Promise<AlumnoDetalle> {
  return apiFetch<AlumnoDetalle>(`/coordinador/alumnos/${alumnoId}`)
}

/** Lo saca de la institucion: revoca su licencia (si tenia) y lo quita de sus secciones. */
export function quitarAlumnoDeInstitucion(alumnoId: string): Promise<void> {
  return apiFetch<void>(`/coordinador/alumnos/${alumnoId}`, { method: 'DELETE' })
}

export function asignarLicencia(alumnoId: string): Promise<AlumnoCoordinador> {
  return apiFetch<AlumnoCoordinador>(`/coordinador/alumnos/${alumnoId}/licencia`, { method: 'POST' })
}

export function revocarLicencia(alumnoId: string): Promise<void> {
  return apiFetch<void>(`/coordinador/alumnos/${alumnoId}/licencia`, { method: 'DELETE' })
}

/** Asigna en orden hasta agotar las licencias disponibles. */
export function asignarLicenciasEnLote(alumnoIds: string[]): Promise<ResultadoLicenciasLote> {
  return apiFetch<ResultadoLicenciasLote>('/coordinador/licencias/lote', { method: 'POST', body: JSON.stringify({ alumnoIds }) })
}

/** CSV `nombre,email` (una fila por alumno). Las cuentas nuevas reciben un correo para elegir su contraseña. */
export function importarAlumnos(csv: string): Promise<ResultadoImportacion> {
  return apiFetch<ResultadoImportacion>('/coordinador/alumnos/importar', { method: 'POST', body: JSON.stringify({ csv }) })
}

// --- Docentes y secciones ---

export function listarDocentes(): Promise<DocenteCoordinador[]> {
  return apiFetch<DocenteCoordinador[]>('/coordinador/docentes')
}

export function listarSecciones(): Promise<Seccion[]> {
  return apiFetch<Seccion[]>('/coordinador/secciones')
}

export function crearSeccion(datos: SeccionInput): Promise<Seccion> {
  return apiFetch<Seccion>('/coordinador/secciones', { method: 'POST', body: JSON.stringify(datos) })
}

export function actualizarSeccion(seccionId: string, datos: SeccionInput): Promise<Seccion> {
  return apiFetch<Seccion>(`/coordinador/secciones/${seccionId}`, { method: 'PUT', body: JSON.stringify(datos) })
}

export function eliminarSeccion(seccionId: string): Promise<void> {
  return apiFetch<void>(`/coordinador/secciones/${seccionId}`, { method: 'DELETE' })
}

export function obtenerSeccion(seccionId: string): Promise<SeccionDetalle> {
  return apiFetch<SeccionDetalle>(`/coordinador/secciones/${seccionId}`)
}

export function agregarAlumnosASeccion(seccionId: string, alumnoIds: string[]): Promise<SeccionDetalle> {
  return apiFetch<SeccionDetalle>(`/coordinador/secciones/${seccionId}/alumnos`, { method: 'POST', body: JSON.stringify({ alumnoIds }) })
}

export function quitarAlumnoDeSeccion(seccionId: string, alumnoId: string): Promise<void> {
  return apiFetch<void>(`/coordinador/secciones/${seccionId}/alumnos/${alumnoId}`, { method: 'DELETE' })
}

// --- Ranking interno ---

/** Mismo endpoint que el ranking del alumno, en el ambito de la institucion. Se recalcula una vez al dia. */
export function obtenerRankingInstitucion(institucionId: string, periodo: PeriodoRanking): Promise<RankingInstitucion> {
  const query = new URLSearchParams({ ambito: 'INSTITUCION', referenciaId: institucionId, periodo })
  return apiFetch<RankingInstitucion>(`/ranking?${query.toString()}`)
}

// --- Reportes descargables (sincronos: el backend responde el archivo) ---

export function descargarReporteInstitucion(formato: FormatoReporte): Promise<Blob> {
  return apiFetchArchivo(`/coordinador/reportes/institucion?formato=${formato}`)
}

export function descargarReporteSeccion(seccionId: string, formato: FormatoReporte): Promise<Blob> {
  return apiFetchArchivo(`/coordinador/reportes/secciones/${seccionId}?formato=${formato}`)
}
