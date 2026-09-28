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
