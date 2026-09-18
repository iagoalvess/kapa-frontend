import type { TipoDeDocumento } from '@/config/legal'
import type { ConsentimentoDoUsuario } from '@/types/legal'

export type { AceiteDeDocumento, ConsentimentoDoUsuario, DocumentoLegal } from '@/types/legal'

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
