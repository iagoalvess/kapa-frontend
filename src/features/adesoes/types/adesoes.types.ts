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
export interface ParcelaAceita {
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
}

/**
 * O que a tela mostra antes do aceite. Espelha `ConteudoParaAdesaoDTO`.
 *
 * Parte ausente é o que falta à turma: sem termo publicado, sem plano em vigor. O hash só vem com os
 * dois, e é ele que volta no aceite.
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
export type PendenciaDoCadastro = 'nome_completo' | 'cpf' | 'data_de_nascimento'

/** A situação do próprio formando. Espelha `MinhaAdesaoDTO`. */
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
  versao_vigente: number | null
}
