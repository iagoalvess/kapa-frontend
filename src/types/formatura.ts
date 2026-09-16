/** Ciclo de vida da formatura. Espelha `StatusDaFormatura`. */
export type StatusDaFormatura =
  'Rascunho' | 'AguardandoPagamento' | 'Ativa' | 'Suspensa' | 'Encerrada' | 'Descartada'

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
}
