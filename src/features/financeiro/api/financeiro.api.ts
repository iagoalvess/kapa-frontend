import { api } from '@/lib/http/cliente'
import type { Pagina } from '@/types/paginacao'
import type {
  Caixa,
  ContagemDeFornecedores,
  DadosDaDespesa,
  DadosDaOutraReceita,
  DadosDoFornecedor,
  Despesa,
  FiltroDeDespesas,
  FiltroDeFornecedores,
  FiltroDeOutrasReceitas,
  Fornecedor,
  NovaDespesa,
  NovaOutraReceita,
  ProjecaoDoCaixa,
  OutraReceita,
  ResumoDeDespesas,
  ResumoDeOutrasReceitas,
} from '../types/financeiro.types'

const BASE = '/api/v1/financeiro'
const FORNECEDORES = `${BASE}/fornecedores`
const DESPESAS = `${BASE}/despesas`
const OUTRAS_RECEITAS = `${BASE}/outras-receitas`
const CAIXA = `${BASE}/caixa`

/** Uma página do cadastro de fornecedores, por nome. */
export function listarFornecedores(filtro: FiltroDeFornecedores, signal?: AbortSignal) {
  return api.get<Pagina<Fornecedor>>(FORNECEDORES, { query: { ...filtro }, signal })
}

/** Quantos fornecedores ativos e inativos — os números das pílulas da tela. */
export function resumirFornecedores(signal?: AbortSignal) {
  return api.get<ContagemDeFornecedores>(`${FORNECEDORES}/resumo`, { signal })
}

/** Um fornecedor, para a tela de detalhe. */
export function obterFornecedor(id: string, signal?: AbortSignal) {
  return api.get<Fornecedor>(`${FORNECEDORES}/${id}`, { signal })
}

/** Cadastra um fornecedor. */
export function criarFornecedor(dados: DadosDoFornecedor) {
  return api.post<Fornecedor>(FORNECEDORES, { body: dados })
}

/** Altera o cadastro — inclusive a ativação. */
export function atualizarFornecedor({ id, dados }: { id: string; dados: DadosDoFornecedor }) {
  return api.put<Fornecedor>(`${FORNECEDORES}/${id}`, { body: dados })
}

/** Exclui um fornecedor sem despesa; com despesa, a API devolve `financeiro.fornecedor_em_uso`. */
export function excluirFornecedor(id: string) {
  return api.delete<void>(`${FORNECEDORES}/${id}`)
}

/** Uma página das despesas da turma, por vencimento. */
export function listarDespesas(filtro: FiltroDeDespesas, signal?: AbortSignal) {
  return api.get<Pagina<Despesa>>(DESPESAS, { query: { ...filtro }, signal })
}

/** Uma despesa, para a tela de detalhe. */
export function obterDespesa(id: string, signal?: AbortSignal) {
  return api.get<Despesa>(`${DESPESAS}/${id}`, { signal })
}

/** Quantas e quanto, por situação, no mesmo filtro da lista. */
export function resumirDespesas(
  filtro: Omit<FiltroDeDespesas, 'status' | 'pagina' | 'tamanho'>,
  signal?: AbortSignal,
) {
  return api.get<ResumoDeDespesas>(`${DESPESAS}/resumo`, { query: { ...filtro }, signal })
}

/**
 * Lança a despesa: uma linha à vista, N linhas na parcelada.
 *
 * Vai como multipart porque o comprovante pode vir junto (quando ela já nasce paga) — a mesma
 * porta serve os dois casos, em vez de dois endpoints que divergem.
 */
export function lancarDespesa({ dados, comprovante }: { dados: NovaDespesa; comprovante?: File }) {
  const corpo = new FormData()
  corpo.append('descricao', dados.descricao)
  corpo.append('categoria', dados.categoria)
  corpo.append('valor_em_centavos', String(dados.valor_em_centavos))
  corpo.append('numero_de_parcelas', String(dados.numero_de_parcelas))
  corpo.append('competencia', dados.competencia)
  corpo.append('vencimento', dados.vencimento)
  if (dados.fornecedor_id) corpo.append('fornecedor_id', dados.fornecedor_id)
  if (dados.paga_em) corpo.append('paga_em', dados.paga_em)
  if (comprovante) corpo.append('comprovante', comprovante)

  return api.post<Despesa[]>(DESPESAS, { body: corpo })
}

/** Corrige uma linha lançada — prevista ou paga. */
export function atualizarDespesa({ id, dados }: { id: string; dados: DadosDaDespesa }) {
  return api.put<Despesa>(`${DESPESAS}/${id}`, { body: dados })
}

/** Registra a saída do dinheiro. O comprovante é obrigatório. */
export function pagarDespesa({
  id,
  pago_em,
  comprovante,
}: {
  id: string
  pago_em: string
  comprovante: File
}) {
  const corpo = new FormData()
  corpo.append('pago_em', pago_em)
  corpo.append('comprovante', comprovante)

  return api.post<Despesa>(`${DESPESAS}/${id}/pagar`, { body: corpo })
}

/** Cancela uma despesa prevista. */
export function cancelarDespesa(id: string) {
  return api.post<Despesa>(`${DESPESAS}/${id}/cancelar`)
}

/** O caixa de hoje: arrecadado, gasto, saldo, a receber e o quadro por categoria. */
export function obterCaixa(signal?: AbortSignal) {
  return api.get<Caixa>(CAIXA, { signal })
}

/** O fluxo mês a mês: realizado até hoje, projetado até a colação. */
export function obterProjecao(signal?: AbortSignal) {
  return api.get<ProjecaoDoCaixa>(`${CAIXA}/projecao`, { signal })
}

/**
 * O comprovante de uma despesa, para abrir numa aba.
 *
 * Vem como blob porque o endpoint exige o bearer, e uma aba aberta por `href` não o manda — o
 * mesmo caminho do comprovante do formando na Conferência.
 */
export function baixarComprovante(despesaId: string) {
  return api.get<Blob>(`${DESPESAS}/${despesaId}/comprovante`, { resposta: 'blob' })
}

/** Uma página das receitas da turma, da mais recente. */
export function listarOutrasReceitas(filtro: FiltroDeOutrasReceitas, signal?: AbortSignal) {
  return api.get<Pagina<OutraReceita>>(OUTRAS_RECEITAS, { query: { ...filtro }, signal })
}

/** Quantas e quanto, por situação, no mesmo filtro da lista. */
export function resumirOutrasReceitas(
  filtro: Omit<FiltroDeOutrasReceitas, 'status' | 'atrasadas' | 'pagina' | 'tamanho'>,
  signal?: AbortSignal,
) {
  return api.get<ResumoDeOutrasReceitas>(`${OUTRAS_RECEITAS}/resumo`, { query: { ...filtro }, signal })
}

/**
 * Lança uma receita. Multipart, como a despesa: o comprovante pode ser enviado aqui — vira documento
 * do acervo, visível para a turma —, ou escolhido no acervo pelo `documento_id`.
 */
export function lancarOutraReceita({ dados, comprovante }: { dados: NovaOutraReceita; comprovante?: File }) {
  return api.post<OutraReceita>(OUTRAS_RECEITAS, {
    body: formularioDaReceita(dados, dados.recebida ?? false, comprovante),
  })
}

/** Corrige uma receita lançada — prevista ou recebida. O comprovante, se vier, nasce no acervo. */
export function atualizarOutraReceita({
  id,
  dados,
  comprovante,
}: {
  id: string
  dados: DadosDaOutraReceita
  comprovante?: File
}) {
  return api.put<OutraReceita>(`${OUTRAS_RECEITAS}/${id}`, {
    body: formularioDaReceita(dados, false, comprovante),
  })
}

/** A receita como multipart — campos em `snake_case`, como a API os lê no formulário. */
function formularioDaReceita(
  dados: DadosDaOutraReceita | NovaOutraReceita,
  recebida: boolean,
  comprovante?: File,
) {
  const corpo = new FormData()
  corpo.append('descricao', dados.descricao)
  corpo.append('categoria', dados.categoria)
  corpo.append('valor_em_centavos', String(dados.valor_em_centavos))
  corpo.append('data', dados.data)
  if (dados.origem) corpo.append('origem', dados.origem)
  if (dados.documento_id) corpo.append('documento_id', dados.documento_id)
  if ('recebida' in dados) corpo.append('recebida', String(recebida))
  if (comprovante) corpo.append('comprovante', comprovante)

  return corpo
}

/** Marca a prevista como recebida: é aqui que ela passa a contar no arrecadado e na meta. */
export function receberOutraReceita({ id, recebida_em }: { id: string; recebida_em: string }) {
  return api.post<OutraReceita>(`${OUTRAS_RECEITAS}/${id}/receber`, { body: { recebida_em } })
}

/** Cancela uma receita prevista — o patrocínio que não veio. */
export function cancelarOutraReceita(id: string) {
  return api.post<OutraReceita>(`${OUTRAS_RECEITAS}/${id}/cancelar`)
}
