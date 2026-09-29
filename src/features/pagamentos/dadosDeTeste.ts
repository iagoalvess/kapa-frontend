import type { CobrancaDaParcela, MeioDaCobranca, Parcela, PeloMercadoPago } from './types/pagamentos.types'

/**
 * Uma parcela como a API devolve, para os testes da feature: sem descrição nem pagamento, os campos
 * vêm nulos.
 *
 * @param mudancas O que muda nesta parcela.
 */
export const parcelaDeTeste = (mudancas: Partial<Parcela> = {}): Parcela => ({
  id: 'pa-1',
  usuario_id: 'u-2',
  nome: 'Bruno Lima',
  item_de_cobranca_id: 'i-1',
  tipo: 'Mensalidade',
  descricao: null,
  numero: 3,
  de: 24,
  vencimento: '2026-10-10',
  valor_original_em_centavos: 35_000,
  status: 'Aberta',
  em_conferencia: false,
  valor_pago_em_centavos: null,
  pago_em: null,
  recebimento_id: null,
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
    valor_do_dia: null,
    recebimento_id: 'rc-1',
    ...mudancas,
  })

/** Um BR Code de verdade — o do manual do Banco Central. */
const COPIA_E_COLA =
  '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D'

/** O PIX pronto para pagar, com a chave da comissão. */
export const pixDeTeste = (): MeioDaCobranca => ({
  meio: 'Pix',
  pix: {
    copia_e_cola: COPIA_E_COLA,
    chave: '52998224725',
    nome_do_titular: 'Comissão Medicina 2027',
    documento_do_titular: 'CPF ***.982.247-**',
    conferida_em: '2026-09-14T15:00:00Z',
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

/** O PIX do Mercado Pago da turma (Sprint 25): baixa sozinho. */
export const pixDoMercadoPagoDeTeste = (): PeloMercadoPago => ({
  meio: 'Pix',
  pix: { copia_e_cola: '00020126-dinamico', expira_em: '2026-09-25T02:59:59Z' },
  cartao: null,
})

/**
 * O cartão da turma (Sprint 39), com a taxa repassada: 5% sobre R$ 350,00.
 *
 * @param acrescimo O que o cartão cobra a mais; zero quando a turma absorve a taxa.
 */
export const cartaoDoMercadoPagoDeTeste = (acrescimo = 1_842): PeloMercadoPago => ({
  meio: 'Cartao',
  pix: null,
  cartao: {
    chave_publica: 'APP_USR-publica',
    valor_em_centavos: 35_000 + acrescimo,
    acrescimo_em_centavos: acrescimo,
    maximo_de_parcelas: 12,
  },
})

/**
 * A cobrança como a API a devolve. Sem meios informados, só o PIX — é a turma de antes da Sprint 18,
 * e a tela dela não tem seletor.
 *
 * @param meios Os meios habilitados, na ordem em que a tela os oferece.
 * @param peloMercadoPago Os meios do Mercado Pago da turma; vazio sem a conta conectada.
 */
export const cobrancaDeTeste = (
  meios: MeioDaCobranca[] = [pixDeTeste()],
  peloMercadoPago: PeloMercadoPago[] = [],
): CobrancaDaParcela => ({
  valor_em_centavos: 35_000,
  identificador: 'KAPA0123456789ABCDEF01234',
  pelo_mercado_pago: peloMercadoPago,
  meios,
})
