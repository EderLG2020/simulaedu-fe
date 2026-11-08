import { useState, type ReactNode } from 'react'
import { mensajeDeError } from '../../../shared/api/client'
import { Alert, Button, Modal } from '../../../shared/components/ui'

interface Props {
  titulo: string
  children: ReactNode
  etiquetaConfirmar: string
  /** Accion a confirmar; si falla, el error se muestra dentro del modal y este sigue abierto. */
  onConfirmar: () => Promise<void>
  onCerrar: () => void
}

/** Confirmacion de una accion destructiva (quitar alumno, eliminar seccion) con modal propio. */
export default function ConfirmarModal({ titulo, children, etiquetaConfirmar, onConfirmar, onCerrar }: Props) {
  const [enProceso, setEnProceso] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar() {
    setError(null)
    setEnProceso(true)
    try {
      await onConfirmar()
      onCerrar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo completar la acción.'))
      setEnProceso(false)
    }
  }

  return (
    <Modal
      title={titulo}
      icon="warning"
      size="md"
      onClose={onCerrar}
      closeDisabled={enProceso}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar} disabled={enProceso}>
            Cancelar
          </Button>
          <Button className="bg-rose-600 text-white hover:bg-rose-700 hover:text-white" loading={enProceso} onClick={confirmar}>
            {etiquetaConfirmar}
          </Button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <div className="text-sm text-slate-700">{children}</div>
    </Modal>
  )
}
