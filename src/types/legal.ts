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
