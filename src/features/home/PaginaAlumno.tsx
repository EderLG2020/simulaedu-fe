import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn, Icon } from '../../components/ui'

export interface Miga {
  label: string
  /** Sin `to` es la pagina actual (ultima miga). */
  to?: string
}

interface Props {
  /** Miga de pan sobre el titulo (ej. Inicio > Historial). */
  migas?: Miga[]
  titulo?: string
  descripcion?: ReactNode
  /** Separacion entre bloques: normal (20px) o amplia (40px, paginas con secciones grandes). */
  espaciado?: 'normal' | 'amplio'
  className?: string
  children: ReactNode
}

/**
 * Contenido de una pagina del alumno (va dentro de AlumnoLayout): ancho, padding, separacion
 * uniforme entre bloques (gap, sin margenes propios en cada bloque) y entrada escalonada (ver
 * .entrada-escalonada en index.css). Si se pasan migas/titulo, arma el encabezado de la pagina.
 */
export default function PaginaAlumno({ migas, titulo, descripcion, espaciado = 'normal', className, children }: Props) {
  const conEncabezado = (migas && migas.length > 0) || titulo
  return (
    <main
      className={cn(
        'entrada-escalonada mx-auto flex w-full max-w-[1100px] flex-col px-4 py-6 sm:px-6 sm:py-8',
        espaciado === 'amplio' ? 'gap-10' : 'gap-5',
        className,
      )}
    >
      {conEncabezado && (
        <div>
          {migas && migas.length > 0 && (
            <nav aria-label="Ruta de navegación" className="mb-2 flex min-w-0 items-center gap-2 text-xs text-slate-500">
              {migas.map((m, i) => (
                <span key={`${m.label}-${i}`} className="flex min-w-0 items-center gap-2">
                  {i > 0 && (
                    <Icon name="chevron_right" size={14} className="text-slate-300" />
                  )}
                  {m.to ? (
                    <Link to={m.to} className="font-medium transition hover:text-primary-600">
                      {m.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="truncate font-semibold text-slate-900">
                      {m.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {titulo && <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{titulo}</h1>}
          {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
        </div>
      )}
      {children}
    </main>
  )
}

/** Boton principal de las paginas del alumno (naranja, alto): "Rendir un simulacro", etc. */
export const CLASE_CTA =
  'flex h-11 items-center gap-2 rounded-xl bg-accent-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-accent-600 active:scale-[0.97]'
