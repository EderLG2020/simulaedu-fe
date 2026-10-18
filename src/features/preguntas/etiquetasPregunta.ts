import type { Dificultad, EstadoPregunta, TipoPregunta } from '../../api/preguntasApi'
import type { TonoBadge } from '../../components/ui'

/** Icono, texto y color de cada tipo, dificultad y estado de pregunta (tabla, filtros y formulario). */

export const TIPO_INFO: Record<TipoPregunta, { icono: string; label: string }> = {
  OPCION_UNICA: { icono: 'radio_button_checked', label: 'Opción única' },
  OPCION_MULTIPLE: { icono: 'check_box', label: 'Opción múltiple' },
  EMPAREJAMIENTO: { icono: 'join_inner', label: 'Emparejamiento' },
  DESARROLLO: { icono: 'article', label: 'Desarrollo' },
  NUMERICA: { icono: 'pin', label: 'Numérica' },
}

export const DIFICULTAD_INFO: Record<Dificultad, { punto: string; label: string }> = {
  BAJA: { punto: 'bg-emerald-500', label: 'Baja' },
  MEDIA: { punto: 'bg-amber-500', label: 'Media' },
  ALTA: { punto: 'bg-rose-500', label: 'Alta' },
}

export const ESTADO_INFO: Record<EstadoPregunta, { tono: TonoBadge; label: string }> = {
  BORRADOR: { tono: 'neutral', label: 'Borrador' },
  APROBADA: { tono: 'info', label: 'Aprobada' },
  PUBLICADA: { tono: 'success', label: 'Publicada' },
}

export const OPCIONES_TIPO = (Object.keys(TIPO_INFO) as TipoPregunta[]).map((t) => ({ value: t, label: TIPO_INFO[t].label, icon: TIPO_INFO[t].icono }))
export const OPCIONES_DIFICULTAD = (Object.keys(DIFICULTAD_INFO) as Dificultad[]).map((d) => ({ value: d, label: DIFICULTAD_INFO[d].label }))

export const letra = (i: number) => String.fromCharCode(65 + i)
