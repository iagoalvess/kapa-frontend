import type { TipoDeDocumento } from '@/config/legal'

/** Uma versão de documento legal. Espelha `DocumentoLegalDTO`. */
export interface DocumentoLegal {
  id: string
  tipo: TipoDeDocumento
  versao: string
  /** Texto integral em markdown. */
  conteudo: string
  vigente_desde: string
}

/** A versão que o usuário leu e aceitou. Espelha `AceiteDeDocumentoDTO`. */
export interface AceiteDeDocumento {
  tipo: TipoDeDocumento
  versao: string
}

/**
 * Uma linha do histórico de consentimento. Espelha `ConsentimentoDoUsuarioDTO`.
 *
 * Mora aqui, e não na feature `legal`, porque o portal de privacidade (feature `privacidade`) lista
 * o mesmo histórico e é de lá que sai a revogação — e uma feature não importa de outra.
 */
export interface ConsentimentoDoUsuario {
  /** É por ele que a revogação aponta: `POST /privacidade/consentimentos/{id}/revogar`. */
  id: string
  tipo: TipoDeDocumento
  versao: string
  aceito_em: string
  revogado: boolean
}
