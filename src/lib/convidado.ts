import { z } from 'zod'
import type { DadosDoConvidado, MeuConvite } from '@/types/festa'

/*
  O titular de um convite — nome, documento, e-mail e observações —, como o formando, a Gestão e o comprador da
  loja (Sprint 26) o informam. Validação de **forma**: o dígito verificador do CPF, a lista fechada e o
  "documento obrigatório depois do fechamento" voltam da API com código e mensagem, no campo certo.

  Em `lib/` porque duas features nomeiam o mesmo convite: `festa` e `loja`.
*/

export const esquemaDoConvidado = z
  .object({
    nome: z.string().trim().min(1, 'Informe o nome do convidado.').max(120, 'No máximo 120 caracteres.'),
    tipo_do_documento: z.enum(['', 'Cpf', 'Rg']),
    numero_do_documento: z.string().trim().max(20, 'No máximo 20 caracteres.'),
    email: z.union([z.literal(''), z.string().trim().email('E-mail inválido.')]),
    observacoes: z.string().trim().max(500, 'No máximo 500 caracteres.'),
  })
  .refine((valores) => valores.tipo_do_documento === '' || valores.numero_do_documento !== '', {
    path: ['numero_do_documento'],
    message: 'Informe o número do documento.',
  })
  .refine((valores) => valores.numero_do_documento === '' || valores.tipo_do_documento !== '', {
    path: ['tipo_do_documento'],
    message: 'Diga se é CPF ou RG.',
  })

export type FormularioDoConvidado = z.infer<typeof esquemaDoConvidado>

/**
 * O convite de volta ao formulário. O número do documento não volta: a API só devolve o mascarado,
 * e quem troca o titular digita o documento do novo.
 */
export const paraFormularioDoConvidado = (convite?: MeuConvite): FormularioDoConvidado => ({
  nome: convite?.nome_do_convidado ?? '',
  tipo_do_documento: '',
  numero_do_documento: '',
  email: convite?.email_do_convidado ?? '',
  observacoes: convite?.observacoes ?? '',
})

/** O formulário no formato do corpo da API: vazio vira nulo. */
export const paraDadosDoConvidado = (valores: FormularioDoConvidado): DadosDoConvidado => ({
  nome: valores.nome.trim(),
  tipo_do_documento: valores.tipo_do_documento === '' ? null : valores.tipo_do_documento,
  numero_do_documento: valores.numero_do_documento.trim() || null,
  email: valores.email.trim() || null,
  observacoes: valores.observacoes.trim() || null,
})
