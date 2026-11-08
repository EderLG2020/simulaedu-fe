/** Usuario autenticado tal como lo devuelve el backend (login, registro y /usuarios/me). */
export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  emailVerificado: boolean
  universidadObjetivoId?: string | null
  /** RN-02: solo lo trae GET/PUT /usuarios/me; en login llega null (desconocido). */
  planLimitaUniversidades?: boolean | null
  /** V20: si el plan incluye los programas de idiomas y tecnologia. Mismo criterio de null. */
  planIncluyeProgramas?: boolean | null
  /** Foto de perfil (Cloudinary); null = se muestran las iniciales. */
  fotoUrl?: string | null
  /** Institución (colegio o academia) a la que pertenece; null si no pertenece a ninguna. */
  institucionId?: string | null
}
