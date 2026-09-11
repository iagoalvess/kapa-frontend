import { z } from 'zod'

/**
 * Validação de **forma** do login.
 *
 * A política de senha (tamanho, dígito, maiúscula) vive só no backend, como registrado em
 * `docs/arquitetura.md`. Repetir aqui garante que um dia as duas discordem — e quem manda é a
 * que o usuário não vê.
 */
export const esquemaDeLogin = z.object({
  email: z.email('Informe um e-mail válido.'),
  senha: z.string().min(1, 'A senha é obrigatória.'),
})

export type FormularioDeLogin = z.infer<typeof esquemaDeLogin>
