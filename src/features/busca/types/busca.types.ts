import { FileText, FolderOpen, Handshake, Megaphone, Receipt, Users, type LucideIcon } from 'lucide-react'
import { type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS, rotaDaDespesa, rotaDoAviso, rotaDoFornecedor, rotaDoMembro } from '@/config/rotas'

/** De onde saiu um acerto. Espelha `TipoDeResultado` do backend. */
export type TipoDeResultado = 'Membro' | 'Despesa' | 'Fornecedor' | 'Aviso' | 'Documento'

/** Um acerto da busca. Espelha `ResultadoDaBuscaDTO`. */
export interface ResultadoDaBusca {
  tipo: TipoDeResultado
  id: string
  titulo: string
  /** A segunda linha, quando distingue dois acertos parecidos. Nulo quando o título basta. */
  detalhe: string | null
}

/** O que a busca achou, por grupo. Espelha `BuscaNaTurmaDTO`. */
export interface BuscaNaTurma {
  membros: ResultadoDaBusca[]
  despesas: ResultadoDaBusca[]
  fornecedores: ResultadoDaBusca[]
  avisos: ResultadoDaBusca[]
  documentos: ResultadoDaBusca[]
}

/** A partir de quantos caracteres a API responde — o mesmo `BuscaService.TamanhoMinimo`. */
export const TAMANHO_MINIMO = 3

/**
 * Como cada grupo aparece e para onde o clique leva.
 *
 * A rota mora aqui, e não na API: caminho de tela é assunto de quem desenha a tela. A ordem é a da
 * lista — gente primeiro, porque é o que mais se procura numa turma.
 */
export const GRUPOS: {
  chave: keyof BuscaNaTurma
  rotulo: string
  icone: LucideIcon
  para: (resultado: ResultadoDaBusca) => string
}[] = [
  { chave: 'membros', rotulo: 'Membros', icone: Users, para: (r) => rotaDoMembro(r.id) },
  { chave: 'despesas', rotulo: 'Despesas', icone: Receipt, para: (r) => rotaDaDespesa(r.id) },
  { chave: 'fornecedores', rotulo: 'Fornecedores', icone: Handshake, para: (r) => rotaDoFornecedor(r.id) },
  { chave: 'avisos', rotulo: 'Mural', icone: Megaphone, para: (r) => rotaDoAviso(r.id) },
  // O acervo não tem tela de um documento só: a lista abre com a busca já preenchida pelo título.
  {
    chave: 'documentos',
    rotulo: 'Documentos',
    icone: FolderOpen,
    para: (r) => `${ROTAS.documentos}?busca=${encodeURIComponent(r.titulo)}`,
  },
]

/** Ícone de quem não tem grupo — não deve acontecer, e é melhor que uma linha sem desenho. */
export const ICONE_PADRAO = FileText

/**
 * A segunda linha de um acerto, já em português.
 *
 * O papel do membro chega como o backend o grava — `Comissao`, sem cedilha, porque é valor de
 * contrato e não texto de tela. O de-para é o mesmo do resto do app, e mora em `config/perfis`:
 * uma feature não importa de outra, e este é o lugar comum das duas.
 */
export function detalheDe(resultado: ResultadoDaBusca) {
  if (resultado.detalhe === null) return null

  return resultado.tipo === 'Membro'
    ? (ROTULOS_DE_PAPEL[resultado.detalhe as Papel] ?? resultado.detalhe)
    : resultado.detalhe
}
