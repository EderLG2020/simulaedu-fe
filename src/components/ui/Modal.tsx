import { useEffect, useId, type ReactNode } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'

interface Props {
  title: string
  icon?: string
  onClose: () => void
  /** Bloquea el cierre (Esc, fondo, X) mientras hay una operacion en curso. */
  closeDisabled?: boolean
  footer?: ReactNode
  size?: 'md' | 'lg'
  children: ReactNode
}

export function Modal({ title, icon, onClose, closeDisabled = false, footer, size = 'lg', children }: Props) {
  const tituloId = useId()

  useEffect(() => {
    function alPresionar(e: KeyboardEvent) {
      if (e.key === 'Escape' && !closeDisabled) onClose()
    }
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [onClose, closeDisabled])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-[2px] md:p-10"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !closeDisabled) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className={cn('flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl', size === 'lg' ? 'max-w-3xl' : 'max-w-lg')}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon name={icon} size={20} />
              </span>
            )}
            <h2 id={tituloId} className="font-display text-lg font-bold text-slate-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-6 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}
