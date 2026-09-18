import type { Parcela } from './types/pagamentos.types'

/**
 * Uma parcela como a API devolve, para os testes da feature: sem descrição nem pagamento, os campos
 * não vêm (`WhenWritingNull`).
 *
 * @param mudancas O que muda nesta parcela.
 */
export const parcelaDeTeste = (mudancas: Partial<Parcela> = {}): Parcela => ({
  id: 'pa-1',
  usuario_id: 'u-2',
  nome: 'Bruno Lima',
  tipo: 'Mensalidade',
  numero: 3,
  de: 24,
  vencimento: '2026-10-10',
  valor_original_em_centavos: 35_000,
  status: 'Aberta',
  em_conferencia: false,
  valor_do_dia: {
    original_em_centavos: 35_000,
    multa_em_centavos: 0,
    juros_em_centavos: 0,
    desconto_em_centavos: 0,
    total_em_centavos: 35_000,
    dias_de_atraso: 0,
    ja_pago_em_centavos: 0,
  },
  ...mudancas,
})

/** A vencida de 36 dias: multa de 2% e juros de 1% ao mês. */
export const vencidaDeTeste = (mudancas: Partial<Parcela> = {}) =>
  parcelaDeTeste({
    id: 'pa-venc',
    numero: 2,
    vencimento: '2026-08-10',
    status: 'Vencida',
    valor_do_dia: {
      original_em_centavos: 35_000,
      multa_em_centavos: 700,
      juros_em_centavos: 420,
      desconto_em_centavos: 0,
      total_em_centavos: 36_120,
      dias_de_atraso: 36,
      ja_pago_em_centavos: 0,
    },
    ...mudancas,
  })

/** A paga, sem valor do dia. */
export const pagaDeTeste = (mudancas: Partial<Parcela> = {}) =>
  parcelaDeTeste({
    id: 'pa-paga',
    numero: 1,
    vencimento: '2026-07-10',
    status: 'Paga',
    valor_pago_em_centavos: 35_000,
    pago_em: '2026-07-09',
    valor_do_dia: undefined,
    ...mudancas,
  })
