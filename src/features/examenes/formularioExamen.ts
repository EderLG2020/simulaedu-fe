import type { ExamenResumen, NavegacionExamen, TipoExamen, TipoSeleccion } from '../../api/examenesApi'

/** Formulario del paso "Datos basicos" del editor de examenes y su conversion desde/hacia el examen guardado. */

export const MAX_DESCRIPCION = 300

export const TIPOS_EXAMEN: { valor: TipoExamen; ayuda: string }[] = [
  { valor: 'PRACTICA_TEMA', ayuda: 'Para practicar un tema concreto.' },
  { valor: 'SIMULACRO_COMPLETO', ayuda: 'Mezcla todos los temas, como el examen real.' },
]

export interface FormularioBasico {
  universidadId: string
  nombre: string
  duracionMinutos: string
  puntajeTotal: string
  tipoSeleccion: TipoSeleccion
  navegacion: NavegacionExamen
  permitePausa: boolean
  tipo: TipoExamen
  descripcion: string
}

export const FORMULARIO_VACIO: FormularioBasico = {
  universidadId: '',
  nombre: '',
  duracionMinutos: '60',
  puntajeTotal: '100',
  tipoSeleccion: 'FIJA',
  navegacion: 'LIBRE',
  permitePausa: false,
  tipo: 'SIMULACRO_COMPLETO',
  descripcion: '',
}

export function formularioDesde(examen: ExamenResumen): FormularioBasico {
  return {
    universidadId: examen.universidadId,
    nombre: examen.nombre,
    duracionMinutos: String(Math.round(examen.duracionSeg / 60)),
    puntajeTotal: String(examen.puntajeTotal),
    tipoSeleccion: examen.tipoSeleccion,
    navegacion: examen.navegacion,
    permitePausa: examen.permitePausa,
    tipo: examen.tipo,
    descripcion: examen.descripcion ?? '',
  }
}

export function mismoFormulario(a: FormularioBasico, b: FormularioBasico): boolean {
  return (Object.keys(a) as (keyof FormularioBasico)[]).every((k) => a[k] === b[k])
}
