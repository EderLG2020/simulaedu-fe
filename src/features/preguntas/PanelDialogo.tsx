import { useState } from 'react'
import { mensajeDeError } from '../../api/client'
import { generarAudioDialogo, type Acento, type GuionAudio, type Hablante, type LineaDialogo, type Velocidad } from '../../api/preguntasApi'
import { Alert, Button, FieldGroup, Input, SegmentedControl, Select } from '../../components/ui'
import { MAX_CARACTERES_DIALOGO, MAX_CARACTERES_LINEA, MAX_LINEAS, problemaDelDialogo } from './dialogo'

const OPCIONES_ACENTO: { value: Acento; label: string }[] = [
  { value: 'en-US', label: 'Americano' },
  { value: 'en-GB', label: 'Británico' },
]

const OPCIONES_VELOCIDAD: { value: Velocidad; label: string }[] = [
  { value: 'lenta', label: 'Lenta' },
  { value: 'normal', label: 'Normal' },
]

const LINEAS_INICIALES: LineaDialogo[] = [
  { hablante: 'A', texto: '' },
  { hablante: 'B', texto: '' },
]

interface Props {
  guionInicial: GuionAudio | null
  onInsertar: (guion: GuionAudio & { audioUrl: string }) => void
  onCerrar: () => void
}

/**
 * Listening: el docente escribe un dialogo entre dos personas, elige acento y velocidad, genera el
 * audio (Azure, en el backend), lo escucha y lo inserta en el enunciado. Cambiar algo despues de
 * generar descarta ese audio, para que lo insertado siempre coincida con el guion guardado.
 */
export default function PanelDialogo({ guionInicial, onInsertar, onCerrar }: Props) {
  const [lineas, setLineas] = useState<LineaDialogo[]>(guionInicial?.lineas ?? LINEAS_INICIALES)
  const [acento, setAcento] = useState<Acento>(guionInicial?.acento ?? 'en-US')
  const [velocidad, setVelocidad] = useState<Velocidad>(guionInicial?.velocidad ?? 'normal')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const problema = problemaDelDialogo(lineas)
  const totalCaracteres = lineas.reduce((suma, l) => suma + l.texto.trim().length, 0)

  function cambiarLineas(nuevas: LineaDialogo[]) {
    setLineas(nuevas)
    setAudioUrl(null)
  }

  function actualizarLinea(indice: number, cambios: Partial<LineaDialogo>) {
    cambiarLineas(lineas.map((l, i) => (i === indice ? { ...l, ...cambios } : l)))
  }

  function moverLinea(indice: number, destino: number) {
    const nuevas = [...lineas]
    const [linea] = nuevas.splice(indice, 1)
    nuevas.splice(destino, 0, linea)
    cambiarLineas(nuevas)
  }

  function agregarLinea() {
    const ultimo = lineas[lineas.length - 1]?.hablante
    cambiarLineas([...lineas, { hablante: ultimo === 'A' ? 'B' : 'A', texto: '' }])
  }

  async function generar() {
    setError(null)
    setGenerando(true)
    try {
      setAudioUrl(await generarAudioDialogo({ acento, velocidad, lineas }))
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo generar el audio.'))
    } finally {
      setGenerando(false)
    }
  }

  return (
    <section aria-label="Crear diálogo" className="space-y-4 border-t border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Diálogo de listening</h3>
          <p className="text-xs text-slate-500">
            Escribe lo que dice cada persona. La Persona A tiene voz de mujer y la B de hombre. El alumno no ve este texto.
          </p>
        </div>
        <Button variant="ghost" size="icon" icon="close" aria-label="Cerrar diálogo" onClick={onCerrar} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FieldGroup label="Acento">
          <SegmentedControl options={OPCIONES_ACENTO} value={acento} onChange={(a) => { setAcento(a); setAudioUrl(null) }} ariaLabel="Acento" />
        </FieldGroup>
        <FieldGroup label="Velocidad">
          <SegmentedControl options={OPCIONES_VELOCIDAD} value={velocidad} onChange={(v) => { setVelocidad(v); setAudioUrl(null) }} ariaLabel="Velocidad" />
        </FieldGroup>
      </div>

      <ol className="space-y-2">
        {lineas.map((linea, i) => (
          <li key={i} className="flex items-center gap-2">
            <Select
              aria-label={`Quién habla en la línea ${i + 1}`}
              className="w-32 shrink-0"
              value={linea.hablante}
              onChange={(e) => actualizarLinea(i, { hablante: e.target.value as Hablante })}
            >
              <option value="A">Persona A</option>
              <option value="B">Persona B</option>
            </Select>
            <Input
              aria-label={`Texto de la línea ${i + 1}`}
              value={linea.texto}
              maxLength={MAX_CARACTERES_LINEA}
              placeholder={i === 0 ? 'Hi, where is the station?' : ''}
              onChange={(e) => actualizarLinea(i, { texto: e.target.value })}
            />
            <Button variant="ghost" size="icon" icon="arrow_upward" aria-label={`Subir la línea ${i + 1}`} disabled={i === 0} onClick={() => moverLinea(i, i - 1)} />
            <Button
              variant="ghost"
              size="icon"
              icon="arrow_downward"
              aria-label={`Bajar la línea ${i + 1}`}
              disabled={i === lineas.length - 1}
              onClick={() => moverLinea(i, i + 1)}
            />
            <Button
              variant="danger"
              size="icon"
              icon="delete"
              aria-label={`Quitar la línea ${i + 1}`}
              disabled={lineas.length <= 2}
              onClick={() => cambiarLineas(lineas.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" size="sm" icon="add" disabled={lineas.length >= MAX_LINEAS} onClick={agregarLinea}>
          Agregar línea
        </Button>
        <span className="text-xs text-slate-500">
          {totalCaracteres} / {MAX_CARACTERES_DIALOGO} caracteres
        </span>
      </div>

      {problema && lineas.some((l) => l.texto.trim() !== '') && <p className="text-xs text-slate-500">{problema}</p>}
      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" icon="record_voice_over" loading={generando} disabled={problema !== null} onClick={generar}>
          {generando ? 'Generando audio...' : audioUrl ? 'Generar de nuevo' : 'Generar audio'}
        </Button>
        {audioUrl && (
          <>
            <audio controls src={audioUrl} aria-label="Audio generado" className="h-10" />
            <Button icon="check" onClick={() => onInsertar({ acento, velocidad, lineas, audioUrl })}>
              Insertar en la pregunta
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
