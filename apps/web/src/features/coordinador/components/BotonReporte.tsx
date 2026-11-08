import { useState } from 'react'
import { mensajeDeError } from '../../../shared/api/client'
import type { FormatoReporte } from '../api/coordinadorApi'
import { Button, Icon, Select } from '../../../shared/components/ui'
import { guardarArchivo, nombreArchivoReporte } from '../lib/formato'

interface Props {
  /** Pide el archivo al backend (GET autenticado). */
  descargar: (formato: FormatoReporte) => Promise<Blob>
  /** Base del nombre del archivo (ej. nombre de la sección). */
  nombreBase: string
  etiqueta?: string
}

/** Elegir PDF o Excel y descargar al instante: el backend genera el reporte en la misma petición. */
export default function BotonReporte({ descargar, nombreBase, etiqueta = 'Descargar' }: Props) {
  const [formato, setFormato] = useState<FormatoReporte>('PDF')
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function manejarDescarga() {
    setError(null)
    setDescargando(true)
    try {
      guardarArchivo(await descargar(formato), nombreArchivoReporte(nombreBase, formato))
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo descargar el reporte.'))
    } finally {
      setDescargando(false)
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Select
        aria-label={`Formato del reporte de ${nombreBase}`}
        className="h-8 w-auto px-2 text-xs"
        value={formato}
        onChange={(evento) => setFormato(evento.target.value as FormatoReporte)}
        disabled={descargando}
      >
        <option value="PDF">PDF</option>
        <option value="EXCEL">Excel</option>
      </Select>
      <Button variant="secondary" size="sm" icon="download" loading={descargando} onClick={manejarDescarga}>
        {descargando ? 'Generando...' : etiqueta}
      </Button>
      {error && (
        <span role="alert" className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
          <Icon name="error" size={16} />
          {error}
        </span>
      )}
    </span>
  )
}
