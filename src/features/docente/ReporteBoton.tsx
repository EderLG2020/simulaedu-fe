import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { claves } from '../../api/claves'
import { mensajeDeError } from '../../api/client'
import { obtenerReporte, solicitarReporte, type FormatoReporte, type SolicitarReporteInput } from '../../api/reportesApi'
import { Button, buttonClasses, Icon, Select } from '../../components/ui'

const INTERVALO_POLL_MS = 2000

export default function ReporteBoton({ base, etiqueta }: { base: Omit<SolicitarReporteInput, 'formato'>; etiqueta: string }) {
  const [formato, setFormato] = useState<FormatoReporte>('PDF')
  const [reporteId, setReporteId] = useState<string | null>(null)
  const [solicitando, setSolicitando] = useState(false)
  const [errorSolicitud, setErrorSolicitud] = useState<string | null>(null)

  // El backend genera el archivo en segundo plano: se consulta su estado cada 2 s hasta que termina.
  const consulta = useQuery({
    queryKey: claves.reporte(reporteId ?? ''),
    queryFn: () => obtenerReporte(reporteId!),
    enabled: reporteId !== null,
    refetchInterval: (q) => (q.state.data?.estado === 'COMPLETADO' || q.state.data?.estado === 'FALLIDO' ? false : INTERVALO_POLL_MS),
  })
  const reporte = consulta.data
  const urlDescarga = reporte?.estado === 'COMPLETADO' ? reporte.urlDescarga : null
  const error =
    errorSolicitud ??
    (consulta.isError
      ? 'No se pudo consultar el estado del reporte.'
      : reporte?.estado === 'FALLIDO'
        ? (reporte.error ?? 'La generacion del reporte fallo.')
        : null)
  const generando = solicitando || (reporteId !== null && !consulta.isError && reporte?.estado !== 'COMPLETADO' && reporte?.estado !== 'FALLIDO')

  async function generar() {
    setErrorSolicitud(null)
    setReporteId(null)
    setSolicitando(true)
    try {
      const nuevo = await solicitarReporte({ ...base, formato })
      setReporteId(nuevo.id)
    } catch (err) {
      setErrorSolicitud(mensajeDeError(err, 'No se pudo generar el reporte.'))
    } finally {
      setSolicitando(false)
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
