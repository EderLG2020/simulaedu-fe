import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui'
import CabeceraSimulacro from './CabeceraSimulacro'
import ConfirmarFinalizarModal from './ConfirmarFinalizarModal'
import NavegadorPreguntas from './NavegadorPreguntas'
import PanelPregunta from './PanelPregunta'
import { useSimulacro } from './useSimulacro'

/** Migracion del mockup de Stitch "rendir simulacro". Se omitieron los datos que el mockup inventaba
 * (area/codigo del examen, "modelo DECO", formula de referencia, ritmo vs promedio): no existen en el backend. */
export default function SimulacroPage() {
  const navigate = useNavigate()
  const {
    simulacro,
    examen,
    cargando,
    error,
    setError,
    indiceActual,
    indiceMaximoPermitido,
    preguntaActual,
    segundosRestantes,
    pausado,
    pausando,
    finalizando,
    confirmandoFinalizar,
    setConfirmandoFinalizar,
    cerrarConfirmacion,
    navegadorAbierto,
    setNavegadorAbierto,
    estadoGuardado,
    conteo,
    finalizar,
    guardarRespuesta,
    guardarRespuestaConDebounce,
    alternarMarcaRevision,
    registrarEscuchaDe,
    irAPregunta,
    cambiarPausa,
  } = useSimulacro()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-body text-slate-700">
        <Icon name="progress_activity" size={24} className="mr-2 animate-spin text-primary-600" />
        Cargando simulacro...
      </div>
    )
  }

  if (!simulacro || simulacro.preguntas.length === 0) {
    // Sin preguntas: intentos creados antes de que el backend rechazara sorteos vacios - sin esto solo se veia el cronometro.
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-body text-slate-900">
        <div className="flex max-w-md flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <Icon name={simulacro ? 'inventory_2' : 'error'} size={30} />
          </div>
          <p className="text-sm text-slate-700">
            {simulacro
              ? 'Este simulacro no tiene preguntas: el examen no tenía preguntas disponibles cuando lo iniciaste. Avisa a tu docente o elige otro examen.'
              : (error ?? 'Simulacro no encontrado.')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/examenes')}
            className="mt-5 h-11 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800"
          >
            Volver a exámenes
          </button>
        </div>
      </div>
    )
  }

  const valorPregunta = examen?.preguntas.find((p) => p.preguntaId === preguntaActual?.preguntaId)?.puntajeAsignado
  const esUltima = indiceActual === simulacro.preguntas.length - 1

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-body text-slate-900">
      <CabeceraSimulacro
        examen={examen}
        segundosRestantes={segundosRestantes}
        pausado={pausado}
        permitePausa={simulacro.permitePausa}
        pausando={pausando}
        finalizando={finalizando}
        estadoGuardado={estadoGuardado}
        conteo={conteo}
        onCambiarPausa={cambiarPausa}
        onFinalizar={() => setConfirmandoFinalizar(true)}
      />

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 content-start items-start gap-4 px-4 py-4 sm:px-6 lg:grid-cols-12 lg:gap-5 lg:py-5">
        <button
          type="button"
          onClick={() => setNavegadorAbierto((v) => !v)}
          aria-expanded={navegadorAbierto}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm lg:hidden"
        >
          <span className="flex items-center gap-2">
            <Icon name="grid_view" size={24} className="text-primary-600" />
            Ver preguntas ({indiceActual + 1}/{conteo.total})
          </span>
          <Icon name={navegadorAbierto ? 'expand_less' : 'expand_more'} size={24} />
        </button>

        <aside
          className={`${navegadorAbierto ? 'block' : 'hidden'} rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-28 lg:col-span-4 lg:block xl:col-span-3`}
        >
          <NavegadorPreguntas
            preguntas={simulacro.preguntas}
            indiceActual={indiceActual}
            indiceMaximoPermitido={indiceMaximoPermitido}
            onIr={irAPregunta}
          />
        </aside>

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-8 xl:col-span-9">
          {error && (
            <div role="alert" className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700">
              <Icon name="error" size={18} />
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Cerrar aviso" className="text-rose-400 hover:text-rose-700">
                <Icon name="close" size={18} />
              </button>
            </div>
          )}

          {pausado ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <Icon name="pause" size={36} />
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900">Simulacro en pausa</h2>
              <p className="max-w-sm text-sm text-slate-700">Tu tiempo está congelado. Las preguntas se ocultan mientras dure la pausa.</p>
              <button
                type="button"
                disabled={pausando}
                onClick={() => cambiarPausa('reanudar')}
                className="mt-2 flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800 disabled:opacity-60"
              >
                <Icon name="play_arrow" size={18} />
                Reanudar
              </button>
            </div>
          ) : (
            preguntaActual && (
              <PanelPregunta
                pregunta={preguntaActual}
                indiceActual={indiceActual}
                total={conteo.total}
                valorPregunta={valorPregunta}
                esUltima={esUltima}
                onAlternarMarca={() => alternarMarcaRevision(preguntaActual)}
                onEscuchar={() => registrarEscuchaDe(preguntaActual)}
                onGuardar={(respuestaDada) => guardarRespuesta(preguntaActual.respuestaSimulacroId, respuestaDada)}
                onGuardarConDebounce={(respuestaDada) => guardarRespuestaConDebounce(preguntaActual.respuestaSimulacroId, respuestaDada)}
                onIr={irAPregunta}
                onFinalizar={() => setConfirmandoFinalizar(true)}
              />
            )
          )}
        </section>
      </main>

      <footer className="hidden border-t border-slate-200 bg-white px-6 py-2 text-[11px] text-slate-500 md:block">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary-600" />
            Modo concentración activo
          </span>
          <span>
            Atajos: <kbd className="font-semibold text-slate-700">A–E</kbd> elegir alternativa ·{' '}
            <kbd className="font-semibold text-slate-700">← →</kbd> navegar
          </span>
        </div>
      </footer>

      {confirmandoFinalizar && (
        <ConfirmarFinalizarModal
          respondidas={conteo.respondidas}
          sinResponder={conteo.total - conteo.respondidas}
          marcadas={conteo.marcadas}
          finalizando={finalizando}
          onCancelar={cerrarConfirmacion}
          onConfirmar={finalizar}
        />
      )}
    </div>
  )
}
