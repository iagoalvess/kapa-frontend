/**
 * Como se paga pelo Mercado Pago no Kapa. Espelha `MeioDePagamento` (Sprint 35).
 *
 * É o único lugar do front que lista estes meios: a parcela, a compra da loja e o plano recebem da API
 * a lista que aquele contexto permite, e montam as opções daqui. Hoje só o PIX avulso está ligado; o
 * cartão liga nas Sprints 37 e 39. O Pix Automático saiu em 28/09/2026 — era uma integração a mais.
 *
 * Não confundir com `MeioDeRecebimento`: aquele é a conta da comissão (a chave PIX, a transferência, o
 * dinheiro em mãos), que o formando paga e avisa. Estes baixam sozinhos.
 */
export type MeioDePagamento = 'Pix' | 'Cartao'

/** Como cada meio aparece na tela: o rótulo e a frase de uma linha que o explica. */
export const MEIOS_DE_PAGAMENTO: Record<MeioDePagamento, { rotulo: string; descricao: string }> = {
  Pix: { rotulo: 'PIX', descricao: 'QR e copia-e-cola, com confirmação na hora.' },
  Cartao: { rotulo: 'Cartão de crédito', descricao: 'Confirmação na hora.' },
}

/**
 * O cartão pronto para pagar (Sprint 39): a chave pública da conta da turma, para o formulário do Mercado Pago
 * tokenizar no navegador, e o valor que ele cobra. Espelha `CartaoParaPagarDTO`.
 */
export interface CartaoParaPagar {
  chave_publica: string
  /** O valor do PIX mais o acréscimo. */
  valor_em_centavos: number
  /** A taxa do cartão que a turma repassa a quem paga (P2); zero quando ela absorve. */
  acrescimo_em_centavos: number
  /** Em quantas vezes, no máximo — os juros do parcelamento são de quem paga (P3). */
  maximo_de_parcelas: number
}

/** O que o formulário do Mercado Pago devolve: o número do cartão nunca passa pelo Kapa. */
export interface CartaoTokenizado {
  token: string
  /** O `payment_method_id` (`visa`, `master`…). */
  bandeira: string
  /** Em quantas vezes. */
  parcelas: number
}
