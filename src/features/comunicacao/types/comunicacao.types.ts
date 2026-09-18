import type { PaginacaoRequest } from '@/types/paginacao'

/** Para quem um aviso ou documento aparece. Espelha `Visibilidade` do backend. */
export type Visibilidade = 'Turma' | 'SomenteComissao'

/** A gaveta do acervo. Espelha `CategoriaDeDocumento`. */
export type CategoriaDeDocumento = 'Ata' | 'Contrato' | 'Orcamento' | 'Regulamento' | 'Outros'

/** Máximo de avisos fixados ao mesmo tempo — o quarto a API recusa com `comunicacao.limite_de_fixados`. */
export const LIMITE_DE_FIXADOS = 3

/** Teto de um documento, em MB — o mesmo `Documento.TamanhoMaximoEmMB` do backend, para avisar antes de enviar. */
export const TAMANHO_MAXIMO_DO_DOCUMENTO_EM_MB = 20

/** O que o acervo aceita: PDF, imagem, Word e Excel. Só filtra a janela do sistema; quem confere os bytes é a API. */
export const TIPOS_DE_DOCUMENTO =
  'application/pdf,image/png,image/jpeg,image/webp,.docx,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** Como cada visibilidade aparece no formulário e no detalhe. */
export const ROTULOS_DE_VISIBILIDADE = {
  Turma: 'A turma toda',
  SomenteComissao: 'Só a comissão',
} as const satisfies Record<Visibilidade, string>

/** A categoria no singular — o seletor e o filtro —, na ordem em que o acervo as agrupa. */
export const ROTULOS_DE_CATEGORIA = {
  Ata: 'Ata',
  Contrato: 'Contrato',
  Orcamento: 'Orçamento',
  Regulamento: 'Regulamento',
  Outros: 'Outros',
} as const satisfies Record<CategoriaDeDocumento, string>

/** A categoria no plural — o título de cada grupo do acervo. */
export const GRUPOS_DE_CATEGORIA = {
  Ata: 'Atas',
  Contrato: 'Contratos',
  Orcamento: 'Orçamentos',
  Regulamento: 'Regulamentos',
  Outros: 'Outros',
} as const satisfies Record<CategoriaDeDocumento, string>

/** Um aviso do mural. */
export interface Aviso {
  id: string
  titulo: string
  /** Markdown cru — só se exibe por `TextoEmMarkdown`, que sanitiza. */
  conteudo: string
  visibilidade: Visibilidade
  fixado: boolean
  destaque: boolean
  publicado_em: string
  atualizado_em: string
  publicado_por_usuario_id: string
  /** Ausente se a conta de quem publicou não existir mais (`WhenWritingNull`). */
  autor?: string
}

/** O que a comissão escreve num aviso. */
export interface DadosDoAviso {
  titulo: string
  conteudo: string
  visibilidade: Visibilidade
  fixado: boolean
  destaque: boolean
}

/** Filtros do mural. */
export interface FiltroDeAvisos extends PaginacaoRequest {
  fixado?: boolean
  destaque?: boolean
  visibilidade?: Visibilidade
  /** Publicados neste intervalo de dias (`aaaa-mm-dd`), as duas pontas inclusive. */
  de?: string
  ate?: string
  busca?: string
}

/** O mural em números, dentro do que quem consulta pode ver — as contagens das pílulas. */
export interface ResumoDoMural {
  quantidade: number
  fixados: number
  importantes: number
  /** Quantos são só da comissão; zero para quem não os vê. */
  internos: number
  /** Ausente com o mural vazio. */
  ultima_publicacao?: string
}

/** Um documento do acervo. */
export interface Documento {
  id: string
  titulo: string
  categoria: CategoriaDeDocumento
  visibilidade: Visibilidade
  /** 1 no primeiro envio, mais um a cada substituição. */
  versao: number
  nome_do_arquivo: string
  content_type: string
  /** Em bytes. */
  tamanho: number
  enviado_em: string
  /** Ausente se a conta de quem enviou não existir mais. */
  enviado_por?: string
}

/** O que a comissão preenche num documento. */
export interface DadosDoDocumento {
  titulo: string
  categoria: CategoriaDeDocumento
  visibilidade: Visibilidade
}

/** O acervo em números, dentro do que quem consulta pode ver. */
export interface ResumoDoAcervo {
  quantidade: number
  bytes: number
  /** Ausente com o acervo vazio. */
  ultimo_envio?: string
  /** Só as categorias que têm algum documento. */
  por_categoria: { categoria: CategoriaDeDocumento; quantidade: number }[]
}

/** Filtros do acervo. */
export interface FiltroDeDocumentos extends PaginacaoRequest {
  categoria?: CategoriaDeDocumento
  busca?: string
}

/** O tipo do arquivo, como o acervo filtra: pelo `content_type` que a API decidiu pela extensão. */
export type TipoDeArquivo = 'pdf' | 'planilha' | 'word' | 'imagem'

/** Como cada tipo aparece no filtro. */
export const ROTULOS_DE_TIPO = {
  pdf: 'PDF',
  planilha: 'Planilhas',
  word: 'Word',
  imagem: 'Imagens',
} as const satisfies Record<TipoDeArquivo, string>

/** O tipo de um arquivo; ausente se não for nenhum dos que o acervo conhece. */
export function tipoDoArquivo(content_type: string): TipoDeArquivo | undefined {
  if (content_type === 'application/pdf') return 'pdf'
  if (content_type.startsWith('image/')) return 'imagem'
  if (content_type.includes('spreadsheetml')) return 'planilha'
  if (content_type.includes('wordprocessingml')) return 'word'
  return undefined
}

/** Um aviso no sino: o mínimo para reconhecê-lo e abri-lo. */
export interface NovidadeDoMural {
  id: string
  titulo: string
  publicado_em: string
  destaque: boolean
}

/**
 * O que entrou no mural desde a última visita desta pessoa.
 *
 * `quantidade` é o total e vai no selo; `itens` traz só os primeiros — trinta avisos novos não
 * viram trinta linhas num balão de cabeçalho.
 */
export interface NovidadesDoMural {
  quantidade: number
  itens: NovidadeDoMural[]
}
