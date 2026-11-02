import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from './cn'

/** Estilo unico de todos los controles de formulario (input/select/textarea). */
const CONTROL =
  'w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 ' +
  'transition-colors focus:outline-none focus:border-primary-600 focus:ring-3 focus:ring-primary-600/15 ' +
  'disabled:bg-slate-50 disabled:text-slate-400'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'h-10 px-3', className)} {...rest} />
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, 'h-10 px-3', className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, 'p-3 resize-y', className)} {...rest} />
}

interface FieldProps {
  label: string
  required?: boolean
  hint?: string
  /** Mensaje de validacion; reemplaza al hint mientras exista. */
  error?: string | null
  className?: string
  children: ReactNode
}

/** Etiqueta + control + ayuda. Usa <label> envolvente, asi que el control queda asociado sin ids. */
export function Field({ label, required, hint, error, className, children }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      <Ayuda hint={hint} error={error} />
    </label>
  )
}

/** Igual que Field pero sin <label> envolvente, para grupos de botones/varios controles. */
export function FieldGroup({ label, required, hint, error, className, children }: FieldProps) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      <Ayuda hint={hint} error={error} />
    </div>
  )
}

function Ayuda({ hint, error }: { hint?: string; error?: string | null }) {
  if (error) {
    return (
      <span role="alert" className="text-xs font-medium text-rose-600">
        {error}
      </span>
    )
  }
  return hint ? <span className="text-xs text-slate-500">{hint}</span> : null
}
