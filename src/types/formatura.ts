/** Ciclo de vida da formatura. Espelha `StatusDaFormatura`. */
export type StatusDaFormatura = 'Ativa' | 'Suspensa' | 'Encerrada' | 'Descartada'

/** A formatura selecionada. Espelha `FormaturaDetalheDTO`. */
export interface FormaturaDetalhe {
  id: string
  nome: string
  instituicao: string
  curso: string
  ano: number
  semestre: number
  /** `yyyy-MM-dd`, sem hora nem fuso. */
  previsao_de_colacao: string | null
  /** `yyyy-MM-dd`, sem hora nem fuso. */
  previsao_da_festa: string | null
  quantidade_estimada_de_formandos: number
  status: StatusDaFormatura
  criado_em: string
  ativada_em: string | null
  encerrada_em: string | null
  /** Se a turma já contratou um plano alguma vez. Falsa é a turma no gratuito. */
  ja_contratou: boolean
}
