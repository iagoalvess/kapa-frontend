import { z } from 'zod'

/*
  Validação de **forma**. A política de senha (tamanho, dígito, maiúscula) vive só no backend,
  como registrado em `docs/arquitetura.md`. Repetir aqui garante que um dia as duas discordem — e
  quem manda é a que o usuário não vê. O erro dela volta da API para o campo certo.
*/

const email = z.email('Informe um e-mail válido.')

/** Login. */
export const esquemaDeLogin = z.object({
  email,
  senha: z.string().min(1, 'A senha é obrigatória.'),
})

/**
 * Criação de conta, com um aceite obrigatório que cobre todos os documentos legais.
 *
 * `true` literal: `z.boolean()` aceitaria `false` e deixaria o cadastro passar sem aceite.
 */
export const esquemaDeNovaConta = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'O nome é obrigatório.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  email,
  senha: z.string().min(1, 'A senha é obrigatória.'),
  aceite: z.literal(true, 'É preciso aceitar para continuar.'),
})

/** Pedido que só leva o e-mail: esqueci a senha e reenvio da confirmação. */
export const esquemaDePedidoPorEmail = z.object({ email })

/**
 * Nova senha digitada duas vezes. Conferir se as duas batem é forma, não política: o erro de
 * digitação aqui só seria descoberto no próximo login.
 */
const novaSenhaConfirmada = z
  .object({
    nova_senha: z.string().min(1, 'A nova senha é obrigatória.'),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.nova_senha === dados.confirmacao, {
    message: 'As senhas não conferem.',
    path: ['confirmacao'],
  })

/** Redefinição pelo link do e-mail. */
export const esquemaDeRedefinicao = novaSenhaConfirmada

/** Troca de senha por quem está logado. */
export const esquemaDeTrocaDeSenha = z
  .object({ senha_atual: z.string().min(1, 'A senha atual é obrigatória.') })
  .and(novaSenhaConfirmada)

export type FormularioDeLogin = z.infer<typeof esquemaDeLogin>
export type FormularioDeNovaConta = z.infer<typeof esquemaDeNovaConta>
export type FormularioDePedidoPorEmail = z.infer<typeof esquemaDePedidoPorEmail>
export type FormularioDeRedefinicao = z.infer<typeof esquemaDeRedefinicao>
export type FormularioDeTrocaDeSenha = z.infer<typeof esquemaDeTrocaDeSenha>
