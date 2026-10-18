import { useEffect, useState } from 'react'
import { obtenerEstadisticasLanding, type LandingEstadisticas } from '../../api/landingApi'
import Caracteristicas from './secciones/Caracteristicas'
import Cifras from './secciones/Cifras'
import ComoFunciona from './secciones/ComoFunciona'
import Encabezado from './secciones/Encabezado'
import Hero from './secciones/Hero'
import Institucional from './secciones/Institucional'
import LlamadoFinal from './secciones/LlamadoFinal'
import PiePagina from './secciones/PiePagina'
import Planes from './secciones/Planes'
import PreguntasFrecuentes from './secciones/PreguntasFrecuentes'
import Testimonios from './secciones/Testimonios'

/** Landing publica. Cada seccion vive en ./secciones; aqui solo se cargan las cifras reales y se arma el orden. */
export default function LandingPage() {
  const [estadisticas, setEstadisticas] = useState<LandingEstadisticas | null>(null)

  useEffect(() => {
    obtenerEstadisticasLanding()
      .then(setEstadisticas)
      .catch(() => {})
  }, [])

  return (
    <div className="bg-slate-50 font-body text-left text-slate-900">
      <Encabezado />

      <main>
        <Hero />
        <Cifras estadisticas={estadisticas} />
        <ComoFunciona />
        <Caracteristicas />
        <Testimonios />
        <Planes />
        <Institucional />
        <PreguntasFrecuentes />
        <LlamadoFinal />
      </main>

      <PiePagina />
    </div>
  )
}
