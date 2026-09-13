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
  previsaoDeColacao: string | null
  quantidadeEstimadaDeFormandos: number
  status: StatusDaFormatura
  criadoEm: string
  ativadaEm: string | null
  encerradaEm: string | null
}
