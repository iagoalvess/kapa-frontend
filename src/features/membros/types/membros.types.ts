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
}

/** Recorte por situação do cadastro. `Pendente` é quem ainda não tem o essencial. */
export type SituacaoDoCadastro = 'Pendente' | 'Incompleto' | 'Completo'

/** Filtros de `GET /api/v1/formaturas/atual/membros`. */
export interface FiltroDeMembros extends PaginacaoRequest {
  /** Trecho do nome de exibição, do nome civil ou do e-mail. */
  busca?: string
  /** `true` só ativos, `false` só removidos; ausente traz todos. */
  ativo?: boolean
  /** Só este papel; ausente traz todos. */
  papel?: Papel
  /** Só esta situação do cadastro; ausente traz todas. */
  cadastro?: SituacaoDoCadastro
}

/** Quantos vínculos a formatura tem num papel e numa situação. Espelha `ContagemDeMembrosDTO`. */
export interface ContagemDeMembros {
  papel: Papel
  ativo: boolean
  quantidade: number
}
