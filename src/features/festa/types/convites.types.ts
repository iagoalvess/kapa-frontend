import type { EventoDoConvite } from '@/types/festa'

// O convite de quem o tem e o titular sobem para `types/festa`: a loja pública (Sprint 26) nomeia os mesmos convites.
export {
  type DadosDoConvidado,
  type MeuConvite,
  ROTULOS_DE_DOCUMENTO,
  type TipoDeDocumento,
} from '@/types/festa'
import type { MeuConvite } from '@/types/festa'

/** Os eventos que têm convite: a festa, pelos pedidos, e a colação, pela cota (Sprint 30). */
export type TipoDoEventoDoConvite = EventoDoConvite['tipo']

export const ROTULOS_DO_EVENTO = { Festa: 'Festa', Colacao: 'Colação' } as const satisfies Record<
  TipoDoEventoDoConvite,
  string
>

/** Como a portaria enxerga um convite agora. Espelha `SituacaoNaPortaria`. */
export type SituacaoNaPortaria = 'Valido' | 'SemTitular' | 'Validado' | 'Revogado'

export const ROTULOS_DE_SITUACAO = {
  Valido: 'Válido',
  SemTitular: 'Sem titular',
  Validado: 'Entrou',
  Revogado: 'Revogado',
} as const satisfies Record<SituacaoNaPortaria, string>

/** De onde veio o direito ao convite (decisão 14). Espelha `OrigemDoConvite`. */
export type OrigemDoConvite = 'Comprado' | 'Cota' | 'Cortesia' | 'Loja'

/** A página pública do convite. Espelha `ConvitePublicoDTO`. */
export interface ConvitePublico {
  turma: string
  instituicao: string
  evento: EventoDoConvite
  codigo: string
  /** Código com a assinatura — é o que vai no QR e no link. */
  token: string
  /** Sempre presente: convite "a definir" não tem página (a API responde 404). */
  nome_do_convidado: string
  /** Mascarado: `RG ••••6789`. */
  documento: string | null
}

/** Os convites do formando para a festa. Espelha `MeusConvitesDTO`. */
export interface MeusConvites {
  evento: EventoDoConvite | null
  lista_aberta: boolean
  convites: MeuConvite[]
  /** Unidades pedidas que ainda não viraram convite — só sai quitado (P2). */
  aguardando_pagamento: number
}

/** A entrada de um convite. Espelha `EntradaNaPortariaDTO`. */
export interface EntradaNaPortaria {
  check_in_id: string
  validado_em: string
  validado_por: string
  validado_por_usuario_id: string
}

/** Um convite na portaria. Espelha `ConviteNaPortariaDTO`. */
export interface ConviteNaPortaria {
  id: string
  evento_id: string
  codigo: string
  nome_do_convidado: string | null
  documento: string | null
  convidado_de: string | null
  origem: OrigemDoConvite
  situacao: SituacaoNaPortaria
  motivo_da_revogacao: string | null
  entrada: EntradaNaPortaria | null
  entrou_sem_rede_duas_vezes: boolean
}

/** Um convite aberto na portaria. Espelha `ConsultaNaPortariaDTO`. */
export interface ConsultaNaPortaria {
  convite: ConviteNaPortaria
  evento: EventoDoConvite
  janela_aberta: boolean
}

/** A lista da portaria. Espelha `ListaDaPortariaDTO`. */
export interface ListaDaPortaria {
  evento: EventoDoConvite
  total: number
  validados: number
  sem_titular: number
  janela_aberta: boolean
  gerada_em: string
  convites: ConviteNaPortaria[]
}

/** Uma entrada marcada sem rede, esperando para subir (decisão 16). */
export interface EntradaSemRede {
  codigo: string
  validado_em: string
  aparelho: string
}

/** O que a sincronização fez. Espelha `ResultadoDaSincronizacaoDTO`. */
export interface ResultadoDaSincronizacao {
  validadas: number
  repetidas: number
  recusadas: number
}
