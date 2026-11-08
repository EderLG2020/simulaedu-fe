/** Universidades destacadas: se muestran en el hero y (las 4 primeras) en el pie de pagina. */
export const UNIVERSIDADES = [
  { sigla: 'UNMSM', nombre: 'Decana de America' },
  { sigla: 'UNI', nombre: 'Ciencias e Ingenieria' },
  { sigla: 'PUCP', nombre: 'Evaluacion Talento' },
  { sigla: 'UNFV', nombre: 'Federico Villarreal' },
  { sigla: 'UNSA', nombre: 'San Agustin Arequipa' },
  { sigla: 'UNT', nombre: 'Nacional de Trujillo' },
]

/** Preguntas frecuentes: el acordeon de la landing y su JSON-LD FAQPage usan la misma lista. */
export const FAQS = [
  {
    pregunta: 'Como funciona el calculo de puntaje y penalizacion?',
    respuesta:
      'Cada universidad tiene su propio reglamento de calificacion, configurado en la plataforma: una respuesta correcta suma puntos y una errada puede descontar segun el factor oficial de esa casa de estudios. El calculo se aplica automaticamente segun el examen que estes rindiendo.',
  },
  {
    pregunta: 'Puedo cambiar mi universidad objetivo despues de registrarme?',
    respuesta:
      'Si. Puedes elegir o cambiar tu universidad objetivo cuando quieras desde tu cuenta; los examenes disponibles se filtran automaticamente segun la universidad que elijas.',
  },
  {
    pregunta: 'Que diferencia hay entre el plan Free y el Premium?',
    respuesta:
      'El plan Free incluye 2 simulacros oficiales al mes en una sola universidad. El plan Premium quita ese limite, habilita todas las universidades, el ranking, las estadisticas avanzadas y los reportes descargables.',
  },
  {
    pregunta: 'Las preguntas de desarrollo quien las califica?',
    respuesta:
      'Las preguntas de tipo desarrollo (no de opcion multiple) pasan por revision de un docente despues de que finalizas el simulacro, no solo por un corrector automatico.',
  },
  {
    pregunta: 'Necesito tarjeta de credito para probar la plataforma?',
    respuesta: 'No. El plan Free no pide ningun medio de pago y puedes empezar a rendir simulacros apenas verificas tu correo.',
  },
]
