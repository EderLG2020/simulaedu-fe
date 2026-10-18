import type { ExamenResumen } from '../../api/examenesApi'
import { Alert, Button, Icon } from '../../components/ui'
import { formatearDuracion } from '../../lib/formato'
import { Dato, Requisito, SeccionCard } from './ComponentesEditor'
import { ETIQUETA_TIPO } from './resumenExamenes'
import type { EditorExamen } from './useEditorExamen'

/** Paso 3: resumen del examen y publicacion con confirmacion en linea. */
export default function PasoPublicar({ editor, examen }: { editor: EditorExamen; examen: ExamenResumen }) {
  const {
    universidadNombre,
    formulario,
    puntajeTotal,
    esFija,
    preguntasElegidas,
    areas,
    publicado,
    cantidadItems,
    puntajeCuadra,
    puedePublicar,
    haySinGuardar,
    confirmandoPublicar,
    setConfirmandoPublicar,
    guardando,
    handlePublicar,
  } = editor

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <SeccionCard titulo="Resumen" className="lg:col-span-7">
        <dl className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
          <Dato etiqueta="Programa">{universidadNombre}</Dato>
          <Dato etiqueta="Duración">{formatearDuracion(Number(formulario.duracionMinutos) * 60)}</Dato>
          <Dato etiqueta="Puntaje total">{puntajeTotal} pts</Dato>
          <Dato etiqueta="Tipo de examen">{ETIQUETA_TIPO[formulario.tipo].texto}</Dato>
          <Dato etiqueta="Selección">{esFija ? 'Fija' : 'Aleatoria por área'}</Dato>
          <Dato etiqueta="Composición">{esFija ? `${preguntasElegidas.length} preguntas` : `${areas.length} áreas`}</Dato>
          <Dato etiqueta="Navegación">
            {formulario.navegacion === 'LIBRE' ? 'Libre' : 'Secuencial'} · {formulario.permitePausa ? 'con pausa' : 'sin pausa'}
          </Dato>
        </dl>
      </SeccionCard>

      <SeccionCard titulo="Publicación" className="lg:col-span-5">
        <div className="flex flex-col gap-4 p-5">
          {publicado ? (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Icon name="public" size={20} />
                Publicado: visible para los estudiantes.
              </p>
              {!examen.disponible && (
                <Alert tone="warning">Hoy no se puede rendir: alguna de sus áreas no tiene suficientes preguntas publicadas en el banco.</Alert>
              )}
            </>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                <Requisito ok={cantidadItems > 0}>{esFija ? 'Al menos una pregunta agregada' : 'Al menos un área configurada'}</Requisito>
                <Requisito ok={puntajeCuadra}>La suma de puntajes es {puntajeTotal} pts</Requisito>
              </ul>
              <p className="text-xs text-slate-500">Al publicar, el examen aparece para los estudiantes de la universidad. No se puede volver a borrador.</p>

              {!confirmandoPublicar ? (
                <Button icon="public" onClick={() => setConfirmandoPublicar(true)} disabled={guardando || !puedePublicar}>
                  Publicar examen
                </Button>
              ) : (
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3" role="alertdialog" aria-label="Confirmar publicación">
                  <p className="text-sm text-slate-700">
                    ¿Publicar <b>{formulario.nombre}</b>? Los estudiantes podrán rendirlo de inmediato.
                    {haySinGuardar && ' Tus cambios sin guardar se guardarán primero.'}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmandoPublicar(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handlePublicar} loading={guardando}>
                      Sí, publicar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SeccionCard>
    </div>
  )
}
