import { useState, type FormEvent } from 'react'
import { mensajeDeError } from '../../../shared/api/client'
import type { DocenteCoordinador, SeccionInput } from '../api/coordinadorApi'
import { Alert, Button, Field, Input, Modal, Select } from '../../../shared/components/ui'

interface Props {
  titulo: string
  inicial?: SeccionInput
  docentes: DocenteCoordinador[]
  onGuardar: (datos: SeccionInput) => Promise<void>
  onCerrar: () => void
}

/** Crear o editar una sección: nombre y docente a cargo (un docente de la institución). */
export default function SeccionFormModal({ titulo, inicial, docentes, onGuardar, onCerrar }: Props) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [docenteId, setDocenteId] = useState(inicial?.docenteId ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (!nombre.trim() || !docenteId) return
    setError(null)
    setGuardando(true)
    try {
      await onGuardar({ nombre: nombre.trim(), docenteId })
      onCerrar()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar la sección.'))
      setGuardando(false)
    }
  }

  return (
    <Modal title={titulo} icon="groups" size="md" onClose={onCerrar} closeDisabled={guardando}>
      <form onSubmit={guardar} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        {docentes.length === 0 && (
          <Alert tone="warning">
            Tu institución aún no tiene docentes. Comparte el código de invitación para que se unan y luego crea la sección.
          </Alert>
        )}
        <Field label="Nombre" required hint='Por ejemplo, "5.° A".'>
          <Input value={nombre} maxLength={100} onChange={(e) => setNombre(e.target.value)} required autoFocus />
        </Field>
        <Field label="Docente a cargo" required>
          <Select value={docenteId} onChange={(e) => setDocenteId(e.target.value)} required>
            <option value="">Elige un docente</option>
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.email})
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardando} disabled={!nombre.trim() || !docenteId}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
