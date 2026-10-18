import type { ReactNode } from 'react'
import type { Dificultad } from '../../api/preguntasApi'
import InfoTooltip from '../../components/InfoTooltip'
import { Button, Card, cn, Icon } from '../../components/ui'

/** Piezas visuales chicas compartidas por los pasos del editor de examenes. */

const DIFICULTAD_INFO: Record<Dificultad, { punto: string; label: string }> = {
  BAJA: { punto: 'bg-emerald-500', label: 'Baja' },
  MEDIA: { punto: 'bg-amber-500', label: 'Media' },
  ALTA: { punto: 'bg-rose-500', label: 'Alta' },
}

/** Punto de color + texto de la dificultad de una pregunta. */
export function EtiquetaDificultad({ dificultad }: { dificultad: Dificultad }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-600">
      <span className={cn('h-2 w-2 rounded-full', DIFICULTAD_INFO[dificultad].punto)} />
      {DIFICULTAD_INFO[dificultad].label}
    </span>
  )
}

/** Etiqueta con InfoTooltip, solo para los 2 conceptos que no se entienden con un texto corto. */
export function EtiquetaConInfo({ texto, info }: { texto: string; info: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
      {texto}
      <InfoTooltip etiqueta={texto} alineacion="start">
        {info}
      </InfoTooltip>
    </span>
  )
}

/** Tarjeta con titulo, descripcion y acciones opcionales: cada bloque de un paso del editor. */
export function SeccionCard({ titulo, descripcion, acciones, children, className }: { titulo: string; descripcion?: string; acciones?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-slate-900">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>}
        </div>
        {acciones}
      </div>
      {children}
    </Card>
  )
}

/** Barra de puntaje asignado vs. total: para publicar, la suma debe ser exacta. */
export function ResumenPuntaje({ asignado, total, puedeRepartir, onRepartir }: { asignado: number; total: number; puedeRepartir: boolean; onRepartir: () => void }) {
  const diferencia = total - asignado
  const cuadra = diferencia === 0
  const porcentaje = total > 0 ? Math.min(100, (asignado / total) * 100) : 0
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-700">
          <span className="font-display text-xl font-bold text-slate-900">{asignado}</span> / {total} pts
        </span>
        <span className={cn('text-xs font-semibold', cuadra ? 'text-emerald-600' : diferencia > 0 ? 'text-amber-600' : 'text-rose-600')}>
          {cuadra ? 'Cuadra con el total' : diferencia > 0 ? `Faltan ${diferencia} pts` : `Sobran ${-diferencia} pts`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full transition-all', cuadra ? 'bg-emerald-500' : diferencia < 0 ? 'bg-rose-500' : 'bg-amber-500')}
          style={{ width: `${diferencia < 0 ? 100 : porcentaje}%` }}
        />
      </div>
      {puedeRepartir && !cuadra && (
        <Button variant="secondary" size="sm" icon="balance" className="self-start" onClick={onRepartir}>
          Repartir {total} pts en partes iguales
        </Button>
      )}
    </div>
  )
}

/** Item de la checklist previa a publicar. */
export function Requisito({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={cn('flex items-center gap-2 text-sm', ok ? 'text-emerald-700' : 'text-slate-500')}>
      <Icon name={ok ? 'check_circle' : 'radio_button_unchecked'} size={18} />
      {children}
    </li>
  )
}

/** Par etiqueta/valor del resumen final. */
export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-slate-500">{etiqueta}</dt>
      <dd className="text-sm font-semibold text-slate-900">{children}</dd>
    </div>
  )
}
