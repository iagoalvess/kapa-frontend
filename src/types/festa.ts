import type { CategoriaDeDespesa } from './financeiro'

/**
 * Em que pé está um item da festa.
 *
 * Nunca é gravado: o backend o lê das despesas vinculadas a cada consulta. Lançar ou pagar uma
 * despesa muda o selo do cartão sem ninguém editar o item.
 */
export type EstadoDoItem = 'AContratar' | 'Contratado' | 'Pago' | 'Cancelado'

/** Quem paga um item: a turma inteira, pelo plano de cobrança, ou só quem quiser. */
export type TipoDeRateio = 'Turma' | 'PorFormando'

/** O nome de cada estado na tela. */
export const ROTULOS_DE_ESTADO = {
  AContratar: 'A contratar',
  Contratado: 'Contratado',
  Pago: 'Pago',
  Cancelado: 'Cancelado',
} as const satisfies Record<EstadoDoItem, string>

/**
 * O contrato de um item, como o cartão o abre.
 *
 * O arquivo continua no acervo (Sprint 11) e é baixado pelo endpoint de lá — o que vem aqui é só o
 * necessário para desenhar o link e decidir entre abrir numa aba e baixar. Espelha `DocumentoDoItem`.
 */
export interface DocumentoDoItem {
  id: string
  titulo: string
  nome_do_arquivo: string
  content_type: string
}

/**
 * Um item da festa: o que a turma está comprando.
 *
 * Mora em `types/` porque a tela da festa (feature `festa`), o seletor do lançamento de despesa
 * (feature `financeiro`) e a barra da meta (`app`) leem o mesmo item — e uma feature não importa de
 * outra. Espelha `ItemDaFestaDTO`.
 */
export interface ItemDaFesta {
  id: string
  titulo: string
  categoria: CategoriaDeDespesa
  /** O que vai ter, em Markdown. Nulo enquanto a comissão não descreveu. */
  o_que_inclui: string | null
  /** Nome de quem foi contratado, lido das despesas do item — e só o nome. */
  fornecedor: string | null
  /** O contrato no acervo, quando ligado e visível para a turma. */
  documento: DocumentoDoItem | null
  rateio: TipoDeRateio
  /** O total do contrato, ou o preço de cada formando quando o rateio é `PorFormando`. */
  valor_previsto_em_centavos: number
  /** Quantos devem comprar; 1 no item rateado pela turma. */
  quantidade_estimada: number
  /** Valor vezes quantidade — o que o item deve custar antes de haver despesa. */
  custo_previsto_em_centavos: number
  /** Soma das despesas vinculadas, canceladas de fora. */
  contratado_em_centavos: number
  pago_em_centavos: number
  /** Quanto o item pesa no custo da festa: o contratado, ou o previsto. Zero no cancelado. */
  custo_em_centavos: number
  /** Candidatas levantadas pela comissão; o detalhe traz cada uma. */
  quantidade_de_propostas: number
  /** Despesas vinculadas — com alguma, excluir devolve 409 e o caminho é cancelar. */
  quantidade_de_despesas: number
  estado: EstadoDoItem
  cancelado: boolean
  ordem: number
}

/** A meta da turma. Espelha `MetaDaFestaDTO`. */
export interface MetaDaFesta {
  custo_em_centavos: number
  pago_em_centavos: number
  /** O que a turma já recebeu — o mesmo número da tela do Caixa. */
  arrecadado_em_centavos: number
  /** Quanto ainda falta juntar; nunca negativo. */
  falta_arrecadar_em_centavos: number
  itens: number
  a_contratar: number
  pagos: number
}

/** O item como a tela o envia. Espelha `ItemDaFestaRequestDTO`. */
export interface DadosDoItemDaFesta {
  titulo: string
  categoria: CategoriaDeDespesa
  o_que_inclui?: string
  documento_id?: string
  rateio: TipoDeRateio
  valor_previsto_em_centavos: number
  quantidade_estimada: number
}

/**
 * Quanto da meta já entrou, de 0 a 100.
 *
 * Custo zero devolve 0, e não 100: turma que ainda não descreveu a festa não cumpriu uma meta que
 * não existe. Acima de 100 a barra satura — arrecadar a mais é bom, mas a barra não passa da borda.
 *
 * @param arrecadado O que entrou, em centavos.
 * @param custo O que a festa vai custar, em centavos.
 */
export function percentualDaMeta(arrecadado: number, custo: number) {
  if (custo <= 0) return 0

  return Math.min(100, Math.round((arrecadado / custo) * 100))
}

/**
 * Uma candidata a ser contratada para um item: "Banda X, R$ 8.000".
 *
 * Existe só enquanto o item está "a contratar" — depois da despesa a escolha já aconteceu. Não some
 * quando o item é contratado: fica como o registro de por que a turma escolheu aquela.
 */
export interface Proposta {
  id: string
  titulo: string
  valor_em_centavos: number
  /** O que ela entrega, em Markdown. Nulo: só o nome e o preço. */
  o_que_inclui: string | null
  /** Quantos formandos escolheram esta. Contagem, nunca contador gravado. */
  votos: number
  /** Se o voto de quem está lendo é nesta. */
  meu_voto: boolean
}

/** Um item com as candidatas levantadas para ele — o painel da direita. Espelha `ItemDaFestaDetalheDTO`. */
export interface ItemDaFestaDetalhe {
  item: ItemDaFesta
  propostas: Proposta[]
}

/** Uma proposta como a tela a envia. Espelha `PropostaRequestDTO`. */
export interface DadosDaProposta {
  titulo: string
  valor_em_centavos: number
  o_que_inclui?: string
}
