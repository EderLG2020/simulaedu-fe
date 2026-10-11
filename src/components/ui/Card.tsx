import type { HTMLAttributes } from 'react'
import { cn } from './cn'

/** Superficie blanca con borde: contenedor base de filtros, tablas y paneles. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-slate-200 bg-white', className)} {...rest} />
}
