/** O desenho da mesa no mapa. */
export type FormatoDaMesa = 'Redonda' | 'Retangular'

/** Uma mesa do jantar: nome, lugares, o lugar no mapa e, se vendida, o dono (Sprint 27). */
export interface Mesa {
  id: string
  identificacao: string
  lugares: number
  observacao: string | null
  /** Fora da venda: "Mesa dos pais" (P3). Nunca tem dono. */
  reservada: boolean
  vinculo_id: string | null
  dono: string | null
  formato: FormatoDaMesa
  /** Centro da mesa no salão, em centímetros; `null` enquanto ela está fora do mapa. */
  x: number | null
  y: number | null
  /** Retangular em pé (90°). */
  girada: boolean
}

/** Quem tem pedido confirmado de mesa, e quantas já tem no mapa. */
export interface CompradorDeMesa {
  vinculo_id: string
  nome: string
  compradas: number
  atribuidas: number
}

/** O que um elemento do salão representa — dá o ícone. */
export type TipoDeElemento =
  'Palco' | 'Pista' | 'Bar' | 'Buffet' | 'Entrada' | 'Saida' | 'Banheiro' | 'Som' | 'Area' | 'Divisoria'

/** As cores de uma área: as do mapa, e só elas. */
export type CorDaArea = 'Laranja' | 'Amarelo' | 'Lilas' | 'Cinza'

/** Um retângulo do salão, em centímetros a partir do canto de cima à esquerda. */
export interface ElementoDoSalao {
  tipo: TipoDeElemento
  rotulo: string
  x: number
  y: number
  largura: number
  altura: number
  cor: CorDaArea | null
}

/** O salão: tamanho, em centímetros, e o que há nele além das mesas. */
export interface PlantaDoSalao {
  largura: number
  altura: number
  elementos: ElementoDoSalao[]
}

/** O mapa inteiro da Gestão: a faixa do topo, as mesas, os compradores e o salão. */
export interface MapaDeMesas {
  mesas: number
  lugares: number
  reservadas: number
  com_dono: number
  mesas_por_atribuir: number
  lista: Mesa[]
  compradores: CompradorDeMesa[]
  salao: PlantaDoSalao
}

/** O corpo do cadastro de uma mesa. */
export interface DadosDaMesa {
  identificacao: string
  lugares: number
  observacao?: string
  reservada: boolean
  formato: FormatoDaMesa
}

/** Onde fica uma mesa; `x` e `y` nulos a tiram do mapa. */
export interface PosicaoDaMesa {
  mesa_id: string
  x: number | null
  y: number | null
  girada: boolean
}

/** O corpo do "Salvar mapa": os elementos e as mesas que mudaram de lugar. */
export interface DesenhoDoSalao {
  elementos: ElementoDoSalao[]
  posicoes: PosicaoDaMesa[]
}

/** Uma mesa no mapa do formando: sem o dono, com a marca de "é sua". */
export interface MesaNoSalao {
  id: string
  identificacao: string
  lugares: number
  reservada: boolean
  formato: FormatoDaMesa
  x: number | null
  y: number | null
  girada: boolean
  minha: boolean
}

/** O mapa como o formando o vê. */
export interface SalaoDoFormando {
  salao: PlantaDoSalao
  mesas: MesaNoSalao[]
}
