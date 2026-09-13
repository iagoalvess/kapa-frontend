import type { Papel } from '@/config/perfis'
import type { PaginacaoRequest } from '@/types/paginacao'

/** Membro da formatura selecionada. Espelha `MembroDaFormaturaDTO`. */
export interface MembroDaFormatura {
  usuarioId: string
  nome: string
  email: string
  papel: Papel
  ativo: boolean
}

/** Filtros de `GET /api/v1/formaturas/atual/membros`. */
export interface FiltroDeMembros extends PaginacaoRequest {
  /** Trecho do nome ou do e-mail. */
  busca?: string
  /** `true` só ativos, `false` só removidos; ausente traz todos. */
  ativo?: boolean
  /** Só este papel; ausente traz todos. */
  papel?: Papel
}

/** Quantos vínculos a formatura tem num papel e numa situação. Espelha `ContagemDeMembrosDTO`. */
export interface ContagemDeMembros {
  papel: Papel
  ativo: boolean
  quantidade: number
}
