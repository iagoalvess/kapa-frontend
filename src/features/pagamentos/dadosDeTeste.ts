import type { CobrancaDaParcela, MeioDaCobranca, Parcela } from './types/pagamentos.types'

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

/** Um BR Code de verdade — o do manual do Banco Central. */
export const COPIA_E_COLA =
  '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D'

/** O PIX pronto para pagar, com a chave da comissão. */
export const pixDeTeste = (): MeioDaCobranca => ({
  meio: 'Pix',
  pix: {
    copia_e_cola: COPIA_E_COLA,
    chave: '52998224725',
    nome_do_titular: 'Comissão Medicina 2027',
  },
  transferencia: null,
  instrucao: null,
})

/** A conta para transferência, como a comissão a digitou. */
export const tedDeTeste = (): MeioDaCobranca => ({
  meio: 'Transferencia',
  pix: null,
  transferencia: {
    banco: 'Banco do Brasil',
    agencia: '1234-5',
    conta: '98765-4',
    tipo_de_conta: 'Corrente',
    titular: 'Comissão Medicina 2027',
  },
  instrucao: null,
})

/** O dinheiro em mãos, que é só instrução. */
export const dinheiroDeTeste = (): MeioDaCobranca => ({
  meio: 'Dinheiro',
  pix: null,
  transferencia: null,
  instrucao: 'Entregue a Bruna Tesoureira, nas reuniões de quinta.',
})

/**
 * A cobrança como a API a devolve. Sem meios informados, só o PIX — é a turma de antes da Sprint 18,
 * e a tela dela não tem seletor.
 *
 * @param meios Os meios habilitados, na ordem em que a tela os oferece.
 */
export const cobrancaDeTeste = (meios: MeioDaCobranca[] = [pixDeTeste()]): CobrancaDaParcela => ({
  valor_em_centavos: 35_000,
  identificador: 'KAPA0123456789ABCDEF01234',
  meios,
})
