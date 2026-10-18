import { formatearPuntos } from './formatoSimulacro'

interface Punto {
  fecha: string | null
  puntaje: number
}

interface Props {
  /** En orden cronologico (el mas antiguo primero). */
  puntos: Punto[]
}

// Tamano cercano al real en pantalla: asi el texto del SVG (11px) no se ve diminuto al escalar.
const ANCHO = 340
const ALTO = 190
const MARGEN = { arriba: 14, derecha: 12, abajo: 26, izquierda: 28 }

const fechaCorta = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' })

function etiquetaFecha(fecha: string | null): string {
  return fecha ? fechaCorta.format(new Date(fecha)).replace('.', '') : ''
}

/** Techo "redondo" del eje Y: 100 para puntajes sobre 100, y multiplos de 20 en otro caso. */
function techoEje(maximo: number): number {
  if (maximo <= 0) return 20
  return maximo <= 100 ? Math.max(20, Math.ceil(maximo / 20) * 20) : Math.ceil(maximo / 50) * 50
}

/** Linea de evolucion en SVG propio: una sola serie no justifica sumar una libreria de graficos. */
export default function GraficoEvolucion({ puntos }: Props) {
  const maximo = Math.max(...puntos.map((p) => p.puntaje))
  const techo = techoEje(maximo)
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo
  const x = (i: number) => MARGEN.izquierda + (puntos.length === 1 ? anchoUtil / 2 : (i / (puntos.length - 1)) * anchoUtil)
  const y = (v: number) => MARGEN.arriba + altoUtil - (v / techo) * altoUtil

  const linea = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.puntaje).toFixed(1)}`).join(' ')
  const area = `${linea} L${x(puntos.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const indiceMaximo = puntos.findIndex((p) => p.puntaje === maximo)
  const guias = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(techo * f))
  const cadaCuantasEtiquetas = Math.ceil(puntos.length / 6)
  const resumen = `Evolución de tu puntaje en tus últimos ${puntos.length} simulacros: de ${formatearPuntos(puntos[0].puntaje)} a ${formatearPuntos(puntos[puntos.length - 1].puntaje)} puntos, máximo ${formatearPuntos(maximo)}.`

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={resumen} className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id="relleno-evolucion" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </linearGradient>
      </defs>

      {guias.map((g) => (
        <g key={g}>
          <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(g)} y2={y(g)} stroke="#e2e8f0" strokeDasharray={g === 0 ? undefined : '4 4'} />
          <text x={MARGEN.izquierda - 8} y={y(g) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">
            {g}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#relleno-evolucion)" />
      <path d={linea} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {puntos.map((p, i) => {
        const esMaximo = i === indiceMaximo
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.puntaje)} r={esMaximo ? 6 : 4} fill={esMaximo ? '#f97316' : '#ffffff'} stroke={esMaximo ? '#ffffff' : '#4f46e5'} strokeWidth="2.5">
              <title>{`${etiquetaFecha(p.fecha)}: ${formatearPuntos(p.puntaje)} pts`}</title>
            </circle>
            {(i % cadaCuantasEtiquetas === 0 || i === puntos.length - 1) && (
              <text
                x={x(i)}
                y={ALTO - 6}
                textAnchor="middle"
                className={i === puntos.length - 1 ? 'fill-primary-600 text-[11px] font-bold' : 'fill-slate-400 text-[11px]'}
              >
                {etiquetaFecha(p.fecha)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
