import { useRef, useState } from 'react'
import { mensajeDeError } from '../../api/client'
import { descargarPlantillaImportacion, importarPreguntasArchivo, type ResultadoImportacion } from '../../api/preguntasApi'
import { Alert, Button, Card, cn, Icon, Modal } from '../../components/ui'

/** RF-24: importacion masiva desde CSV (solo texto) o ZIP (CSV + imagenes). Ver data/demo/README.md del backend. */


const MAX_BYTES = 50 * 1024 * 1024
const EXTENSIONES = ['.csv', '.zip']

const COLUMNAS: { nombre: string; detalle: string }[] = [
  { nombre: 'curso, tema', detalle: 'Por nombre, tal como aparecen en el sistema (no importan tildes ni mayúsculas).' },
  { nombre: 'dificultad', detalle: 'baja, media o alta.' },
  { nombre: 'enunciado', detalle: 'Texto de la pregunta.' },
  { nombre: 'alt_a … alt_e', detalle: 'Mínimo 2 alternativas, sin dejar huecos.' },
  { nombre: 'correcta', detalle: 'Letra de la correcta (B), o varias con | en opción múltiple (A|C).' },
  { nombre: 'img_enunciado, img_a … img_e', detalle: 'Opcional: nombre del archivo de imagen dentro del ZIP.' },
  { nombre: 'audio_enunciado', detalle: 'Opcional: audio para listening (mp3, wav, ogg o m4a) dentro del ZIP.' },
  { nombre: 'codigo_enunciado', detalle: 'Opcional: código que se muestra como bloque (SQL, Java...), respetando saltos de línea.' },
  { nombre: 'tipo, tiempo_seg, universidades', detalle: 'Opcionales: opcion_unica/opcion_multiple, segundos, siglas (UNMSM|UNI).' },
]

function formatearTamano(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function validarArchivo(archivo: File): string | null {
  const nombre = archivo.name.toLowerCase()
  if (!EXTENSIONES.some((ext) => nombre.endsWith(ext))) return 'Solo se aceptan archivos .csv o .zip.'
  if (archivo.size > MAX_BYTES) return 'El archivo supera el máximo de 50 MB.'
  return null
}

interface Props {
  onCerrar: () => void
  /** Se llama al cerrar si se creó al menos una pregunta, para recargar el listado. */
  onImportado: () => void
}

export default function ImportarPreguntasModal({ onCerrar, onImportado }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [huboCreadas, setHuboCreadas] = useState(false)

  function elegir(nuevo: File | undefined) {
    if (!nuevo) return
    const problema = validarArchivo(nuevo)
    setError(problema)
    setArchivo(problema ? null : nuevo)
  }

  function cerrar() {
    if (importando) return
    if (huboCreadas) onImportado()
    onCerrar()
  }

  async function handleImportar() {
    if (!archivo) return
    setError(null)
    setImportando(true)
    try {
      const r = await importarPreguntasArchivo(archivo)
      setResultado(r)
      if (r.creadas > 0) setHuboCreadas(true)
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo importar el archivo.'))
    } finally {
      setImportando(false)
    }
  }

  async function handleDescargarPlantilla() {
    try {
      const blob = await descargarPlantillaImportacion()
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = 'plantilla_preguntas.csv'
      enlace.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo descargar la plantilla.')
    }
  }

  function reiniciar() {
    setArchivo(null)
    setResultado(null)
    setError(null)
  }

  return (
    <Modal
      title="Importar preguntas"
      icon="upload_file"
      onClose={cerrar}
      closeDisabled={importando}
      footer={
        resultado ? (
          <>
            <Button variant="ghost" onClick={cerrar}>
              Cerrar
            </Button>
            <Button onClick={reiniciar}>Importar otro archivo</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={cerrar} disabled={importando}>
              Cancelar
            </Button>
            <Button onClick={handleImportar} disabled={!archivo} loading={importando}>
              {importando ? 'Importando...' : 'Importar'}
            </Button>
          </>
        )
      }
    >
      {error && <Alert>{error}</Alert>}

      {resultado ? (
        <ResumenImportacion resultado={resultado} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Opcion icono="description" titulo="Solo texto → .csv" detalle='Una fila por pregunta. Desde Excel, guárdalo como "CSV UTF-8".' />
            <Opcion icono="folder_zip" titulo="Con imágenes → .zip" detalle="El CSV más las imágenes; en el CSV escribe solo el nombre del archivo (grafico.png)." />
          </div>

          <details className="group rounded-lg border border-slate-200">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900">
              Columnas del CSV
              <Icon name="expand_more" className="text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <dl className="flex flex-col gap-2 px-4 pb-4">
              {COLUMNAS.map((c) => (
                <div key={c.nombre} className="text-xs">
                  <dt className="inline font-mono font-semibold text-primary-600">{c.nombre}</dt>
                  <dd className="inline text-slate-500"> — {c.detalle}</dd>
                </div>
              ))}
            </dl>
          </details>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setArrastrando(true)
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault()
              setArrastrando(false)
              elegir(e.dataTransfer.files[0])
            }}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
              arrastrando ? 'border-primary-600 bg-primary-50' : 'border-slate-200 bg-slate-50/60',
            )}
          >
            <Icon name={archivo ? 'task' : 'cloud_upload'} size={32} className={archivo ? 'text-primary-600' : 'text-slate-400'} />
            {archivo ? (
              <p className="text-sm font-semibold text-slate-900">
                {archivo.name} <span className="font-normal text-slate-500">({formatearTamano(archivo.size)})</span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">Arrastra aquí tu archivo .csv o .zip</p>
            )}
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={importando}>
              {archivo ? 'Elegir otro archivo' : 'Seleccionar archivo'}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.zip"
              className="hidden"
              data-testid="input-archivo"
              onChange={(e) => {
                elegir(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <p className="text-xs text-slate-500">Máximo 50 MB y 1000 preguntas por archivo.</p>
          </div>

          <Button variant="ghost" size="sm" icon="download" className="self-start text-primary-600" onClick={handleDescargarPlantilla}>
            Descargar plantilla CSV
          </Button>
        </>
      )}
    </Modal>
  )
}

function Opcion({ icono, titulo, detalle }: { icono: string; titulo: string; detalle: string }) {
  return (
    <Card className="flex gap-3 p-4">
      <Icon name={icono} size={22} className="text-primary-600" />
      <div>
        <p className="text-sm font-semibold text-slate-900">{titulo}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detalle}</p>
      </div>
    </Card>
  )
}

function Metrica({ titulo, valor, tono = 'neutral', testId }: { titulo: string; valor: number; tono?: 'neutral' | 'success' | 'danger'; testId?: string }) {
  const color = { neutral: 'text-slate-900', success: 'text-emerald-700', danger: 'text-rose-700' }[tono]
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-slate-500">{titulo}</p>
      <p data-testid={testId} className={cn('mt-1 font-display text-2xl font-bold', color)}>
        {valor}
      </p>
    </Card>
  )
}

function ResumenImportacion({ resultado }: { resultado: ResultadoImportacion }) {
  const conErrores = resultado.errores.length
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Metrica titulo="Filas leídas" valor={resultado.totalFilas} />
        <Metrica titulo="Creadas" valor={resultado.creadas} tono="success" testId="total-creadas" />
        <Metrica titulo="Con errores" valor={conErrores} tono={conErrores > 0 ? 'danger' : 'neutral'} />
      </div>

      {resultado.creadas > 0 && (
        <Alert tone="info">
          Las preguntas importadas quedaron en <strong>Borrador</strong>: un administrador debe aprobarlas y publicarlas para que aparezcan en los exámenes.
        </Alert>
      )}

      {conErrores > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-700">Corrige estas filas en tu archivo y vuelve a importar solo esas (las demás ya se crearon):</p>
          <Card className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="w-16 px-4 py-2.5 font-semibold">Fila</th>
                  <th className="px-4 py-2.5 font-semibold">Problema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultado.errores.map((e) => (
                  <tr key={e.fila}>
                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">{e.fila}</td>
                    <td className="px-4 py-2.5 text-slate-700">{e.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}
