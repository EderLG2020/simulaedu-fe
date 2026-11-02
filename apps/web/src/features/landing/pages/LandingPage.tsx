import { useEffect, useState } from 'react'
import { obtenerEstadisticasLanding, type LandingEstadisticas } from '../api/landingApi'
import Caracteristicas from '../components/secciones/Caracteristicas'
import Cifras from '../components/secciones/Cifras'
import ComoFunciona from '../components/secciones/ComoFunciona'
import Encabezado from '../components/secciones/Encabezado'
import Hero from '../components/secciones/Hero'
import Institucional from '../components/secciones/Institucional'
import LlamadoFinal from '../components/secciones/LlamadoFinal'
import PiePagina from '../components/secciones/PiePagina'
import Planes from '../components/secciones/Planes'
import PreguntasFrecuentes from '../components/secciones/PreguntasFrecuentes'
import Testimonios from '../components/secciones/Testimonios'

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
