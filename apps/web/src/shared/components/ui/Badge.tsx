import type { ReactNode } from 'react'
import { cn } from './cn'

export type TonoBadge = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const TONOS: Record<TonoBadge, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
}

export function Badge({ tone = 'neutral', className, children }: { tone?: TonoBadge; className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap', TONOS[tone], className)}>{children}</span>
}
