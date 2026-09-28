/** Uma mesa do jantar: nome, lugares e, se vendida, o dono (Sprint 27). */
export interface Mesa {
  id: string
  identificacao: string
  lugares: number
  observacao: string | null
  /** Fora da venda: "Mesa dos pais" (P3). Nunca tem dono. */
  reservada: boolean
  vinculo_id: string | null
  dono: string | null
}

/** Quem tem pedido confirmado de mesa, e quantas já tem no mapa. */
export interface CompradorDeMesa {
  vinculo_id: string
  nome: string
  compradas: number
  atribuidas: number
}

/** O mapa inteiro: a faixa do topo, as mesas e os compradores. */
export interface MapaDeMesas {
  mesas: number
  lugares: number
  reservadas: number
  com_dono: number
  mesas_por_atribuir: number
  lista: Mesa[]
  compradores: CompradorDeMesa[]
}

/** O corpo do cadastro de uma mesa. */
export interface DadosDaMesa {
  identificacao: string
  lugares: number
  observacao?: string
  reservada: boolean
}
