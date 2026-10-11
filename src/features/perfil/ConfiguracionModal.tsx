import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { actualizarPerfil, cambiarPassword, subirFotoPerfil } from '../../api/usuariosApi'
import Avatar from '../../components/Avatar'
import { Alert, Button, cn, Field, Icon, Input, Modal } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

/** Configuracion de la cuenta (cualquier rol): se abre desde el menu del usuario. */

type Seccion = 'PERFIL' | 'SEGURIDAD'

const SECCIONES: { valor: Seccion; label: string; icono: string; descripcion: string }[] = [
  { valor: 'PERFIL', label: 'Perfil', icono: 'person', descripcion: 'Nombre y foto' },
  { valor: 'SEGURIDAD', label: 'Seguridad', icono: 'lock', descripcion: 'Contraseña' },
]

const TIPOS_FOTO = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES_FOTO = 3 * 1024 * 1024

function mensajeError(err: unknown, porDefecto: string): string {
  return err instanceof ApiError || err instanceof Error ? err.message : porDefecto
}

function SeccionPerfil() {
  const { usuario, actualizarUsuario } = useAuth()
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  /** URL guardada; null si el usuario pidio quitarla (se aplica al guardar). */
  const [fotoGuardada, setFotoGuardada] = useState<string | null>(usuario?.fotoUrl ?? null)
  /** Foto elegida pero aun no subida: solo se sube al pulsar "Guardar cambios". */
  const [archivo, setArchivo] = useState<File | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // La URL local de la vista previa se libera al cambiarla o al cerrar el modal.
  useEffect(() => () => {
    if (vistaPrevia) URL.revokeObjectURL(vistaPrevia)
  }, [vistaPrevia])

  if (!usuario) return null

  function elegirFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0]
    evento.target.value = ''
    if (!elegido) return
    setExito(null)
    if (!TIPOS_FOTO.includes(elegido.type)) {
      setError('La foto debe ser PNG, JPG o WEBP.')
      return
    }
    if (elegido.size > MAX_BYTES_FOTO) {
      setError('La foto no puede pesar más de 3 MB.')
      return
    }
    setError(null)
    setArchivo(elegido)
    setVistaPrevia(URL.createObjectURL(elegido))
  }

  function descartarFoto() {
    setArchivo(null)
    setVistaPrevia(null)
  }

  const cambios = nombre.trim() !== usuario.nombre || archivo !== null || fotoGuardada !== (usuario.fotoUrl ?? null)

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setExito(null)
    setGuardando(true)
    try {
      const fotoUrl = archivo ? await subirFotoPerfil(archivo) : fotoGuardada
      const actualizado = await actualizarPerfil({ nombre: nombre.trim(), fotoUrl })
      actualizarUsuario({ ...usuario, ...actualizado })
      setFotoGuardada(actualizado.fotoUrl ?? null)
      descartarFoto()
      setExito('Perfil actualizado.')
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar el perfil.'))
    } finally {
      setGuardando(false)
    }
  }

  const fotoMostrada = vistaPrevia ?? fotoGuardada

  return (
    <form onSubmit={guardar} className="flex flex-col gap-5">
      {error && <Alert>{error}</Alert>}
      {exito && <Alert tone="success">{exito}</Alert>}

      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:flex-row">
        <div className="relative">
          <Avatar nombre={nombre || usuario.nombre} fotoUrl={fotoMostrada} className={cn('h-24 w-24 text-2xl', vistaPrevia && 'ring-4 ring-amber-300')} />
        </div>
        <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
          {vistaPrevia ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Icon name="image" size={14} />
                Vista previa: aún no se guardó
              </span>
              <p className="text-xs text-slate-500">Se subirá cuando pulses "Guardar cambios".</p>
              <Button variant="ghost" size="sm" icon="close" onClick={descartarFoto} disabled={guardando}>
                Descartar
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-800">Foto de perfil</p>
              <p className="text-xs text-slate-500">PNG, JPG o WEBP, hasta 3 MB.</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon="image" onClick={() => inputRef.current?.click()} disabled={guardando}>
                  {fotoGuardada ? 'Cambiar foto' : 'Elegir foto'}
                </Button>
                {fotoGuardada && (
                  <Button variant="danger" size="sm" icon="delete" onClick={() => setFotoGuardada(null)} disabled={guardando}>
                    Quitar
                  </Button>
                )}
              </div>
            </>
          )}
          <input ref={inputRef} type="file" accept={TIPOS_FOTO.join(',')} className="sr-only" onChange={elegirFoto} tabIndex={-1} />
        </div>
      </div>

      <Field label="Nombre completo">
        <Input value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} required />
      </Field>
      <Field label="Correo electrónico" hint="El correo no se puede cambiar.">
        <Input value={usuario.email} disabled />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" loading={guardando} disabled={!cambios || !nombre.trim()}>
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}

function SeccionSeguridad() {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setExito(null)
    if (nueva.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.')
    if (nueva !== confirmacion) return setError('La confirmación no coincide con la nueva contraseña.')
    setGuardando(true)
    try {
      await cambiarPassword(actual, nueva)
      setActual('')
      setNueva('')
      setConfirmacion('')
      setExito('Contraseña actualizada.')
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cambiar la contraseña.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      {exito && <Alert tone="success">{exito}</Alert>}
      <Field label="Contraseña actual">
        <Input type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
      </Field>
      <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
        <Input type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
      </Field>
      <Field label="Confirma la nueva contraseña">
        <Input type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required />
      </Field>
      <p className="text-xs text-slate-500">¿Entras con Google y no tienes contraseña? Usa "¿Olvidaste tu contraseña?" en el inicio de sesión para crear una.</p>
      <div className="flex justify-end">
        <Button type="submit" loading={guardando}>
          Cambiar contraseña
        </Button>
      </div>
    </form>
  )
}

export default function ConfiguracionModal({ onCerrar }: { onCerrar: () => void }) {
  const [seccion, setSeccion] = useState<Seccion>('PERFIL')

  return (
    <Modal title="Configuración" icon="tune" onClose={onCerrar}>
      <div className="flex flex-col gap-5 sm:flex-row">
        <nav className="flex shrink-0 gap-1 sm:w-48 sm:flex-col" aria-label="Secciones de configuración">
          {SECCIONES.map((s) => {
            const activa = s.valor === seccion
            return (
              <button
                key={s.valor}
                type="button"
                aria-current={activa ? 'page' : undefined}
                onClick={() => setSeccion(s.valor)}
                className={cn(
                  'flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors sm:flex-none',
                  'focus-visible:outline-2 focus-visible:outline-primary-600',
                  activa ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                <Icon name={s.icono} size={20} />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className="hidden text-xs text-slate-500 sm:block">{s.descripcion}</span>
                </span>
              </button>
            )
          })}
        </nav>
        <div className="min-w-0 flex-1">{seccion === 'PERFIL' ? <SeccionPerfil /> : <SeccionSeguridad />}</div>
      </div>
    </Modal>
  )
}
