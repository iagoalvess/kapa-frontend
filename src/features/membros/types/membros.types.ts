import type { Papel } from '@/config/perfis'
import type { PaginacaoRequest } from '@/types/paginacao'

/**
 * Membro da formatura selecionada, com o cadastro. Espelha `MembroDaFormaturaDTO`.
 *
 * A API omite campo nulo (`WhenWritingNull`): sem nome civil informado, `nome_completo` chega
 * `undefined`.
 */
export interface MembroDaFormatura {
  usuario_id: string
  nome: string
  email: string
  papel: Papel
  ativo: boolean
  nome_completo?: string
  /** De 0 a 100. */
  completude: number
  /** Falta nome completo, CPF ou telefone. */
  essencial_pendente: boolean
  /**
   * Se aderiu ao termo. Decide a porta de saída da linha: com adesão é Desligar (cancela dívida),
   * sem ela é Remover (não toca em dinheiro).
   */
  tem_adesao: boolean
  /**
   * Quando saiu da turma, em UTC. Ausente em quem está nela e em quem foi **removido** — é o que
   * separa as duas situações de `ativo: false`.
   */
  desligado_em?: string
  motivo_do_desligamento?: MotivoDeSaida
  /** A justificativa, preenchida só quando o motivo é `Outro`. */
  detalhe_do_desligamento?: string
}

/** Recorte por situação do cadastro. `Pendente` é quem ainda não tem o essencial. */
export type SituacaoDoCadastro = 'Pendente' | 'Incompleto' | 'Completo'

/** Filtros de `GET /api/v1/formaturas/atual/membros`. */
export interface FiltroDeMembros extends PaginacaoRequest {
  /** Trecho do nome de exibição, do nome civil ou do e-mail. */
  busca?: string
  /** `true` só ativos, `false` só quem saiu; ausente traz todos. */
  ativo?: boolean
  /** Só este papel; ausente traz todos. */
  papel?: Papel
  /** Só esta situação do cadastro; ausente traz todas. */
  cadastro?: SituacaoDoCadastro
  /**
   * `true` só desligados, `false` só quem nunca foi; ausente traz todos. Com `ativo: false`, é o
   * que separa desligado de removido.
   */
  desligado?: boolean
}

/** Quantos vínculos a formatura tem num papel e numa situação. Espelha `ContagemDeMembrosDTO`. */
export interface ContagemDeMembros {
  papel: Papel
  ativo: boolean
  /** Se saiu por desligamento. Com `ativo: false`, separa desligado de removido. */
  desligado: boolean
  /** Se falta nome completo, CPF ou telefone no cadastro. */
  essencial_pendente: boolean
  quantidade: number
}

/**
 * Por que alguém saiu da turma. Espelha `MotivoDeSaida` do backend.
 *
 * `Outro` é o único que exige — e o único que guarda — a justificativa por escrito.
 */
export const MOTIVOS_DE_SAIDA = {
  Trancamento: 'Trancamento de matrícula',
  Transferencia: 'Transferência de instituição',
  FormaturaEmOutraTurma: 'Vai se formar em outra turma',
  DesistenciaDaFesta: 'Desistiu da festa',
  DificuldadeFinanceira: 'Dificuldade financeira',
  Outro: 'Outro',
} as const

export type MotivoDeSaida = keyof typeof MOTIVOS_DE_SAIDA

/**
 * O que o desligamento vai mexer. Espelha `ResumoDaSaidaDTO`.
 *
 * O atraso é um recorte do que está em aberto, e não uma parcela a mais: somar as duas linhas
 * contaria a mesma parcela vencida duas vezes.
 */
export interface ResumoDaSaida {
  nome: string
  /** `false` quer dizer que a ação certa é Remover, não Desligar. */
  tem_adesao: boolean
  ja_pago_em_centavos: number
  parcelas_em_aberto: number
  em_aberto_em_centavos: number
  parcelas_em_atraso: number
  em_atraso_em_centavos: number
}

/** Corpo de `POST /membros/{id}/desligar`. Espelha `DesligarMembroRequestDTO`. */
export interface DesligarMembro {
  motivo: MotivoDeSaida
  /** Obrigatório quando o motivo é `Outro`; ignorado nos demais. */
  detalhe?: string
  /** Cancela também o que já venceu e não foi pago. */
  cancelar_atraso: boolean
}
