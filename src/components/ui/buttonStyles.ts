import { cn } from './cn'

export type Variante = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
export type Tamano = 'md' | 'sm' | 'icon'

const VARIANTES: Record<Variante, string> = {
  primary: 'bg-primary-600 text-white shadow-xs hover:bg-primary-700',
  /** Llamadas a la accion destacadas (publicar, registrarse): naranja de marca. */
  accent: 'bg-accent-500 text-white shadow-xs hover:bg-accent-600',
  secondary: 'bg-white text-slate-900 border border-slate-200 shadow-xs hover:bg-slate-50',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
  danger: 'text-slate-500 hover:bg-rose-50 hover:text-rose-600',
}

const TAMANOS: Record<Tamano, string> = {
  md: 'h-10 px-4 gap-2 text-sm',
  sm: 'h-8 px-3 gap-1.5 text-xs',
  icon: 'h-8 w-8',
}

/** Clases de boton para elementos que no son <button> (ej. <label> de un input file). */
export function buttonClasses(variant: Variante = 'primary', size: Tamano = 'md', className?: string): string {
  return cn(
    'inline-flex items-center justify-center rounded-lg font-semibold transition-colors cursor-pointer',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
    'disabled:opacity-50 disabled:pointer-events-none',
    VARIANTES[variant],
    TAMANOS[size],
    className,
  )
}
