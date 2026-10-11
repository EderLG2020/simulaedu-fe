import { Icon } from './ui'
import { useConexionStore } from '../stores/conexionStore'

/** Aviso fijo arriba de la pantalla cuando no hay internet o la conexion esta lenta. La sesion se conserva. */
export default function BannerConexion() {
  const sinConexion = useConexionStore((s) => s.sinConexion)
  const lenta = useConexionStore((s) => s.peticionesLentas > 0)
  if (!sinConexion && !lenta) return null

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <div
        className={
          'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ' +
          (sinConexion ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-900')
        }
      >
        <Icon name={sinConexion ? 'wifi_off' : 'network_check'} size={18} />
        {sinConexion
          ? 'Sin conexión a internet. Tu sesión sigue activa; reintentaremos al volver la conexión.'
          : 'La conexión está lenta. Seguimos esperando la respuesta…'}
      </div>
    </div>
  )
}
