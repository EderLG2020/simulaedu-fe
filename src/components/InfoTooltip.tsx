import { useId, useState, type ReactNode } from 'react'
import { Icon } from './ui'

interface InfoTooltipProps {
  /** Nombre del campo que explica - se usa en el aria-label ("Más información: ..."). */
  etiqueta: string
  children: ReactNode
  /** Lado hacia el que se abre la burbuja; `end` evita que se corte en el borde derecho de un panel. */
  alineacion?: 'start' | 'center' | 'end'
}

const POSICION = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
}

/** Icono "i" con explicacion contextual. Abre con hover, foco de teclado o toque; cierra con Escape. */
export default function InfoTooltip({ etiqueta, children, alineacion = 'center' }: InfoTooltipProps) {
  const [abierto, setAbierto] = useState(false)
  const id = useId()

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`Más información: ${etiqueta}`}
        aria-describedby={abierto ? id : undefined}
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setAbierto(false)
        }}
        onClick={(e) => {
          // Dentro de un <label> evita que el clic active el input asociado.
          e.preventDefault()
          setAbierto((v) => !v)
        }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-primary-600 focus-visible:text-primary-600 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-1 transition-colors"
      >
        <Icon name="info" size={16} className="leading-none" />
      </button>
      {abierto && (
        <span
          id={id}
          role="tooltip"
          className={`absolute top-full mt-1.5 z-30 w-64 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-normal normal-case tracking-normal leading-relaxed shadow-lg text-left ${POSICION[alineacion]}`}
        >
          {children}
        </span>
      )}
    </span>
  )
}
