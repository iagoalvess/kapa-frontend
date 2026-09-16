import type { Papel } from '@/config/perfis'

/** Situação de um convite. `Aceito` é "usos esgotados" — no nominal, a pessoa entrou. */
export type StatusDoConvite = 'Pendente' | 'Aceito' | 'Expirado' | 'Revogado'

/** O que o convidado vê antes de entrar. Espelha `ConvitePublicoDTO`. */
export interface ConvitePublico {
  turma: string
  instituicao: string
  papel: Papel
  /** Só no convite pessoal: para qual e-mail foi, mascarado (`a*****a@gmail.com`). */
  email_mascarado?: string
}

/**
 * Convite como a comissão o acompanha. Espelha `ConviteResumoDTO`.
 *
 * A API omite campo nulo (`WhenWritingNull`): no link da turma `email` nem chega, e comparar com
 * `null` o trataria como convite nominal.
 */
export interface ConviteResumo {
  id: string
  /** Ausente no link da turma. */
  email?: string
  papel: Papel
  expira_em: string
  /** Ausente é ilimitado até expirar. */
  usos_maximos?: number
  usos_feitos: number
  status: StatusDoConvite
  criado_em: string
  /** Só no link da turma vigente: o endereço, para copiar de novo. */
  link?: string
}

/**
 * Corpo de `POST /formaturas/atual/convites`. Sem e-mail, cria o link da turma. Validade e limite
 * de entradas são fixos no backend.
 */
export interface CriarConvite {
  email?: string
  papel?: Papel
}

/** Convite recém-criado. No nominal, é a única vez que o link aparece. */
export interface ConviteCriado {
  id: string
  link: string
  expira_em: string
}
