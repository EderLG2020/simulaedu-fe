import { useState } from 'react'
import { mensajeDeError } from '../../../shared/api/client'
import { importarAlumnos, type ResultadoImportacion } from '../api/coordinadorApi'
import { Alert, Button, buttonClasses, Field, Icon, Modal, Textarea } from '../../../shared/components/ui'
import { plural } from '../../../shared/lib/formato'

const EJEMPLO = 'nombre,email\nAna Torres,ana.torres@colegio.edu.pe\nLuis Quispe,luis.quispe@colegio.edu.pe'

/**
 * Alta masiva de alumnos desde un CSV `nombre,email` (pegado o subido). Las cuentas nuevas
 * reciben un correo para elegir su contraseña; los correos ya registrados no se tocan.
 */
export default function ImportarAlumnosModal({ onCerrar, onImportado }: { onCerrar: () => void; onImportado: () => void }) {
  const [csv, setCsv] = useState('')
  const [importando, setImportando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)

  async function leerArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    if (!archivo.name.toLowerCase().endsWith('.csv')) {
      setError('El archivo debe ser .csv.')
      return
    }
    setError(null)
    setCsv(await archivo.text())
  }

  async function importar() {
    setError(null)
    setImportando(true)
    try {
      const r = await importarAlumnos(csv)
      setResultado(r)
      if (r.creados.length > 0) onImportado()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo importar el archivo.'))
    } finally {
      setImportando(false)
    }
  }

  return (
    <Modal
      title="Importar alumnos"
      icon="upload_file"
      onClose={onCerrar}
      closeDisabled={importando}
      footer={
        resultado ? (
          <>
            <Button variant="secondary" onClick={() => { setResultado(null); setCsv('') }}>
              Importar otro
            </Button>
            <Button onClick={onCerrar}>Listo</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onCerrar} disabled={importando}>
              Cancelar
            </Button>
            <Button icon="upload_file" loading={importando} disabled={!csv.trim()} onClick={importar}>
              Importar
            </Button>
          </>
        )
      }
    >
      {error && <Alert>{error}</Alert>}

      {resultado ? (
        <div className="flex flex-col gap-4" aria-label="Resultado de la importación">
          <Alert tone={resultado.creados.length > 0 ? 'success' : 'info'}>
            {plural(resultado.creados.length, 'cuenta creada', 'cuentas creadas')}. Cada alumno recibió un correo para elegir su
            contraseña (el enlace vence en 7 días).
          </Alert>
          {resultado.creados.length > 0 && (
            <section>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Creados</h3>
              <ul className="list-disc pl-5 text-sm text-slate-700">
                {resultado.creados.map((c) => (
                  <li key={c.email}>
                    {c.nombre} · {c.email}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {resultado.yaRegistrados.length > 0 && (
            <section>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Ya registrados ({resultado.yaRegistrados.length})</h3>
              <p className="mb-1 text-xs text-slate-500">
                Estos correos ya tienen cuenta y no se modificaron: compárteles el código de invitación para que se unan.
              </p>
              <ul className="list-disc pl-5 text-sm text-slate-700">
                {resultado.yaRegistrados.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            </section>
          )}
          {resultado.invalidas.length > 0 && (
            <section>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Filas con errores ({resultado.invalidas.length})</h3>
              <ul className="list-disc pl-5 text-sm text-rose-700">
                {resultado.invalidas.map((f) => (
                  <li key={f.linea}>
                    Línea {f.linea}: {f.motivo}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-700">
            Una fila por alumno con las columnas <code className="rounded bg-slate-100 px-1">nombre,email</code>. Se crean cuentas de
            estudiante en tu institución (plan Free) y cada alumno recibe un correo para elegir su contraseña.
          </p>
          <Field label="Contenido del CSV" hint="Puedes pegarlo aquí o subir un archivo .csv.">
            <Textarea rows={8} value={csv} placeholder={EJEMPLO} onChange={(e) => setCsv(e.target.value)} className="font-mono text-xs" />
          </Field>
          <label className={buttonClasses('secondary', 'sm', 'self-start')}>
            <Icon name="upload_file" size={16} />
            Subir archivo .csv
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={leerArchivo} />
          </label>
        </>
      )}
    </Modal>
  )
}
