import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { obtenerReporte, solicitarReporte, type FormatoReporte, type SolicitarReporteInput } from '../../api/reportesApi'
import { Button, buttonClasses, Icon, Select } from '../../components/ui'

const INTERVALO_POLL_MS = 2000

export default function ReporteBoton({ base, etiqueta }: { base: Omit<SolicitarReporteInput, 'formato'>; etiqueta: string }) {
  const [formato, setFormato] = useState<FormatoReporte>('PDF')
  const [reporteId, setReporteId] = useState<string | null>(null)
  const [urlDescarga, setUrlDescarga] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)

  useEffect(() => {
    if (!reporteId) return
    let cancelado = false

    async function verificar() {
      try {
        const reporte = await obtenerReporte(reporteId!)
        if (cancelado) return
        if (reporte.estado === 'COMPLETADO') {
          setUrlDescarga(reporte.urlDescarga)
          setGenerando(false)
        } else if (reporte.estado === 'FALLIDO') {
          setError(reporte.error ?? 'La generacion del reporte fallo.')
          setGenerando(false)
        } else {
          setTimeout(verificar, INTERVALO_POLL_MS)
        }
      } catch {
        if (!cancelado) {
          setError('No se pudo consultar el estado del reporte.')
          setGenerando(false)
        }
      }
    }

    verificar()
    return () => {
      cancelado = true
    }
  }, [reporteId])

  async function generar() {
    setError(null)
    setUrlDescarga(null)
    setGenerando(true)
    try {
      const reporte = await solicitarReporte({ ...base, formato })
      setReporteId(reporte.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo generar el reporte.')
      setGenerando(false)
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Select
        aria-label="Formato del reporte"
        className="h-8 w-auto px-2 text-xs"
        value={formato}
        onChange={(evento) => setFormato(evento.target.value as FormatoReporte)}
        disabled={generando}
      >
        <option value="PDF">PDF</option>
        <option value="EXCEL">Excel</option>
      </Select>
      <Button variant="secondary" size="sm" icon="description" loading={generando} onClick={generar}>
        {generando ? 'Generando...' : etiqueta}
      </Button>
      {urlDescarga && (
        <a href={urlDescarga} target="_blank" rel="noreferrer" className={buttonClasses('ghost', 'sm', 'text-primary-600 hover:text-primary-700')}>
          <Icon name="download" size={16} />
          Descargar
        </a>
      )}
      {error && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
          <Icon name="error" size={16} />
          {error}
        </span>
      )}
    </span>
  )
}
