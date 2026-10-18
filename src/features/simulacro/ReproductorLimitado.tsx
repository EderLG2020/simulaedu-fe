import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui'

interface Props {
  src: string
  escuchasRestantes: number
  /** Registra la escucha en el servidor; devuelve si se puede reproducir. */
  onEscuchar: () => Promise<boolean>
}

type Estado = 'listo' | 'cargando' | 'sonando'

/**
 * Listening en simulacro completo: el audio se escucha completo, sin pausar ni adelantar, y solo las
 * veces que quedan. Primero carga el audio y recien entonces registra la escucha, para no gastarla
 * si el archivo no carga; desde que empieza a sonar, la escucha cuenta aunque el alumno recargue.
 */
export default function ReproductorLimitado({ src, escuchasRestantes, onEscuchar }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [estado, setEstado] = useState<Estado>('listo')
  const [errorCarga, setErrorCarga] = useState(false)

  // Al cambiar de pregunta (se desmonta) el audio deja de sonar.
  useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [])

  function cargar(audio: HTMLAudioElement): Promise<void> {
    if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return Promise.resolve()
    return new Promise((resolver, rechazar) => {
      const listo = () => {
        limpiar()
        resolver()
      }
      const fallo = () => {
        limpiar()
        rechazar(new Error('audio'))
      }
      const limpiar = () => {
        audio.removeEventListener('canplaythrough', listo)
        audio.removeEventListener('error', fallo)
      }
      audio.addEventListener('canplaythrough', listo)
      audio.addEventListener('error', fallo)
      audio.preload = 'auto'
      audio.load()
    })
  }

  async function escuchar() {
    const audio = audioRef.current
    if (!audio || estado !== 'listo' || escuchasRestantes <= 0) return
    setErrorCarga(false)
    setEstado('cargando')
    try {
      await cargar(audio)
    } catch {
      setErrorCarga(true)
      setEstado('listo')
      return
    }
    if (!(await onEscuchar())) {
      setEstado('listo')
      return
    }
    audio.currentTime = 0
    setEstado('sonando')
    try {
      await audio.play()
    } catch {
      setEstado('listo')
    }
  }

  const agotado = escuchasRestantes <= 0
  const texto =
    estado === 'cargando'
      ? 'Cargando audio...'
      : estado === 'sonando'
        ? 'Reproduciendo...'
        : agotado
          ? 'Ya escuchaste este audio 2 veces'
          : `Escuchar (${escuchasRestantes === 1 ? 'queda 1 vez' : `quedan ${escuchasRestantes} veces`})`

  return (
    <div className="flex flex-col gap-1.5">
      <audio ref={audioRef} src={src} preload="none" onEnded={() => setEstado('listo')} className="hidden" />
      <button
        type="button"
        onClick={escuchar}
        disabled={estado !== 'listo' || agotado}
        aria-live="polite"
        className="flex h-11 w-fit items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
      >
        <Icon
          name={estado === 'cargando' ? 'progress_activity' : estado === 'sonando' ? 'graphic_eq' : agotado ? 'headset_off' : 'headphones'}
          size={20}
          className={estado === 'cargando' ? 'animate-spin' : undefined}
        />
        {texto}
      </button>
      {errorCarga && <p className="text-xs text-rose-600">No se pudo cargar el audio. Revisa tu conexión; no se descontó la escucha.</p>}
    </div>
  )
}
