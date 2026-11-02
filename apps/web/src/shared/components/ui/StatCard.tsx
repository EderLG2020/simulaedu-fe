import type { ReactNode } from 'react'
import { Card } from './Card'
import { cn } from './cn'
import { Icon } from './Icon'

type Tono = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

const TONOS: Record<Tono, string> = {
  primary: 'bg-primary-50 text-primary-600',
  neutral: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-rose-50 text-rose-600',
  info: 'bg-sky-50 text-sky-600',
  accent: 'bg-accent-50 text-accent-600',
}

interface Props {
  label: string
  value: ReactNode
  icon?: string
  tone?: Tono
  /** Linea secundaria bajo el valor (ej. "62% ocupacion"). */
  hint?: ReactNode
  className?: string
}

/** Tarjeta de metrica (KPI): etiqueta, valor grande, icono opcional y una linea de contexto. */
export function StatCard({ label, value, icon, tone = 'primary', hint, className }: Props) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        {icon && (
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', TONOS[tone])}>
            <Icon name={icon} size={20} />
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </Card>
  )
}
