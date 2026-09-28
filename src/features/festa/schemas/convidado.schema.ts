import { z } from 'zod'
import { esquemaDoConvidado } from '@/lib/convidado'

// O titular sobe para `lib/convidado`: a loja pública (Sprint 26) nomeia os mesmos convites.
export {
  esquemaDoConvidado,
  type FormularioDoConvidado,
  paraDadosDoConvidado,
  paraFormularioDoConvidado,
} from '@/lib/convidado'

/**
 * O titular com o motivo da cortesia (decisão 14). Um esquema só para as duas portas: o motivo é
 * obrigatório só na cortesia, e quem o cobra é o formulário.
 */
export const esquemaDaCortesia = esquemaDoConvidado.and(
  z.object({ motivo: z.string().trim().max(300, 'No máximo 300 caracteres.') }),
)

export type FormularioDaCortesia = z.infer<typeof esquemaDaCortesia>
