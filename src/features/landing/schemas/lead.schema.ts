import { z } from 'zod'

/**
 * Forma do formulário de contato.
 *
 * Valida só forma — obrigatório, formato, tamanho. A regra de negócio (janela de repetição,
 * honeypot, versão da Política consentida) é do backend, e o schema não a duplica.
 *
 * O honeypot **não** é validado: campo escondido preenchido não é erro do usuário, é robô — e quem
 * decide o que fazer com isso é a API.
 */
export const esquemaDeContato = z.object({
  nome: z.string().trim().min(1, 'Informe seu nome.').max(120),
  email: z.email('E-mail inválido.').max(256),
  telefone: z.string().trim().max(32),
  instituicao: z.string().trim().min(1, 'Informe a instituição.').max(160),
  curso: z.string().trim().min(1, 'Informe o curso.').max(160),
  tamanho_da_turma: z.coerce
    .number<number>()
    .int('Use um número inteiro.')
    .min(1, 'Informe quantos formandos a turma tem.')
    .max(2000, 'No máximo 2000 formandos.'),
  // `aaaa-mm`, que é o que o `<input type="month">` entrega. Vazio é aceito: quem ainda não sabe
  // a data da colação é exatamente quem mais precisa de assessoria.
  previsao_de_colacao: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Escolha o mês previsto.')
    .or(z.literal('')),
  mensagem: z.string().trim().max(1000),
  aceita_privacidade: z.literal(true, {
    error: 'Marque que você leu a Política de Privacidade.',
  }),
  sobrenome: z.string(),
})

export type FormularioDeContato = z.infer<typeof esquemaDeContato>
