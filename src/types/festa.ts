import type { CategoriaDeDespesa } from './financeiro'

/**
 * Em que pé está um item da festa.
 *
 * Nunca é gravado: o backend o lê das despesas vinculadas a cada consulta. Lançar ou pagar uma
 * despesa muda o selo do cartão sem ninguém editar o item.
 */
export type EstadoDoItem = 'AContratar' | 'Contratado' | 'Pago' | 'Cancelado'

/** Quem paga um item: a turma inteira, pelo plano de cobrança, ou só quem quiser. */
type TipoDeRateio = 'Turma' | 'PorFormando'

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
interface DocumentoDoItem {
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
  /**
   * Preço unitário do item opcional ligado a este (Sprint 20, decisão 11). Nulo: a turma não
   * abriu a venda, e o custo continua saindo da estimativa.
   *
   * Ligado, ele manda no cartão: é por ele que a turma cobra, e dois preços para a mesma foto é
   * exatamente a divergência que o vínculo existe para fechar.
   */
  preco_de_venda_em_centavos: number | null
  /** Unidades já pedidas pelos formandos — o "37" de "R$ 350,00 × 37 pedidos". */
  pedidos_confirmados: number
  /** O item opcional ligado, se houver. */
  item_de_cobranca_id: string | null
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
 * quando o item é contratado: fica como o registro de por que a comissão escolheu aquela.
 */
export interface Proposta {
  id: string
  titulo: string
  valor_em_centavos: number
  /** O que ela entrega, em Markdown. Nulo: só o nome e o preço. */
  o_que_inclui: string | null
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

/**
 * O evento que o convite da festa imprime, com os horários que as telas precisam (Sprint 21).
 *
 * `fechamento_da_lista` é 24 h antes (P5): até ali o formando troca nomes. A janela da portaria vai
 * de 6 h antes a 12 h depois do horário (P7). Espelha `EventoDoConviteDTO`.
 */
export interface EventoDoConvite {
  id: string
  tipo: 'Festa' | 'Colacao'
  titulo: string
  data: string
  hora: string | null
  local: string | null
  completo: boolean
  fechamento_da_lista: string
  janela_abre_em: string
}

/**
 * A situação dos convites da festa, para a Gestão.
 *
 * Mora em `types/` porque a portaria (feature `festa`) e o aviso da agenda (feature `agenda`) leem o
 * mesmo resumo: quando a festa é antecipada, a agenda avisa quantos pedidos ficaram com parcela
 * vencendo depois do fechamento da lista (P2.1). Espelha `ResumoDosConvitesDTO`.
 */
export interface ResumoDosConvites {
  evento: EventoDoConvite | null
  evento_completo: boolean
  emitidos: number
  sem_titular: number
  pedidos_quitados_sem_convite: number
  pedidos_com_parcela_depois_do_fechamento: number
}

/** Um formando com convite de pacote preso por parcela em atraso (Sprint 47, D24). Espelha `FormandoComConvitePresoDTO`. */
export interface FormandoComConvitePreso {
  vinculo_id: string
  nome: string
  convites: number
}

/**
 * O painel de convites de um evento — a festa ou a colação —, na Gestão (Sprint 47, sucessor da cota da Sprint 30).
 *
 * Mora em `types/` porque é convite da festa lido pela agenda. Os convites vêm dos pacotes das cestas e saem
 * sozinhos; `excedente` é aviso, não bloqueio. Espelha `PainelDeConvitesDTO`.
 */
export interface PainelDeConvites {
  evento: EventoDoConvite
  capacidade: number | null
  formandos_ativos: number
  /** Convites que os pacotes das cestas concedem neste evento. */
  beneficios: number
  /** Comprados — pedido de convite extra e loja. */
  extras: number
  cortesias: number
  /** Benefícios + extras + cortesias. */
  lugares: number
  /** Quanto `lugares` passa da capacidade; zero se cabe. */
  excedente: number
  /** Convites de pacote válidos — menos que os benefícios enquanto o evento não tem hora e local. */
  emitidos: number
  nomeados: number
  sem_nome: number
  presos: FormandoComConvitePreso[]
}

/** O documento do convidado (P5.1). Espelha `TipoDeDocumento`. */
export type TipoDeDocumento = 'Cpf' | 'Rg'

export const ROTULOS_DE_DOCUMENTO = { Cpf: 'CPF', Rg: 'RG' } as const satisfies Record<
  TipoDeDocumento,
  string
>

/** Um convite de quem o tem — o formando ou o comprador da loja (Sprint 26). Espelha `MeuConviteDTO`. */
export interface MeuConvite {
  id: string
  sequencial: number
  codigo: string
  /**
   * Nulo enquanto "a definir": o link e o QR só existem com convidado. É vaga paga, não ingresso — o
   * link que circulasse antes valeria para quem fosse nomeado depois.
   */
  token: string | null
  nome_do_convidado: string | null
  tipo_do_documento: TipoDeDocumento | null
  documento: string | null
  email_do_convidado: string | null
  emitido_em: string
  validado_em: string | null
  /** O recado para a comissão. */
  observacoes: string | null
}

/** O titular, como o formulário o envia. Espelha `ConvidadoRequestDTO`. */
export interface DadosDoConvidado {
  nome: string
  tipo_do_documento: TipoDeDocumento | null
  numero_do_documento: string | null
  email: string | null
  /** Ausente na compra da loja: lá o comprador só diz quem vai. */
  observacoes?: string | null
}
