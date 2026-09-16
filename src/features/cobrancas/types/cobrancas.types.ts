import type { StatusDaParcela, TipoDeCobranca } from '@/types/cobranca'
import type { PaginacaoRequest } from '@/types/paginacao'

// Tipo, rótulo e parcela moram em `types/cobranca`: `adesoes` e `pagamentos` mostram os mesmos itens.
export {
  emAberto,
  type Parcela,
  ROTULOS_DE_TIPO,
  rotuloDoItem,
  type StatusDaParcela,
  type TipoDeCobranca,
  type ValorDoDia,
} from '@/types/cobranca'

/** `Rascunho` é nome interno: na tela, "Em montagem". */
export type StatusDoPlano = 'Rascunho' | 'Vigente'

/**
 * Um item como a API recebe — no cadastro e na simulação. Espelha `ItemDeCobrancaRequestDTO`.
 *
 * Dinheiro em centavos, sempre inteiro: `valor_em_centavos` é o **total** por formando, que a API
 * divide nas parcelas.
 */
export interface DadosDoItem {
  tipo: TipoDeCobranca
  descricao?: string
  valor_em_centavos: number
  numero_de_parcelas: number
  /** De 1 a 31; no mês mais curto vale o último dia. */
  dia_de_vencimento: number
  /** `aaaa-mm-dd`, dia 1. */
  primeiro_mes: string
}

/** Um item gravado. Espelha `ItemDeCobrancaDTO`; a API omite os nulos. */
export interface ItemDeCobranca extends DadosDoItem {
  id: string
  encerrado_em?: string
  /** Já gerou parcela: não se remove, só se encerra, e só o valor muda. */
  em_uso: boolean
}

/**
 * Nome e regras de atraso. Espelha `PlanoDeCobrancaRequestDTO`.
 *
 * Percentuais em base 10.000: `200` é 2%.
 */
export interface DadosDoPlano {
  nome: string
  percentual_de_multa: number
  percentual_de_juros_ao_mes: number
  carencia_em_dias: number
  percentual_de_desconto_por_antecipacao: number
}

/** Espelha `PlanoDeCobrancaResumoDTO`. */
export interface PlanoDeCobrancaResumo {
  id: string
  nome: string
  status: StatusDoPlano
  vigente_desde?: string
}

/** Espelha `PlanoDeCobrancaDTO`. */
export interface PlanoDeCobranca extends DadosDoPlano {
  id: string
  status: StatusDoPlano
  vigente_desde?: string
  itens: ItemDeCobranca[]
  /** Quantos já aderiram. Item incluído agora vale só para quem aderir depois (decisão de 14/09/2026). */
  formandos_com_parcela: number
}

/** Espelha `ParcelaSimuladaDTO`. */
export interface ParcelaSimulada {
  tipo: TipoDeCobranca
  descricao?: string
  numero: number
  /** Total de parcelas do item — o "24" de "1/24". */
  de: number
  vencimento: string
  valor_em_centavos: number
}

/** Espelha `SimulacaoDoPlanoDTO`. */
export interface SimulacaoDoPlano {
  parcelas: ParcelaSimulada[]
  total_por_formando: number
  /** Membros ativos da turma hoje. */
  formandos: number
  total_da_turma: number
}

/** Filtros de `GET /api/v1/cobrancas/parcelas`. */
export interface FiltroDeParcelas extends PaginacaoRequest {
  usuario_id?: string
  status?: StatusDaParcela
  /** Trecho do nome da conta ou do nome civil. */
  busca?: string
  /** Vencimento a partir de, `aaaa-mm-dd`. */
  de?: string
  /** Vencimento até, `aaaa-mm-dd`. */
  ate?: string
}

/** Quantas parcelas e quanto somam. Espelha `SomaDeParcelasDTO`. */
export interface SomaDeParcelas {
  quantidade: number
  /** O original; nas pagas, o que entrou. */
  valor_em_centavos: number
}

/** A faixa da tela Parcelas, numa chamada. Espelha `ResumoDeParcelasDTO`. */
export interface ResumoDeParcelas {
  todas: SomaDeParcelas
  aberta: SomaDeParcelas
  vencida: SomaDeParcelas
  paga: SomaDeParcelas
  cancelada: SomaDeParcelas
  /** As vencidas pelo valor de hoje, com multa e juros. */
  vencido_atualizado_em_centavos: number
}
