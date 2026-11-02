/**
 * El enunciado/alternativas llegan como HTML del editor del banco de preguntas y el preflight de
 * Tailwind le quita margenes, listas y estilos a tablas: se reponen aqui para que se lean bien.
 */
/**
 * Bloques de codigo (preguntas de programacion) y audio (listening): se usan en el simulacro y en
 * cualquier otra vista del enunciado (moderacion, revisiones, estadisticas, vista previa del editor).
 * El `code` dentro de `pre` pierde el estilo de codigo en linea.
 */
export const CLASE_CODIGO_Y_AUDIO =
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-6 [&_pre]:text-slate-100 ' +
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit ' +
  '[&_audio]:my-3 [&_audio]:w-full'

export const CLASE_HTML_ENRIQUECIDO =
  '[&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic ' +
  '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 ' +
  '[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl ' +
  '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 ' +
  '[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left ' +
  '[&_code]:rounded [&_code]:bg-primary-50 [&_code]:px-1.5 [&_code]:font-mono [&_code]:text-primary-800 ' +
  '[&_sup]:text-[0.7em] [&_sub]:text-[0.7em] ' +
  CLASE_CODIGO_Y_AUDIO

export const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
