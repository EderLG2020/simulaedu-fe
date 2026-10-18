import type { ReactNode } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'

type Tono = 'danger' | 'warning' | 'info' | 'success'

const TONOS: Record<Tono, { clase: string; icono: string }> = {
  danger: { clase: 'bg-rose-50 border-rose-200 text-rose-800', icono: 'error' },
  warning: { clase: 'bg-amber-50 border-amber-200 text-amber-800', icono: 'warning' },
  info: { clase: 'bg-primary-50 border-primary-200 text-primary-800', icono: 'info' },
  success: { clase: 'bg-emerald-50 border-emerald-200 text-emerald-800', icono: 'check_circle' },
}

export function Alert({ tone = 'danger', className, children }: { tone?: Tono; className?: string; children: ReactNode }) {
  const { clase, icono } = TONOS[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm', clase, className)}>
      <Icon name={icono} size={18} className="mt-px" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
