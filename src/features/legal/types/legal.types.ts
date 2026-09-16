import type { TipoDeDocumento } from '@/config/legal'

export type { AceiteDeDocumento, DocumentoLegal } from '@/types/legal'

/** Uma linha do histórico de consentimento. Espelha `ConsentimentoDoUsuarioDTO`. */
export interface ConsentimentoDoUsuario {
  tipo: TipoDeDocumento
  versao: string
  aceito_em: string
  revogado: boolean
}

/** Versão vigente ainda não aceita. Espelha `AceitePendenteDTO`. */
export interface AceitePendente {
  tipo: TipoDeDocumento
  versao: string
}

/** Resposta de `GET /api/v1/legal/meus-aceites`. */
export interface MeusAceites {
  historico: ConsentimentoDoUsuario[]
  pendencias: AceitePendente[]
}
