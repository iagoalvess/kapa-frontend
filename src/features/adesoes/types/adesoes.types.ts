import type { Papel } from '@/config/perfis'
import type { TipoDeCobranca } from '@/types/cobranca'
import type { PaginacaoRequest } from '@/types/paginacao'

/** Uma versão do termo, com o texto. Espelha `VersaoDoTermoDTO`. */
export interface VersaoDoTermo {
  id: string
  versao: number
  /** Markdown. */
  conteudo: string
  vigente_desde: string
}

/** Uma versão na lista do Presidente. Espelha `TermoPublicadoDTO`. */
export interface TermoPublicado {
  id: string
  versao: number
  vigente_desde: string
  /** Quantos aceitaram esta versão. */
  adesoes: number
}

/** Um item do plano, como foi (ou será) aceito. Espelha `ItemAceitoDTO`. */
export interface ItemAceito {
  tipo: TipoDeCobranca
  descricao: string | null
  /** Total por formando, em centavos. */
  valor_em_centavos: number
  numero_de_parcelas: number
  dia_de_vencimento: number
  /** `aaaa-mm-dd`, dia 1. */
  primeiro_mes: string
}

/** Uma parcela da grade aceita. Espelha `ParcelaSimuladaDTO`. */
interface ParcelaAceita {
  tipo: TipoDeCobranca
  descricao: string | null
  numero: number
  /** Total de parcelas do item — o "24" de "1/24". */
  de: number
  vencimento: string
  valor_em_centavos: number
}

/**
 * O plano congelado: o que o formando aceita pagar. Espelha `PlanoAceitoDTO`.
 *
 * Percentuais em base 10.000: `200` é 2%.
 */
export interface PlanoAceito {
  percentual_de_multa: number
  percentual_de_juros_ao_mes: number
  carencia_em_dias: number
  percentual_de_desconto_por_antecipacao: number
  dias_minimos_para_desconto: number
  itens: ItemAceito[]
  parcelas: ParcelaAceita[]
  total_em_centavos: number
  /** O quadro de escolhas: os pacotes contratados (Sprint 47). Nulo nas adesões anteriores à cesta. */
  cesta: PacoteDaCesta[] | null
}

/** Um pacote do quadro de escolhas, como foi congelado no aceite. Espelha `PacoteDaCestaDTO`. */
export interface PacoteDaCesta {
  item_id: string
  /** Grupo de faixas ("Festa"); nulo é pacote avulso. */
  grupo: string | null
  tipo: TipoDeCobranca
  descricao: string | null
  valor_em_centavos: number
  convites_da_festa: number
  convites_da_colacao: number
}

/** Um pacote do catálogo, como o formando o vê na adesão. Espelha `PacoteDoCatalogoDTO`. */
export interface PacoteDoCatalogo {
  id: string
  /** Pacotes do mesmo grupo são faixas: a cesta aceita uma. */
  grupo: string | null
  tipo: TipoDeCobranca
  descricao: string | null
  valor_em_centavos: number
  /** Em quantas parcelas quem adere hoje paga — menos que o item, para quem chega tarde. */
  numero_de_parcelas: number
  convites_da_festa: number
  convites_da_colacao: number
}

/**
 * O que a tela mostra antes do aceite. Espelha `ConteudoParaAdesaoDTO`.
 *
 * Parte ausente é o que falta à turma: sem termo publicado, sem plano em vigor. O plano e o hash são os da
 * cesta pedida em `?pacotes=` — trocar um pacote é pedir o conteúdo de novo, e é o hash dele que volta no aceite.
 */
export interface ConteudoParaAdesao {
  termo: VersaoDoTermo | null
  plano: PlanoAceito | null
  hash_do_conteudo: string | null
  /**
   * Cinco linhas geradas por IA sobre o termo vigente, ou `null` enquanto não existem. Fora do hash:
   * não é parte do que se aceita.
   */
  resumo: string | null
  /** Os pacotes à venda, de onde o formando monta a cesta. */
  catalogo: PacoteDoCatalogo[]
  /** A cesta de uma adesão anterior: a re-adesão a mantém, e mudá-la é a Sprint 48. Vazia para quem nunca aderiu. */
  cesta_contratada: string[]
}

/** Uma adesão, com o termo e o plano aceitos. Espelha `AdesaoDTO`. */
export interface Adesao {
  id: string
  versao: number
  aceito_em: string
  hash_do_conteudo: string
  nome_completo: string
  /** Só os 11 dígitos. */
  cpf: string
  /** E-mail que recebeu o código confirmado. Vazio nas adesões anteriores ao código. */
  email_do_aceite: string
  conteudo_do_termo: string
  plano: PlanoAceito
}

/** Para onde foi o código do aceite. Espelha `CodigoEnviadoDTO`. */
export interface CodigoEnviado {
  /** E-mail da conta, mascarado — `an*@kapa.dev`. */
  email: string
  valido_por_minutos: number
}

/** O que o cadastro precisa ter para aderir, como a API os nomeia. */
export type PendenciaDoCadastro = 'nomeCompleto' | 'cpf' | 'dataDeNascimento'

/** A situação do próprio formando. Espelha `MinhaAdesaoDTO`. */
/**
 * Só o que a guarda de adesão e o ponto do menu perguntam, sem o termo nem a adesão. Espelha
 * `SituacaoDaMinhaAdesaoDTO`.
 */
export interface SituacaoDaMinhaAdesao {
  /** A turma publicou o termo — com ele, o formando que não aderiu é levado ao aceite. */
  termo_publicado: boolean
  /** Há plano de cobrança vigente; sem ele o termo ainda não pode ser aceito. */
  plano_vigente: boolean
  /** O próprio membro aderiu a alguma versão do termo. */
  aderiu: boolean
}

export interface MinhaAdesao {
  adesao: Adesao | null
  pendencias: PendenciaDoCadastro[]
  /** Menos de 18 anos pela data de nascimento: a adesão é com a comissão, fora da plataforma. */
  menor_de_idade: boolean
}

/** Um membro no painel de adesões. Espelha `SituacaoDeAdesaoDTO`. */
export interface SituacaoDeAdesao {
  usuario_id: string
  nome: string
  email: string
  papel: Papel
  /** Nulos para quem não aderiu. */
  adesao_id: string | null
  versao: number | null
  aceito_em: string | null
  /** Os pacotes da cesta, com o detalhe livre de cada um (Sprint 48, D40). */
  cesta: PacoteEscolhido[]
}

/** Um pacote na cesta de um formando, no painel de adesões. Espelha `PacoteEscolhidoDTO`. */
export interface PacoteEscolhido {
  item_de_cobranca_id: string
  /** "Festa — Festa 15", ou o nome do pacote avulso. */
  rotulo: string
  observacao: string | null
}

/** Filtros de `GET /api/v1/adesoes`. */
export interface FiltroDeAdesoes extends PaginacaoRequest {
  /** `true` só quem aderiu, `false` só quem falta; ausente, todos. */
  aderiu?: boolean
  busca?: string
}

/** Espelha `ResumoDeAdesoesDTO`. */
export interface ResumoDeAdesoes {
  membros: number
  aderiram: number
}

/** O detalhe livre de um pacote — "beca M" (Sprint 48, D40). Fora do hash. */
export interface ObservacaoDoPacote {
  pacote_id: string
  texto: string
}

/** Um pacote na cesta do formando. Espelha `PacoteNaCestaDTO` (Sprint 48). */
export interface PacoteNaCesta {
  item_de_cobranca_id: string
  tipo: TipoDeCobranca
  descricao: string | null
  grupo: string | null
  /** O que as parcelas dele somam — o preço aceito, e não o de hoje. No grupo, somadas as faixas anteriores. */
  contratado_em_centavos: number
  convites_da_festa: number
  convites_da_colacao: number
  observacao: string | null
  /** Último dia para pedir o cancelamento; nulo, sem trava (D36). */
  cancelavel_ate: string | null
  cancelamento_solicitado: boolean
}

/** Um pacote que o aditivo pode acrescentar (D38). Espelha `PacoteDisponivelDTO`. */
export interface PacoteDisponivel {
  item_de_cobranca_id: string
  tipo: TipoDeCobranca
  descricao: string | null
  grupo: string | null
  valor_em_centavos: number
  /** O que o aditivo cobraria: o preço menos o já contratado na faixa que sai. */
  diferenca_em_centavos: number
  convites_da_festa: number
  convites_da_colacao: number
  /** A faixa do mesmo grupo que sai; nula quando é pacote novo. */
  substitui: string | null
}

/** A cesta e o que ainda se pode acrescentar. Espelha `MinhaCestaDTO`. */
export interface MinhaCesta {
  pacotes: PacoteNaCesta[]
  disponiveis: PacoteDisponivel[]
}

/** Um pacote que entra pelo aditivo. Espelha `MudancaDaCestaDTO`. */
interface MudancaDaCesta {
  entra: PacoteDaCesta
  sai: PacoteDaCesta | null
  ja_contratado_em_centavos: number
  diferenca_em_centavos: number
}

/** O aditivo antes do aceite. Espelha `PreviaDoAditivoDTO`. */
export interface PreviaDoAditivo {
  mudancas: MudancaDaCesta[]
  parcelas: ParcelaAceita[]
  total_em_centavos: number
  hash_do_conteudo: string
}
