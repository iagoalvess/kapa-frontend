import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type {
  Alcance,
  DadosDoItem,
  DadosDoLancamento,
  Lancamento,
  DadosDoPlano,
  FiltroDeParcelas,
  Parcela,
  PlanoDeCobranca,
  PlanoDeCobrancaResumo,
  ResumoDeParcelas,
  SimulacaoDoPlano,
  SolicitacaoDeCancelamento,
  StatusDaSolicitacao,
} from '../types/cobrancas.types'

const BASE = '/api/v1/cobrancas'
const PLANOS = `${BASE}/planos`

/** Os planos da turma, o vigente primeiro. */
export function listarPlanos(signal?: AbortSignal) {
  return api.get<PlanoDeCobrancaResumo[]>(PLANOS, { signal })
}

/** Um plano, com os itens. */
export function obterPlano(planoId: string, signal?: AbortSignal) {
  return api.get<PlanoDeCobranca>(`${PLANOS}/${planoId}`, { signal })
}

/** Cria um plano em montagem, sem itens. */
export function criarPlano(dados: DadosDoPlano) {
  return api.post<PlanoDeCobranca>(PLANOS, { body: dados })
}

/** Altera nome e regras de atraso. */
export function atualizarPlano({ planoId, dados }: { planoId: string; dados: DadosDoPlano }) {
  return api.put<PlanoDeCobranca>(`${PLANOS}/${planoId}`, { body: dados })
}

/** Inclui um item; devolve o plano inteiro. */
export function adicionarItem({ planoId, dados }: { planoId: string; dados: DadosDoItem }) {
  return api.post<PlanoDeCobranca>(`${PLANOS}/${planoId}/itens`, { body: dados })
}

/** Altera um item; devolve o plano inteiro. */
export function alterarItem({
  planoId,
  itemId,
  dados,
}: {
  planoId: string
  itemId: string
  dados: DadosDoItem
}) {
  return api.put<PlanoDeCobranca>(`${PLANOS}/${planoId}/itens/${itemId}`, { body: dados })
}

/** Remove um item que nunca gerou parcela. */
export function removerItem({ planoId, itemId }: { planoId: string; itemId: string }) {
  return api.delete<PlanoDeCobranca>(`${PLANOS}/${planoId}/itens/${itemId}`)
}

/** Encerra um item: para de cobrar e cancela o que ainda não venceu. */
export function encerrarItem({ planoId, itemId }: { planoId: string; itemId: string }) {
  return api.post<PlanoDeCobranca>(`${PLANOS}/${planoId}/itens/${itemId}/encerrar`)
}

/**
 * A grade de um formando e o total da turma, sem gravar nada.
 *
 * @param itens Os do formulário; ausente, a API simula os gravados.
 */
export function simularPlano(planoId: string, itens: DadosDoItem[] | undefined, signal?: AbortSignal) {
  return api.post<SimulacaoDoPlano>(`${PLANOS}/${planoId}/simular`, { body: { itens }, signal })
}

/** Coloca o plano em vigor. Só o Presidente. */
export function vigorarPlano(planoId: string) {
  return api.post<PlanoDeCobranca>(`${PLANOS}/${planoId}/vigorar`)
}

/** Uma página das parcelas da turma. */
export function listarParcelas(filtro: FiltroDeParcelas, signal?: AbortSignal) {
  return api.get<Pagina<Parcela>>(`${BASE}/parcelas`, {
    query: {
      ...paginacaoNaQuery(filtro),
      usuario_id: filtro.usuario_id,
      status: filtro.status,
      de: filtro.de,
      ate: filtro.ate,
      busca: filtro.busca,
    },
    signal,
  })
}

/** Quantas parcelas e quanto somam por situação, nos mesmos filtros da lista (menos a situação). */
export function resumirParcelas(
  filtro: Omit<FiltroDeParcelas, 'status' | 'pagina' | 'tamanho'>,
  signal?: AbortSignal,
) {
  return api.get<ResumoDeParcelas>(`${BASE}/parcelas/resumo`, {
    query: { usuario_id: filtro.usuario_id, de: filtro.de, ate: filtro.ate, busca: filtro.busca },
    signal,
  })
}

/** Quantos de quem já aderiu o preço novo alcançaria, e quanto muda — a pergunta da D21, sem gravar nada. */
export function simularPreco(planoId: string, itemId: string, valorEmCentavos: number, signal?: AbortSignal) {
  return api.get<Alcance>(`${PLANOS}/${planoId}/itens/${itemId}/alcance-do-preco`, {
    query: { valor_em_centavos: valorEmCentavos },
    signal,
  })
}

/** Quantos formandos o rateio alcançaria hoje, e o total (D19). Alvo vazio é todos os que já aderiram. */
export function simularRateio(
  planoId: string,
  alvo: string[],
  valorEmCentavos: number,
  signal?: AbortSignal,
) {
  return api.get<Alcance>(`${PLANOS}/${planoId}/alcance-do-rateio`, {
    query: { alvo, valor_em_centavos: valorEmCentavos },
    signal,
  })
}

const SOLICITACOES = `${BASE}/solicitacoes-de-cancelamento`

/** As solicitações de cancelamento da turma — a fila da comissão. */
export function listarSolicitacoes(status: StatusDaSolicitacao | undefined, signal?: AbortSignal) {
  return api.get<SolicitacaoDeCancelamento[]>(SOLICITACOES, { query: { status }, signal })
}

/** Aprova: cancela o pacote ou o pedido, e o já pago vai para "a devolver". Só a tesouraria. */
export function aprovarSolicitacao(solicitacaoId: string) {
  return api.post<SolicitacaoDeCancelamento>(`${SOLICITACOES}/${solicitacaoId}/aprovar`)
}

/** Recusa, com o motivo que o formando lê. A cobrança volta no mesmo dia. */
export function recusarSolicitacao({ solicitacaoId, motivo }: { solicitacaoId: string; motivo: string }) {
  return api.post<SolicitacaoDeCancelamento>(`${SOLICITACOES}/${solicitacaoId}/recusar`, { body: { motivo } })
}

/** Os lançamentos avulsos da turma (Sprint 48, D23). */
export function listarLancamentos(signal?: AbortSignal) {
  return api.get<Lancamento[]>(`${BASE}/avulsas`, { signal })
}

/** Lança uma cobrança ou um crédito no vínculo de um formando. */
export function lancar(dados: DadosDoLancamento) {
  return api.post<Lancamento>(`${BASE}/avulsas`, { body: dados })
}

/** Um formando ativo da turma, como o seletor do lançamento o mostra. */
export interface FormandoDaTurma {
  usuario_id: string
  nome: string
  nome_completo: string | null
}

/**
 * Os membros ativos que batem com a busca — o seletor do lançamento avulso. O endpoint é o de Membros; a chamada mora
 * aqui porque uma feature não importa de outra.
 */
export function buscarFormandos(busca: string, signal?: AbortSignal) {
  return api.get<Pagina<FormandoDaTurma>>('/api/v1/formaturas/atual/membros', {
    query: { busca: busca || undefined, ativo: true, tamanho: 20 },
    signal,
  })
}
