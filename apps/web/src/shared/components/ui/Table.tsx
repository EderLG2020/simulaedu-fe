import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'

/** Tabla base: scroll horizontal, filas separadas por linea y hover suave. Va dentro de una Card. */
export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          'w-full border-collapse text-left text-sm',
          '[&_tbody_tr]:border-t [&_tbody_tr]:border-slate-100 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-slate-50/60',
          className,
        )}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">{children}</tr>
    </thead>
  )
}

export function Th({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 font-semibold whitespace-nowrap', className)} {...rest} />
}

export function Td({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-top', className)} {...rest} />
}

/** Estado vacio o de carga para listados (dentro de una Card). */
export function EmptyState({ icon = 'inbox', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <Icon name={icon} size={32} className="text-slate-300" />
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {children && <div className="text-sm text-slate-500">{children}</div>}
    </div>
  )
}
