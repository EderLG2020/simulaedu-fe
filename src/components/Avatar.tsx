import { cn } from './ui'

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase()
}

/** Foto de perfil del usuario, o sus iniciales si no tiene foto. */
export default function Avatar({ nombre, fotoUrl, className }: { nombre: string; fotoUrl?: string | null; className?: string }) {
  if (fotoUrl) {
    return <img src={fotoUrl} alt="" className={cn('shrink-0 rounded-full object-cover', className)} />
  }
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-primary-600 font-bold text-white', className)} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  )
}
