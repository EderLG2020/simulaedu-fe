import { useState } from 'react'
import { mensajeDeError } from '../../../shared/api/client'
import { Button, Card, Icon } from '../../../shared/components/ui'
import ConfirmarModal from './ConfirmarModal'

interface Props {
  codigo: string
  onRegenerar: () => Promise<void>
}

/** Código de invitación de la institución: copiarlo para compartirlo o regenerarlo (invalida el anterior). */
export default function TarjetaCodigoInvitacion({ codigo, onRegenerar }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function copiar() {
    setError(null)
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo copiar. Selecciona el código y cópialo a mano.'))
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon name="key" size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">Código de invitación</p>
          <p className="font-display text-2xl font-bold tracking-[0.2em] text-slate-900 select-all" aria-label="Código de invitación">
            {codigo}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Alumnos y docentes con cuenta lo ingresan en Configuración › Institución para unirse.
          </p>
          {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button variant="secondary" size="sm" icon={copiado ? 'check' : 'content_copy'} onClick={copiar}>
          {copiado ? 'Copiado' : 'Copiar'}
        </Button>
        <Button variant="ghost" size="sm" icon="autorenew" onClick={() => setConfirmando(true)}>
          Regenerar
        </Button>
      </div>

      {confirmando && (
        <ConfirmarModal
          titulo="Regenerar código de invitación"
          etiquetaConfirmar="Regenerar código"
          onConfirmar={onRegenerar}
          onCerrar={() => setConfirmando(false)}
        >
          El código <strong>{codigo}</strong> dejará de funcionar. Quienes ya se unieron siguen en la institución; los demás
          necesitarán el código nuevo.
        </ConfirmarModal>
      )}
    </Card>
  )
}
