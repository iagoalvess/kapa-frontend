import { z } from 'zod'

/**
 * O aceite: a caixa marcada e os seis dígitos que chegaram por e-mail. `literal(true)` recusa o
 * desmarcado com a mensagem certa, sem `refine`.
 */
export const esquemaDeAceite = z.object({
  aceito: z.literal(true, 'Marque que leu e aceita o termo.'),
  codigo: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'O código tem seis dígitos.'),
})

export type FormularioDeAceite = z.infer<typeof esquemaDeAceite>

/** O texto de uma versão nova do termo. O limite é o do backend (`PublicarTermoValidator`). */
export const esquemaDoTermo = z.object({
  conteudo: z
    .string()
    .trim()
    .min(1, 'Escreva o texto do termo.')
    .max(100_000, 'O termo deve ter no máximo 100.000 caracteres.'),
})

export type FormularioDoTermo = z.infer<typeof esquemaDoTermo>

/**
 * Ponto de partida para a primeira versão: a estrutura de um termo de adesão, com os trechos que a
 * comissão completa entre colchetes. O resumo financeiro não entra aqui — a tela e o PDF o montam
 * do plano em vigor, e ele faz parte do que o formando aceita.
 */
export const MODELO_DE_TERMO = `# Termo de adesão

## 1. Das partes

De um lado, a comissão de formatura da turma [nome da turma], representada pelo Presidente; de outro, o formando identificado no registro do aceite.

## 2. Do objeto

O formando adere ao projeto de formatura da turma e se compromete a pagar a sua parte do custo, conforme o plano de pagamento apresentado junto deste termo.

## 3. Dos pagamentos

- Os valores, as parcelas e os vencimentos são os do plano apresentado no momento do aceite.
- O pagamento é feito à comissão, pelos meios que ela informar.
- Em caso de atraso, valem a multa e os juros do plano.

## 4. Da desistência

[Descreva o que acontece com os valores pagos se o formando desistir.]

## 5. Disposições gerais

[Foro, comunicação entre as partes e demais combinados da turma.]
`
