import { z } from 'zod'

/**
 * A segunda etapa do diálogo de exclusão.
 *
 * Só "obrigatória": a política de senha é do backend, e repeti-la aqui garante que um dia as duas
 * discordem. Senha errada volta como `privacidade.senha_invalida`, e é a API quem decide isso.
 */
export const esquemaDeExclusao = z.object({
  senha: z.string().min(1, 'Digite sua senha para confirmar.'),
})

export type FormularioDeExclusao = z.infer<typeof esquemaDeExclusao>
