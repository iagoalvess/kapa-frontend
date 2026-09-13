import type { Papel } from '@/config/perfis'

/** Situação de um convite. `Aceito` é "usos esgotados" — no nominal, a pessoa entrou. */
export type StatusDoConvite = 'Pendente' | 'Aceito' | 'Expirado' | 'Revogado'

/** O que o convidado vê antes de entrar. Espelha `ConvitePublicoDTO`. */
export interface ConvitePublico {
  turma: string
  instituicao: string
  papel: Papel
  /** Só no convite pessoal: para qual e-mail foi, mascarado (`a*****a@gmail.com`). */
  emailMascarado?: string
}

/**
 * Convite como a comissão o acompanha. Espelha `ConviteResumoDTO` — sem link: ele só vem na criação.
 *
 * A API omite campo nulo (`WhenWritingNull`): no link da turma `email` nem chega, e comparar com
 * `null` o trataria como convite nominal.
 */
export interface ConviteResumo {
  id: string
  /** Ausente no link da turma. */
  email?: string
  papel: Papel
  expiraEm: string
  /** Ausente é ilimitado até expirar. */
  usosMaximos?: number
  usosFeitos: number
  status: StatusDoConvite
  criadoEm: string
}

/** Corpo de `POST /formaturas/atual/convites`. Sem e-mail, cria o link da turma. */
export interface CriarConvite {
  email?: string
  papel?: Papel
  diasDeValidade?: number
  usosMaximos?: number
}

/** Convite recém-criado. É a única vez que o link aparece. */
export interface ConviteCriado {
  id: string
  link: string
  expiraEm: string
}
