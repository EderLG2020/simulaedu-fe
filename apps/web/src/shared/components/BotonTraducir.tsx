import type { Idioma } from '../lib/tipos/idioma'
import { Button, Icon } from './ui'

interface Props {
  /** Idioma al que se esta traduciendo ahora (muestra el spinner en ese boton), o null. */
  traduciendo: Idioma | null
  onTraducir: (destino: Idioma) => void
  disabled?: boolean
  /** Que se traduce, para el nombre accesible: «Traducir {que} al inglés». */
  que: string
  /** Texto junto al icono; sin el, solo se ven los botones EN / ES. */
  etiqueta?: string
}

const DESTINOS: { idioma: Idioma; corto: string; largo: string }[] = [
  { idioma: 'EN', corto: 'EN', largo: 'al inglés' },
  { idioma: 'ES', corto: 'ES', largo: 'al español' },
]

/** Botones «Traducir al inglés / al español» del panel (DeepL). El resultado se revisa antes de guardar. */
export default function BotonTraducir({ traduciendo, onTraducir, que, disabled = false, etiqueta }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Traducir ${que} con DeepL`}>
      <Icon name="translate" size={16} className="text-slate-400" />
      {etiqueta && <span className="mr-1 text-xs font-semibold text-slate-500">{etiqueta}</span>}
      {DESTINOS.map(({ idioma, corto, largo }) => (
        <Button
          key={idioma}
          variant="ghost"
          size="sm"
          aria-label={`Traducir ${que} ${largo}`}
          title={`Traducir ${que} ${largo}`}
          loading={traduciendo === idioma}
          disabled={disabled || (traduciendo !== null && traduciendo !== idioma)}
          onClick={() => onTraducir(idioma)}
        >
          {corto}
        </Button>
      ))}
    </div>
  )
}
